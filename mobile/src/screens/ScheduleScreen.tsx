import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { getApiClient } from '../services/api';

interface ApiJob {
  id: string;
  routeOrder: number;
  status: 'pending' | 'in_progress' | 'complete' | 'cancelled';
  customer: { name: string; address: string } | null;
  lastVisit: { date: string; isFlagged: boolean } | null;
  completedAt: string | null;
  startedAt: string | null;
}

interface Job {
  id: string;
  name: string;
  address: string;
  lastVisitText: string;
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Visited today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function mapApiJob(apiJob: ApiJob): Job {
  return {
    id: apiJob.id,
    name: apiJob.customer?.name ?? 'Unknown',
    address: apiJob.customer?.address ?? '',
    lastVisitText: apiJob.lastVisit ? daysAgo(apiJob.lastVisit.date) : 'No previous visits',
  };
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function ScheduleScreen() {
  const navigation = useNavigation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = getWeekDays(today);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = toLocalDateStr(date);
      const response = await getApiClient().get<{ ok: boolean; data: ApiJob[] }>('/technician/jobs', { date: dateStr });
      setJobs((response.data ?? []).map(mapApiJob));
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs(selectedDate);
  }, []);

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    fetchJobs(date);
  };

  const handleJobPress = (jobId: string) => {
    // @ts-ignore
    navigation.navigate('M5', { jobId });
  };

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleJobPress(item.id)}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardAddr}>{item.address}</Text>
      <Text style={styles.cardMeta}>{item.lastVisitText}</Text>
    </TouchableOpacity>
  );

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      <View style={styles.weekStrip}>
        {weekDays.map((date, idx) => {
          const active = isSameDay(date, selectedDate);
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
              onPress={() => handleDayPress(date)}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                {DAY_LABELS[idx]}
              </Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>No jobs scheduled</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={styles.scrollContent}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    gap: 2,
  },
  dayBtnActive: {
    backgroundColor: '#111827',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dayNumActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F5F5F3',
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
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
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardAddr: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F5F5F3',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
