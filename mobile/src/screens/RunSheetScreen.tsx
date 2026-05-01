import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { isJobCompleted } from '../state/completedJobsStore';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { SyncBanner } from '../components/SyncBanner';
import { getApiClient } from '../services/api';

type JobStatus = 'next-up' | 'pending-overdue' | 'pending-on-schedule' | 'done';

interface Job {
  id: string;
  name: string;
  address: string;
  lastVisitsAgo: string;
  status: JobStatus;
  statusText: string;
  statusColor: string;
  startTime?: string;
}

interface ApiJob {
  id: string;
  routeOrder: number;
  status: 'pending' | 'in_progress' | 'complete' | 'cancelled';
  customer: { name: string; address: string } | null;
  lastVisit: { date: string; isFlagged: boolean } | null;
  completedAt: string | null;
  startedAt: string | null;
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Visited today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function mapApiJob(apiJob: ApiJob, index: number): Job {
  const name = apiJob.customer?.name ?? 'Unknown';
  const address = apiJob.customer?.address ?? '';
  const lastVisitText = apiJob.lastVisit ? daysAgo(apiJob.lastVisit.date) : 'No previous visits';
  const isFlagged = apiJob.lastVisit?.isFlagged ?? false;

  if (apiJob.status === 'complete') {
    const completedTime = apiJob.completedAt
      ? new Date(apiJob.completedAt).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })
      : undefined;
    return { id: apiJob.id, name, address, lastVisitsAgo: 'Completed', status: 'done', statusText: 'Completed', statusColor: '#D1FAE5', startTime: completedTime };
  }

  if (apiJob.status === 'in_progress' || (apiJob.status === 'pending' && index === 0)) {
    return {
      id: apiJob.id, name, address, lastVisitsAgo: lastVisitText,
      status: 'next-up',
      statusText: isFlagged ? '⚠ Flagged last visit' : '✓ Ready',
      statusColor: isFlagged ? '#FFFBEB' : '#F0FDF4',
    };
  }

  return {
    id: apiJob.id, name, address, lastVisitsAgo: lastVisitText,
    status: 'pending-on-schedule',
    statusText: isFlagged ? '⚠ Flagged last visit' : '✓ On schedule',
    statusColor: isFlagged ? '#FFFBEB' : '#F0FDF4',
  };
}

type RunSheetScreenProps = {
  onPullRefresh?: () => Promise<void>;
};

function applyLocalCompleted(items: Job[]): Job[] {
  return items.map((job) => {
    if (!isJobCompleted(job.id) || job.status === 'done') return job;
    return { ...job, status: 'done', statusText: 'Completed', statusColor: '#D1FAE5', lastVisitsAgo: 'Completed', startTime: job.startTime ?? 'Now' };
  });
}

export function RunSheetScreen({ onPullRefresh }: RunSheetScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const queue = useOfflineQueue();

  const fetchJobs = useCallback(async () => {
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const response = await getApiClient().get<{ ok: boolean; data: ApiJob[] }>('/technician/jobs', { date: localDate });
      const mapped = (response.data ?? []).map((j, i) => mapApiJob(j, i));
      let seenNextUp = false;
      const deduped = mapped.map((job) => {
        if (job.status === 'next-up') {
          if (seenNextUp) return { ...job, status: 'pending-on-schedule' as const };
          seenNextUp = true;
        }
        return job;
      });
      setJobs(applyLocalCompleted(deduped));
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs]),
  );

  const prevSyncAt = React.useRef(queue.lastSyncAt);
  React.useEffect(() => {
    if (queue.lastSyncAt && queue.lastSyncAt !== prevSyncAt.current) {
      prevSyncAt.current = queue.lastSyncAt;
      fetchJobs();
    }
  }, [queue.lastSyncAt, fetchJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onPullRefresh) await onPullRefresh();
      await Promise.race([queue.triggerSync(), new Promise((r) => setTimeout(r, 5000))]);
      await fetchJobs();
    } finally {
      setRefreshing(false);
    }
  }, [onPullRefresh, queue, fetchJobs]);

  const handleJobPress = (jobId: string) => {
    // Navigate to M5 - Job Detail screen
    // @ts-ignore - navigation type extension for M5 route
    navigation.navigate('M5', { jobId });
  };

  const getDoneJobsStartIndex = () => {
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].status === 'done') return i;
    }
    return jobs.length;
  };

  const doneJobsStartIndex = getDoneJobsStartIndex();

  const renderNextUpCard = (job: Job) => (
    <TouchableOpacity style={styles.cardNext} onPress={() => handleJobPress(job.id)}>
      <View style={styles.nextLabel}>
        <View style={styles.nextDot} />
        <Text style={styles.nextTag}>Next up</Text>
      </View>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.cardName}>{job.name}</Text>
          <Text style={styles.cardAddr}>{job.address}</Text>
        </View>
        <View style={styles.startBtn}>
          <Text style={styles.startBtnText}>Start</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaAge}>{job.lastVisitsAgo}</Text>
        <View style={[styles.pill, { backgroundColor: job.statusColor, borderColor: '#FFFBEB' }]}>
          <Text style={styles.pillText}>{job.statusText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPendingCard = (job: Job) => (
    <TouchableOpacity style={styles.cardPend} onPress={() => handleJobPress(job.id)}>
      <Text style={styles.pendName}>{job.name}</Text>
      <Text style={styles.pendAddr}>{job.address}</Text>
      <View style={styles.pendMeta}>
        <Text style={styles.pendAge}>{job.lastVisitsAgo}</Text>
        <View style={[styles.pill, { backgroundColor: job.statusColor, borderColor: '#FDE68A' }]}>
          <Text style={styles.pillText}>{job.statusText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDoneCard = (job: Job) => (
    <TouchableOpacity style={styles.cardDone} onPress={() => handleJobPress(job.id)}>
      <View style={styles.doneCheck}>
        <View style={styles.checkIcon} />
      </View>
      <View style={styles.doneInfo}>
        <Text style={styles.doneName}>{job.name}</Text>
        <Text style={styles.doneAddr}>{job.address}</Text>
      </View>
      <Text style={styles.doneTime}>{job.startTime}</Text>
    </TouchableOpacity>
  );

  const renderJobItem = ({ item }: { item: Job }) => {
    if (item.status === 'next-up') {
      return renderNextUpCard(item);
    } else if (item.status === 'done') {
      return renderDoneCard(item);
    } else {
      return renderPendingCard(item);
    }
  };

  const renderSectionSeparator = () => (
    <Text style={styles.sectionSep}>Completed</Text>
  );

  const doneCount = jobs.filter((j) => j.status === 'done').length;
  const totalCount = jobs.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Progress Strip */}
      <View style={styles.progressStrip}>
        <Text style={styles.progLabel}>{doneCount} of {totalCount} complete</Text>
        <View style={styles.progTrack}>
          <View style={[styles.progFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progPct}>{pct}%</Text>
      </View>

      {/* Offline Sync Banner */}
      <SyncBanner queue={queue} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        extraData={jobs}
        renderItem={(item) => {
          const index = jobs.indexOf(item.item);
          const isLastPending = item.item.status !== 'done' && index === doneJobsStartIndex - 1;
          return (
            <>
              {renderJobItem(item)}
              {isLastPending && renderSectionSeparator()}
            </>
          );
        }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E4E8',
  },
  statusBar: {
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusCell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  statusCellCell: {
    width: 2.5,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#111827',
  },
  statusWifi: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  statusWifiBar: {
    width: 3,
    height: 11,
    borderRadius: 1,
    backgroundColor: '#111827',
  },
  statusWifiIcon: {
    width: 1,
    height: 1,
    backgroundColor: '#111827',
    borderRadius: 99,
  },
  statusBattery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  statusBatteryBody: {
    width: 16,
    height: 9,
    borderRadius: 2.5,
    backgroundColor: '#111827',
  },
  statusBatteryTip: {
    width: 2,
    height: 4,
    backgroundColor: '#111827',
  },
  dynamicIsland: {
    backgroundColor: '#111827',
    width: 120,
    height: 34,
    borderRadius: borderRadius.full,
    marginVertical: 6,
    alignSelf: 'center',
  },
  dynamicIslandInner: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: borderRadius.full,
  },
  header: {
    padding: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  menuIcon: {
    flexDirection: 'column',
    gap: 4,
    padding: 4,
  },
  menuBar: {
    width: 20,
    height: 2,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bellWrap: {
    position: 'relative',
    padding: 4,
  },
  bellIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: '#F5F5F3',
  },
  progressStrip: {
    backgroundColor: '#EDEDEB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  progTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: borderRadius.full,
  },
  progPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    padding: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F5F5F3',
    gap: 8,
  },
  sectionSep: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9CA3AF',
    padding: 4,
    paddingBottom: 0,
  },
  // NEXT UP Card
  cardNext: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxxl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  nextLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  nextDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#111827',
  },
  nextTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  cardAddr: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: '#111827',
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  startIcon: {
    width: 12,
    height: 12,
    backgroundColor: 'transparent',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  metaAge: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Pending Card
  cardPend: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  pendAddr: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  pendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  pendAge: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Done Card
  cardDone: {
    backgroundColor: '#EDEDEB',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneCheck: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
  },
  doneInfo: {
    flex: 1,
  },
  doneName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  doneAddr: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  doneTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '500',
    borderWidth: 1,
  },
  pillText: {
    color: '#6B7280',
  },
  // Bottom Nav
  nav: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingVertical: 10,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  navIconWrap: {
    width: 44,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: '#111827',
  },
  navHomeIcon: {
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
  },
  navJobsIcon: {
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
  },
  navSearchIcon: {
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
  },
  navBellIcon: {
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
  },
  navProfileIcon: {
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
  },
  homePillWrap: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 14,
  },
  homePill: {
    width: 120,
    height: 4,
    backgroundColor: '#111827',
    borderRadius: borderRadius.full,
  },
});
