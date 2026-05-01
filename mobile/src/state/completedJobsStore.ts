import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'completed_jobs_v1';

const completedJobs = new Set<string>();
const completionRefs = new Map<string, Array<{ serviceRecordId?: string; ref?: string; poolId?: string }>>();

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

export function hydrateCompletedJobs(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydratePromise) return hydratePromise;

  hydratePromise = AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
    if (raw) {
      try {
        const parsed: Array<{ jobId: string; refs: Array<{ serviceRecordId?: string; ref?: string; poolId?: string }> }> = JSON.parse(raw);
        for (const entry of parsed) {
          completedJobs.add(entry.jobId);
          completionRefs.set(entry.jobId, entry.refs);
        }
      } catch {
        // corrupt storage — ignore
      }
    }
    hydrated = true;
  }).catch(() => {
    hydrated = true;
  });

  return hydratePromise;
}

function persist() {
  const entries = Array.from(completedJobs).map((jobId) => ({
    jobId,
    refs: completionRefs.get(jobId) ?? [],
  }));
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch(() => {});
}

export function markJobCompleted(jobId: string, refs: Array<{ serviceRecordId?: string; ref?: string; poolId?: string }> = []) {
  completedJobs.add(jobId);
  completionRefs.set(jobId, refs);
  persist();
}

export function isJobCompleted(jobId: string) {
  return completedJobs.has(jobId);
}

export function getCompletedJobIds() {
  return Array.from(completedJobs);
}

export function getCompletionRefs(jobId: string) {
  return completionRefs.get(jobId) ?? [];
}
