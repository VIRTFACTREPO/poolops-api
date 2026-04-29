import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { getApiClient } from '../../services/api';

// Service history API types
interface ServiceRecord {
  id: string;
  job_id: string;
  scheduled_date: string;
  service_time: string;
  technician: {
    id: string;
    first_name: string;
    last_name: string;
  };
  readings: {
    ph: number;
    chlorine: number;
    lsi: number;
  };
  status: 'complete' | 'flagged' | 'warning';
  notes: string;
}

type FilterType = 'all' | 'year' | '3mo';

export function ServiceHistoryScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (selectedFilter: FilterType) => {
    try {
      setLoading(true);
      const filterParam = selectedFilter === 'all' ? 'all' : selectedFilter === 'year' ? 'year' : '3mo';
      const result = await getApiClient().get<{ jobs: ServiceRecord[] }>(`/owner/jobs?filter=${filterParam}`);
      setRecords(result.jobs);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch service history:', err);
      setError('Unable to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    fetchHistory(newFilter);
  };

  const handleCardPress = (jobId: string) => {
    // @ts-ignore - jobId param is defined in OwnerStackParamList
    navigation.navigate('ServiceReportDetail', { jobId });
  };

  const getTrafficLightColor = (value: number | null, min: number, max: number) => {
    if (value === null) return colors.textMuted;
    if (value >= min && value <= max) return colors.success;
    return colors.warning;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (timeStr: string) => {
    const time = new Date(`2000-01-01T${timeStr}`);
    return time.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
  };

  const renderFilterPills = () => (
    <View style={styles.filterContainer}>
      {(['all', 'year', '3mo'] as FilterType[]).map((f) => (
        <TouchableOpacity
          key={f}
          style={[
            styles.filterPill,
            filter === f && styles.filterPillActive,
          ]}
          onPress={() => handleFilterChange(f)}
        >
          <Text style={[
            styles.filterText,
            filter === f && styles.filterTextActive,
          ]}>
            {f === 'all' ? 'All' : f === 'year' ? 'This year' : 'Last 3 months'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTrafficDots = (record: ServiceRecord) => {
    const phMin = 7.2;
    const phMax = 7.8;
    const clMin = 1.0;
    const clMax = 3.0;
    const lsiMin = -0.5;
    const lsiMax = 0.5;

    return (
      <View style={styles.readingsRow}>
        <View style={styles.readingItem}>
          <Text style={styles.readingLabel}>pH</Text>
          <View style={[
            styles.trafficDot,
            { backgroundColor: getTrafficLightColor(record.readings.ph, phMin, phMax) }
          ]} />
          <Text style={styles.readingValue}>
            {record.readings.ph !== null ? record.readings.ph.toFixed(1) : '-'}
          </Text>
        </View>
        <View style={styles.readingItem}>
          <Text style={styles.readingLabel}>Cl</Text>
          <View style={[
            styles.trafficDot,
            { backgroundColor: getTrafficLightColor(record.readings.chlorine, clMin, clMax) }
          ]} />
          <Text style={styles.readingValue}>
            {record.readings.chlorine !== null ? record.readings.chlorine.toFixed(1) : '-'}
          </Text>
        </View>
        <View style={styles.readingItem}>
          <Text style={styles.readingLabel}>LSI</Text>
          <View style={[
            styles.trafficDot,
            { backgroundColor: getTrafficLightColor(record.readings.lsi, lsiMin, lsiMax) }
          ]} />
          <Text style={styles.readingValue}>
            {record.readings.lsi !== null ? record.readings.lsi.toFixed(1) : '-'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="time-outline" size={48} color={colors.border} />
      </View>
      <Text style={styles.emptyTitle}>No services yet</Text>
      <Text style={styles.emptySub}>Your service history will appear here</Text>
    </View>
  );

  if (loading && records.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="warning-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchHistory(filter)}
          >
            <Ionicons name="refresh" size={16} color={colors.textInverse} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service History</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterWrapper}>
        {renderFilterPills()}
      </View>

      {/* Scroll Area */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {records.length === 0 ? (
          renderEmptyState()
        ) : (
          records.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={[
                styles.card,
                record.status === 'flagged' && styles.cardFlagged,
              ]}
              onPress={() => handleCardPress(record.job_id)}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.dateText}>
                    {formatDate(record.scheduled_date)} at {formatTime(record.service_time)}
                  </Text>
                  <Text style={styles.technicianText}>
                    {record.technician.first_name} {record.technician.last_name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </View>

              {renderTrafficDots(record)}

              <Text style={styles.statusText}>
                {record.status === 'complete' && 'Service complete'}
                {record.status === 'flagged' && 'Flagged reading noted'}
                {record.status === 'warning' && 'Warning noted'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E4E8',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '500',
  },
  // Header styles (match OwnerHomeScreen)
  header: {
    height: 56,
    backgroundColor: '#F5F5F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  backButtonPlaceholder: {
    width: 32,
  },
  // Filter styles
  filterWrapper: {
    padding: spacing.base,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: '#FFFFFF',
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: '#F3F4F6',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  // Scroll area
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80, // Space for bottom nav
    gap: 12,
  },
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardFlagged: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.xxs,
  },
  technicianText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  readingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  readingItem: {
    alignItems: 'center',
    gap: 4,
  },
  readingLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  readingValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 18,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
