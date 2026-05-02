import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function getTodaysJobs(technicianId, today) {
  if (!today) today = new Date().toISOString().split('T')[0];

  const jobSelect = `id, route_order, status, job_type, scheduled_date, started_at, completed_at,
    job_pools ( pools ( id, customers ( id, first_name, last_name, address ) ) )`;

  const [todayResult, outstandingResult] = await Promise.all([
    supabase
      .from('jobs')
      .select(jobSelect)
      .eq('technician_id', technicianId)
      .eq('scheduled_date', today)
      .order('route_order'),
    supabase
      .from('jobs')
      .select(jobSelect)
      .eq('technician_id', technicianId)
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

  const poolIds = jobs.flatMap((j) => (j.job_pools || []).map((jp) => jp.pools?.id).filter(Boolean));
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
    const jobPools = (job.job_pools || []).map((jp) => jp.pools).filter(Boolean);
    const firstPool = jobPools[0];
    const customer = firstPool?.customers;
    const firstLastVisit = firstPool ? lastVisitsByPool[firstPool.id] : null;

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
      pools: jobPools.map((p) => ({ id: p.id })),
      lastVisit: firstLastVisit
        ? { date: firstLastVisit.completed_at, isFlagged: firstLastVisit.is_flagged, lsiLabel: firstLastVisit.lsi_label }
        : null,
    };
  });
}

export async function getJobDetail(jobId, technicianId) {
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      id, status, job_type, scheduled_date, started_at,
      job_pools (
        pools (
          id, volume_litres, pool_type, surface_type, indoor_outdoor,
          gate_access, warnings, equipment_notes,
          customers ( id, first_name, last_name, address, phone )
        )
      )
    `)
    .eq('id', jobId)
    .eq('technician_id', technicianId)
    .maybeSingle();

  if (error) throw error;
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const jobPools = (job.job_pools || []).map((jp) => jp.pools).filter(Boolean);
  const firstPool = jobPools[0];
  const customer = firstPool?.customers;

  const poolDetails = await Promise.all(
    jobPools.map(async (pool) => {
      if (!pool?.id) return null;

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

      return {
        id: pool.id,
        volumeLitres: pool.volume_litres,
        poolType: pool.pool_type,
        surfaceType: pool.surface_type,
        indoorOutdoor: pool.indoor_outdoor,
        gateAccess: pool.gate_access,
        warnings: pool.warnings,
        equipmentNotes: pool.equipment_notes,
        equipment: (equipResult.data || []).map((e) => ({
          id: e.id,
          name: e.name,
          type: e.equipment_type,
          manufacturer: e.manufacturer,
          model: e.model,
        })),
        lastVisits: (visitsResult.data || []).map((r) => ({
          date: r.completed_at,
          isFlagged: r.is_flagged,
          lsiLabel: r.lsi_label,
          lsiScore: r.lsi_score,
        })),
      };
    }),
  );

  const firstPoolDetail = poolDetails.filter(Boolean)[0] || null;

  return {
    id: job.id,
    status: job.status,
    jobType: job.job_type,
    scheduledDate: job.scheduled_date,
    startedAt: job.started_at,
    customer: customer
      ? { id: customer.id, name: `${customer.last_name}, ${customer.first_name}`, address: customer.address, phone: customer.phone }
      : null,
    pool: firstPoolDetail ? {
      id: firstPoolDetail.id,
      volumeLitres: firstPoolDetail.volumeLitres,
      poolType: firstPoolDetail.poolType,
      surfaceType: firstPoolDetail.surfaceType,
      indoorOutdoor: firstPoolDetail.indoorOutdoor,
      gateAccess: firstPoolDetail.gateAccess,
      warnings: firstPoolDetail.warnings,
      equipmentNotes: firstPoolDetail.equipmentNotes,
    } : null,
    equipment: firstPoolDetail?.equipment || [],
    lastVisits: firstPoolDetail?.lastVisits || [],
  };
}

export async function startJob(jobId, technicianId) {
  const { data: job, error: fetchErr } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('id', jobId)
    .eq('technician_id', technicianId)
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

// payload.pools: [{ poolId, readings, lsi, treatments }]
// notes and completedAt are top-level in payload
export async function completeJob(jobId, technicianId, payload) {
  const { data: job, error: fetchErr } = await supabase
    .from('jobs')
    .select('id, company_id, status, started_at, job_pools ( pools ( id, customers ( id ) ) )')
    .eq('id', jobId)
    .eq('technician_id', technicianId)
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

  const { pools: poolReadings, notes, completedAt } = payload;
  const completedAtDate = completedAt ? new Date(completedAt) : new Date();
  const startedAt = job.started_at ? new Date(job.started_at) : completedAtDate;
  const durationSeconds = Math.max(0, Math.round((completedAtDate - startedAt) / 1000));

  const jobPoolMap = new Map((job.job_pools || []).map((jp) => jp.pools).filter(Boolean).map((p) => [p.id, p]));

  const targets = {
    ph:         { min: 7.2, max: 7.6 },
    chlorine:   { min: 1.0, max: 3.0 },
    alkalinity: { min: 80,  max: 120  },
    calcium:    { min: 200, max: 400  },
    stabiliser: { min: 30,  max: 50   },
  };

  const { count: existingCount } = await supabase
    .from('service_records')
    .select('*', { count: 'exact', head: true });
  const year = completedAtDate.getFullYear();

  const records = [];
  for (let i = 0; i < (poolReadings || []).length; i++) {
    const pr = poolReadings[i];

    if (!jobPoolMap.has(pr.poolId)) {
      const err = new Error(`Pool ${pr.poolId} is not part of job ${jobId}`);
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const jp = jobPoolMap.get(pr.poolId);
    const customerId = jp.customers.id;

    const ph        = Number(pr.readings?.ph             ?? 0);
    const chlorine  = Number(pr.readings?.freeChlorine   ?? 0);
    const alkalinity = Number(pr.readings?.alkalinity    ?? 0);
    const calcium   = Number(pr.readings?.calciumHardness ?? 0);
    const stabiliser = Number(pr.readings?.cyanuricAcid  ?? 0);

    const readingsRecord = {
      ph:         { value: ph,         status: readingStatus(ph,         targets.ph.min,         targets.ph.max)         },
      chlorine:   { value: chlorine,   status: readingStatus(chlorine,   targets.chlorine.min,   targets.chlorine.max)   },
      alkalinity: { value: alkalinity, status: readingStatus(alkalinity, targets.alkalinity.min, targets.alkalinity.max) },
      calcium:    { value: calcium,    status: readingStatus(calcium,    targets.calcium.min,    targets.calcium.max)    },
      stabiliser: { value: stabiliser, status: readingStatus(stabiliser, targets.stabiliser.min, targets.stabiliser.max) },
      custom: [],
    };

    const flaggedReadings = ['ph', 'chlorine', 'alkalinity', 'calcium', 'stabiliser'].filter(
      (k) => readingsRecord[k].status !== 'good',
    );

    const ref = `SR-${year}-${String((existingCount || 0) + records.length + 1).padStart(4, '0')}`;

    records.push({
      ref,
      job_id:           jobId,
      pool_id:          pr.poolId,
      company_id:       job.company_id,
      technician_id:    technicianId,
      customer_id:      customerId,
      completed_at:     completedAtDate.toISOString(),
      duration_seconds: durationSeconds,
      readings:         readingsRecord,
      lsi_score:        pr.lsi?.score       ?? 0,
      lsi_label:        pr.lsi?.description ?? 'Unknown',
      treatments: (pr.treatments || []).map((t) => ({
        product_id:    null,
        product_name:  t.name,
        unit:          t.unit,
        recommended:   t.recommendedAmount,
        actual:        Number(t.actualAmount || 0),
      })),
      photo_urls:       payload.photo_urls ?? { before: null, after: null, additional: [] },
      customer_note:    notes?.customer || null,
      office_note:      notes?.office   || null,
      is_flagged:       flaggedReadings.length > 0,
      flagged_readings: flaggedReadings,
      locked:           true,
    });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('service_records')
    .insert(records)
    .select('id, ref, pool_id');

  if (insertErr) throw insertErr;

  await supabase
    .from('jobs')
    .update({ status: 'complete', completed_at: completedAtDate.toISOString() })
    .eq('id', jobId);

  return inserted.map((r) => ({ serviceRecordId: r.id, ref: r.ref, poolId: r.pool_id }));
}

export async function createPhotoUploadUrl(jobId, technicianId, { type, mimeType, fileName }) {
  const { data: job, error: fetchErr } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .eq('technician_id', technicianId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const ext = (fileName ?? '').split('.').pop() || 'jpg';
  const path = `${jobId}/${type}-${Date.now()}.${ext}`;

  const { data, error: storageErr } = await supabase.storage
    .from('job-photos')
    .createSignedUploadUrl(path);

  if (storageErr) throw storageErr;

  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/job-photos/${path}`;
  return { signedUrl: data.signedUrl, publicUrl };
}
