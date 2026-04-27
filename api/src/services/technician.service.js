import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Create a per-request Supabase client using the user's own JWT.
// RLS policies in migration 003 handle row-level access for the technician role.
function makeClient(userToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
}

export async function getTodaysJobs(userToken) {
  const supabase = makeClient(userToken);
  const today = new Date().toISOString().split('T')[0];

  const jobSelect = `id, route_order, status, job_type, scheduled_date, started_at, completed_at,
    pools ( id, customers ( id, first_name, last_name, address ) )`;

  const [todayResult, outstandingResult] = await Promise.all([
    supabase
      .from('jobs')
      .select(jobSelect)
      .eq('scheduled_date', today)
      .order('route_order'),
    supabase
      .from('jobs')
      .select(jobSelect)
      .lt('scheduled_date', today)
      .in('status', ['pending', 'in_progress'])
      .order('scheduled_date', { ascending: false })
      .order('route_order'),
  ]);

  if (todayResult.error) throw todayResult.error;
  if (outstandingResult.error) throw outstandingResult.error;

  const seen = new Set();
  const jobs = [...(outstandingResult.data || []), ...(todayResult.data || [])].filter((j) => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });

  const poolIds = jobs.map((j) => j.pools?.id).filter(Boolean);
  const lastVisitsByPool = {};

  if (poolIds.length > 0) {
    const { data: records } = await supabase
      .from('service_records')
      .select('pool_id, completed_at, is_flagged, lsi_label')
      .in('pool_id', poolIds)
      .order('completed_at', { ascending: false });

    if (records) {
      for (const r of records) {
        if (!lastVisitsByPool[r.pool_id]) lastVisitsByPool[r.pool_id] = r;
      }
    }
  }

  return jobs.map((job) => {
    const pool = job.pools;
    const customer = pool?.customers;
    const lastVisit = pool ? lastVisitsByPool[pool.id] : null;

    return {
      id: job.id,
      routeOrder: job.route_order,
      status: job.status,
      jobType: job.job_type,
      scheduledDate: job.scheduled_date,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      customer: customer
        ? { name: `${customer.last_name}, ${customer.first_name}`, address: customer.address }
        : null,
      pool: pool ? { id: pool.id } : null,
      lastVisit: lastVisit
        ? { date: lastVisit.completed_at, isFlagged: lastVisit.is_flagged, lsiLabel: lastVisit.lsi_label }
        : null,
    };
  });
}

export async function getJobDetail(jobId, userToken) {
  const supabase = makeClient(userToken);

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      id, status, job_type, scheduled_date, started_at,
      pools (
        id, volume_litres, pool_type, surface_type, indoor_outdoor,
        gate_access, warnings, equipment_notes,
        customers ( id, first_name, last_name, address, phone )
      )
    `)
    .eq('id', jobId)
    .maybeSingle();

  if (error) throw error;
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const pool = job.pools;
  const customer = pool?.customers;
  let equipment = [];
  let lastVisits = [];

  if (pool?.id) {
    const [equipResult, visitsResult] = await Promise.all([
      supabase
        .from('pool_equipment')
        .select('id, name, equipment_type, manufacturer, model')
        .eq('pool_id', pool.id)
        .eq('active', true)
        .order('equipment_type'),
      supabase
        .from('service_records')
        .select('completed_at, is_flagged, lsi_label, lsi_score')
        .eq('pool_id', pool.id)
        .order('completed_at', { ascending: false })
        .limit(3),
    ]);

    equipment = (equipResult.data || []).map((e) => ({
      id: e.id,
      name: e.name,
      type: e.equipment_type,
      manufacturer: e.manufacturer,
      model: e.model,
    }));

    lastVisits = (visitsResult.data || []).map((r) => ({
      date: r.completed_at,
      isFlagged: r.is_flagged,
      lsiLabel: r.lsi_label,
      lsiScore: r.lsi_score,
    }));
  }

  return {
    id: job.id,
    status: job.status,
    jobType: job.job_type,
    scheduledDate: job.scheduled_date,
    startedAt: job.started_at,
    customer: customer
      ? { id: customer.id, name: `${customer.last_name}, ${customer.first_name}`, address: customer.address, phone: customer.phone }
      : null,
    pool: pool
      ? {
          id: pool.id,
          volumeLitres: pool.volume_litres,
          poolType: pool.pool_type,
          surfaceType: pool.surface_type,
          indoorOutdoor: pool.indoor_outdoor,
          gateAccess: pool.gate_access,
          warnings: pool.warnings,
          equipmentNotes: pool.equipment_notes,
        }
      : null,
    equipment,
    lastVisits,
  };
}

export async function startJob(jobId, userToken) {
  const supabase = makeClient(userToken);

  const { data: job, error: fetchErr } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (job.status === 'complete' || job.status === 'cancelled') {
    const err = new Error(`Job is already ${job.status}`);
    err.code = 'CONFLICT';
    throw err;
  }

  const { data: updated, error } = await supabase
    .from('jobs')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', jobId)
    .select('id, status, started_at')
    .single();

  if (error) throw error;
  return updated;
}

function readingStatus(value, min, max) {
  if (value < min) return 'low';
  if (value > max) return 'high';
  return 'good';
}

export async function completeJob(jobId, technicianId, userToken, payload) {
  const supabase = makeClient(userToken);

  const { data: job, error: fetchErr } = await supabase
    .from('jobs')
    .select('id, company_id, status, started_at, pools ( id, customers ( id ) )')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (job.status === 'complete') {
    const err = new Error('Job already completed');
    err.code = 'CONFLICT';
    throw err;
  }

  const { readings, lsi, treatments, notes, completedAt } = payload;
  const completedAtDate = completedAt ? new Date(completedAt) : new Date();
  const startedAt = job.started_at ? new Date(job.started_at) : completedAtDate;
  const durationSeconds = Math.max(0, Math.round((completedAtDate - startedAt) / 1000));

  const targets = {
    ph: { min: 7.2, max: 7.6 },
    chlorine: { min: 1.0, max: 3.0 },
    alkalinity: { min: 80, max: 120 },
    calcium: { min: 200, max: 400 },
    stabiliser: { min: 30, max: 50 },
  };

  const ph = Number(readings?.ph ?? 0);
  const chlorine = Number(readings?.freeChlorine ?? 0);
  const alkalinity = Number(readings?.alkalinity ?? 0);
  const calcium = Number(readings?.calciumHardness ?? 0);
  const stabiliser = Number(readings?.cyanuricAcid ?? 0);

  const readingsRecord = {
    ph: { value: ph, status: readingStatus(ph, targets.ph.min, targets.ph.max) },
    chlorine: { value: chlorine, status: readingStatus(chlorine, targets.chlorine.min, targets.chlorine.max) },
    alkalinity: { value: alkalinity, status: readingStatus(alkalinity, targets.alkalinity.min, targets.alkalinity.max) },
    calcium: { value: calcium, status: readingStatus(calcium, targets.calcium.min, targets.calcium.max) },
    stabiliser: { value: stabiliser, status: readingStatus(stabiliser, targets.stabiliser.min, targets.stabiliser.max) },
    custom: [],
  };

  const flaggedReadings = ['ph', 'chlorine', 'alkalinity', 'calcium', 'stabiliser'].filter(
    (k) => readingsRecord[k].status !== 'good',
  );

  const treatmentsRecord = (treatments || []).map((t) => ({
    product_id: null,
    product_name: t.name,
    unit: t.unit,
    recommended: t.recommendedAmount,
    actual: Number(t.actualAmount || 0),
  }));

  const year = completedAtDate.getFullYear();
  const { count } = await supabase
    .from('service_records')
    .select('*', { count: 'exact', head: true });
  const ref = `SR-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

  const { data: serviceRecord, error: insertErr } = await supabase
    .from('service_records')
    .insert({
      ref,
      job_id: jobId,
      pool_id: job.pools.id,
      company_id: job.company_id,
      technician_id: technicianId,
      customer_id: job.pools.customers.id,
      completed_at: completedAtDate.toISOString(),
      duration_seconds: durationSeconds,
      readings: readingsRecord,
      lsi_score: lsi?.score ?? 0,
      lsi_label: lsi?.description ?? 'Unknown',
      treatments: treatmentsRecord,
      photo_urls: { before: null, after: null, additional: [] },
      customer_note: notes?.customer || null,
      office_note: notes?.office || null,
      is_flagged: flaggedReadings.length > 0,
      flagged_readings: flaggedReadings,
      locked: true,
    })
    .select('id, ref')
    .single();

  if (insertErr) throw insertErr;

  await supabase
    .from('jobs')
    .update({ status: 'complete', completed_at: completedAtDate.toISOString() })
    .eq('id', jobId);

  return { serviceRecordId: serviceRecord.id, ref: serviceRecord.ref };
}
