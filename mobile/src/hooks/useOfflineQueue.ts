import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { drainAll, getPendingCount } from '../services/offlineQueue';

const POLL_INTERVAL_MS = 30_000;

export interface OfflineQueueState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  triggerSync: () => Promise<void>;
}

export function useOfflineQueue(): OfflineQueueState {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      await drainAll();
      setLastSyncAt(new Date());
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  // Sync on app foreground
  useEffect(() => {
    refreshCount();

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        triggerSync();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [refreshCount, triggerSync]);

  // Poll while there are pending items
  useEffect(() => {
    if (pendingCount === 0) return;
    const interval = setInterval(triggerSync, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pendingCount, triggerSync]);

  return { pendingCount, isSyncing, lastSyncAt, triggerSync };
}
