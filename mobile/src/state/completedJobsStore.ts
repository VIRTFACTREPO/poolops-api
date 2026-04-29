const completedJobs = new Set<string>();
const completionRefs = new Map<string, Array<{ serviceRecordId?: string; ref?: string; poolId?: string }>>();

export function markJobCompleted(jobId: string, refs: Array<{ serviceRecordId?: string; ref?: string; poolId?: string }> = []) {
  completedJobs.add(jobId);
  completionRefs.set(jobId, refs);
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
