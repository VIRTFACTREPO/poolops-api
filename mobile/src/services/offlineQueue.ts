import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export type QueueJobType = 'JOB_COMPLETE' | 'JOB_START' | 'PHOTO_UPLOAD';

export type QueueItemStatus = 'pending' | 'failed';

export interface QueueItem {
  id: number;
  type: QueueJobType;
  jobId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastAttemptAt: string | null;
  status: QueueItemStatus;
}

// Legacy compat type used by M11CompleteScreen
export type CompletionQueueItem = {
  jobId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

const DB_NAME = 'poolops-offline.db';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3003';
const MAX_RETRIES = 5;
const BACKOFF_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];

let _db: SQLiteDatabase | null = null;

async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db;
  const db = await openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      job_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, type, created_at);
  `);
  _db = db;
  return db;
}

export async function enqueue(type: QueueJobType, jobId: string, payload: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (type, job_id, payload, created_at) VALUES (?, ?, ?, ?)`,
    type,
    jobId,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}

export async function enqueueJobCompletion(item: CompletionQueueItem): Promise<void> {
  await enqueue('JOB_COMPLETE', item.jobId, item.payload);
}

export async function enqueueJobStart(jobId: string, payload: Record<string, unknown>): Promise<void> {
  await enqueue('JOB_START', jobId, payload);
}

export async function enqueuePhotoUpload(jobId: string, payload: Record<string, unknown>): Promise<void> {
  await enqueue('PHOTO_UPLOAD', jobId, payload);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`,
  );
  return row?.count ?? 0;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
}

type DispatchResult =
  | { outcome: 'success' }
  | { outcome: 'conflict' }
  | { outcome: 'network_error' }
  | { outcome: 'server_error' }
  | { outcome: 'client_error' };

async function dispatchItem(item: QueueItem): Promise<DispatchResult> {
  const token = await getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url: string;
  let method: string = 'POST';
  switch (item.type) {
    case 'JOB_COMPLETE':
      url = `${API_BASE_URL}/technician/jobs/${item.jobId}/complete`;
      break;
    case 'JOB_START':
      url = `${API_BASE_URL}/technician/jobs/${item.jobId}`;
      method = 'PATCH';
      break;
    default:
      // PHOTO_UPLOAD is handled exclusively by drainPhotoQueue — should never reach here.
      return { outcome: 'client_error' };
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(item.payload),
    });

    if (response.ok) return { outcome: 'success' };

    // §7.4 conflict resolution: treat 409 as idempotent success (server state wins,
    // our operation is a duplicate — discard the queue item)
    if (response.status === 409) return { outcome: 'conflict' };

    // Retryable server errors
    if (response.status >= 500 || response.status === 429) return { outcome: 'server_error' };

    // Non-retryable client errors (4xx except 409 and 429)
    return { outcome: 'client_error' };
  } catch {
    return { outcome: 'network_error' };
  }
}

async function markAttempted(db: SQLiteDatabase, id: number, retryCount: number): Promise<void> {
  const newStatus: QueueItemStatus = retryCount >= MAX_RETRIES ? 'failed' : 'pending';
  await db.runAsync(
    `UPDATE sync_queue SET retry_count = ?, last_attempt_at = ?, status = ? WHERE id = ?`,
    retryCount,
    new Date().toISOString(),
    newStatus,
    id,
  );
}

async function removeItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id);
}

function backoffDelay(retryCount: number): Promise<void> {
  const ms = BACKOFF_DELAYS_MS[Math.min(retryCount, BACKOFF_DELAYS_MS.length - 1)];
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rowToItem(row: {
  id: number;
  type: string;
  job_id: string;
  payload: string;
  created_at: string;
  retry_count: number;
  last_attempt_at: string | null;
  status: string;
}): QueueItem {
  return {
    id: row.id,
    type: row.type as QueueJobType,
    jobId: row.job_id,
    payload: JSON.parse(row.payload),
    createdAt: row.created_at,
    retryCount: row.retry_count,
    lastAttemptAt: row.last_attempt_at,
    status: row.status as QueueItemStatus,
  };
}

// Drains JOB_START and JOB_COMPLETE in strict FIFO order.
// Returns number of items successfully processed.
export async function drainQueue(): Promise<number> {
  const db = await getDb();
  let processed = 0;

  while (true) {
    const row = await db.getFirstAsync<{
      id: number;
      type: string;
      job_id: string;
      payload: string;
      created_at: string;
      retry_count: number;
      last_attempt_at: string | null;
      status: string;
    }>(
      `SELECT * FROM sync_queue
       WHERE status = 'pending' AND type IN ('JOB_COMPLETE', 'JOB_START')
       ORDER BY created_at ASC, id ASC
       LIMIT 1`,
    );

    if (!row) break;

    const item = rowToItem(row);

    if (item.retryCount > 0) {
      await backoffDelay(item.retryCount);
    }

    const result = await dispatchItem(item);

    if (result.outcome === 'success' || result.outcome === 'conflict') {
      await removeItem(db, item.id);
      processed++;
    } else if (result.outcome === 'client_error') {
      // Non-retryable: dead-letter immediately
      await markAttempted(db, item.id, MAX_RETRIES);
    } else {
      // network_error or server_error: increment retry, stop draining (no connectivity)
      await markAttempted(db, item.id, item.retryCount + 1);
      break;
    }
  }

  return processed;
}

// Drains PHOTO_UPLOAD items independently of the main job queue.
// Photo uploads do not block job events and vice versa.
export async function drainPhotoQueue(): Promise<number> {
  const db = await getDb();
  let processed = 0;

  const rows = await db.getAllAsync<{
    id: number;
    type: string;
    job_id: string;
    payload: string;
    created_at: string;
    retry_count: number;
    last_attempt_at: string | null;
    status: string;
  }>(
    `SELECT * FROM sync_queue
     WHERE status = 'pending' AND type = 'PHOTO_UPLOAD'
     ORDER BY created_at ASC, id ASC`,
  );

  const token = await getAuthToken();
  const authHeaders: Record<string, string> = {};
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;

  for (const row of rows) {
    const item = rowToItem(row);

    if (item.retryCount > 0) {
      await backoffDelay(item.retryCount);
    }

    try {
      const payload = item.payload as {
        photoType: 'before' | 'after';
        uri: string;
        fileName: string;
        mimeType: string;
        capturedAt: string;
      };

      // Read file as base64 and POST to API which uploads to storage server-side.
      const base64 = await FileSystem.readAsStringAsync(payload.uri, {
        encoding: 'base64' as any,
      });

      const uploadResponse = await fetch(
        `${API_BASE_URL}/technician/jobs/${item.jobId}/photos`,
        {
          method: 'POST',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: payload.photoType,
            mimeType: payload.mimeType,
            fileName: payload.fileName,
            base64,
          }),
        },
      );

      if (uploadResponse.ok) {
        await removeItem(db, item.id);
        processed++;
      } else {
        const isRetryable = uploadResponse.status >= 500 || uploadResponse.status === 429;
        await markAttempted(db, item.id, isRetryable ? item.retryCount + 1 : MAX_RETRIES);
      }
    } catch {
      // Network / filesystem error — increment retry, continue with remaining photos.
      await markAttempted(db, item.id, item.retryCount + 1);
    }
  }

  return processed;
}

export async function drainAll(): Promise<{ jobs: number; photos: number }> {
  const [jobs, photos] = await Promise.all([drainQueue(), drainPhotoQueue()]);
  return { jobs, photos };
}
