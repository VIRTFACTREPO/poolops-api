import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/tokens';
import { getApiClient } from '../../services/api';

// API response types
interface ReadingValue {
  value: number;
  status: 'good' | 'low' | 'high';
}

interface ServiceRecord {
  ref: string;
  completedAt: string;
  readings: {
    ph: ReadingValue;
    chlorine: ReadingValue;
    alkalinity: ReadingValue;
    calcium: ReadingValue;
    stabiliser: ReadingValue;
  };
  lsiScore: number;
  lsiLabel: string;
  isFlagged: boolean;
  flaggedReadings: string[];
  customerNote: string | null;
  treatments: Array<{
    productName: string;
    unit: string;
    recommended: number;
    actual: number;
  }>;
}

interface JobDetail {
  id: string;
  status: 'pending' | 'in_progress' | 'complete' | 'cancelled';
  scheduledDate: string;
  startedAt: string | null;
  completedAt: string | null;
  technician: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  serviceRecord: ServiceRecord | null;
}

type RouteType = RouteProp<{ ServiceReportDetail: { jobId?: string } }, 'ServiceReportDetail'>;

const READING_LABELS: Record<string, string> = {
  ph: 'pH',
  chlorine: 'Free Cl',
  alkalinity: 'Alkalinity',
  calcium: 'Calcium',
  stabiliser: 'Stabiliser',
};

const READING_UNITS: Record<string, string> = {
  ph: '',
  chlorine: ' ppm',
  alkalinity: ' ppm',
  calcium: ' ppm',
  stabiliser: ' ppm',
};

function readingColor(status: ReadingValue['status']): string {
  if (status === 'good') return colors.success;
  return colors.warning;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
}

export function ServiceReportDetail() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { jobId } = route.params ?? {};

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchJob() {
      try {
        setLoading(true);
        const result = await getApiClient().get<{ job: JobDetail }>(`/owner/jobs/${jobId}`);
        if (!cancelled) {
          setJob(result.job);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch job detail:', err);
          setError('Unable to load service report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJob();
    return () => { cancelled = true; };
  }, [jobId]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Service Report</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.centred}>
          <Ionicons name="warning-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error ?? 'Report not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color={colors.textInverse} />
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { serviceRecord } = job;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Date / Technician card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.cardLabel}>Date</Text>
          </View>
          <Text style={styles.cardValue}>
            {formatDateTime(job.scheduledDate)}
            {job.completedAt ? `  ·  ${formatTime(job.completedAt)}` : ''}
          </Text>

          <View style={[styles.cardRow, { marginTop: spacing.md }]}>
            <Ionicons name="person-outline" size={16} color={colors.textMuted} />
            <Text style={styles.cardLabel}>Technician</Text>
          </View>
          <Text style={styles.cardValue}>
            {job.technician
              ? `${job.technician.firstName} ${job.technician.lastName}`
              : 'Not assigned'}
          </Text>

          <View style={[styles.cardRow, { marginTop: spacing.md }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.cardLabel}>Status</Text>
          </View>
          <View style={styles.statusRow}>
            {serviceRecord?.isFlagged && (
              <Ionicons name="warning" size={14} color={colors.warning} style={{ marginRight: 4 }} />
            )}
            <Text style={[
              styles.cardValue,
              serviceRecord?.isFlagged && { color: colors.warning },
            ]}>
              {serviceRecord?.isFlagged ? 'Flagged readings' : job.status === 'complete' ? 'Complete' : job.status}
            </Text>
          </View>
        </View>

        {/* Chemical readings */}
        {serviceRecord ? (
          <>
            <Text style={styles.sectionTitle}>Chemical Readings</Text>
            <View style={styles.card}>
              {(Object.keys(READING_LABELS) as Array<keyof typeof READING_LABELS>).map((key, i) => {
                const reading = serviceRecord.readings[key as keyof ServiceRecord['readings']];
                if (!reading) return null;
                const isFlagged = serviceRecord.flaggedReadings.includes(key);
                return (
                  <View
                    key={key}
                    style={[styles.readingRow, i > 0 && styles.readingRowBorder]}
                  >
                    <View style={styles.readingLeft}>
                      <View style={[styles.readingDot, { backgroundColor: readingColor(reading.status) }]} />
                      <Text style={styles.readingName}>{READING_LABELS[key]}</Text>
                      {isFlagged && (
                        <Ionicons name="warning" size={12} color={colors.warning} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={[
                      styles.readingVal,
                      isFlagged && { color: colors.warning },
                    ]}>
                      {reading.value.toFixed(reading.value % 1 === 0 ? 0 : 1)}
                      {READING_UNITS[key]}
                    </Text>
                  </View>
                );
              })}

              {/* LSI row */}
              <View style={[styles.readingRow, styles.readingRowBorder]}>
                <View style={styles.readingLeft}>
                  <View style={[
                    styles.readingDot,
                    {
                      backgroundColor:
                        Math.abs(serviceRecord.lsiScore) <= 0.5 ? colors.success : colors.warning,
                    },
                  ]} />
                  <Text style={styles.readingName}>LSI</Text>
                </View>
                <Text style={styles.readingVal}>
                  {serviceRecord.lsiScore >= 0 ? '+' : ''}
                  {serviceRecord.lsiScore.toFixed(2)}
                  {'  '}
                  <Text style={styles.lsiLabel}>{serviceRecord.lsiLabel}</Text>
                </Text>
              </View>
            </View>

            {/* Treatments */}
            {serviceRecord.treatments.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Treatments Applied</Text>
                <View style={styles.card}>
                  {serviceRecord.treatments.map((t, i) => (
                    <View key={i} style={[styles.treatmentRow, i > 0 && styles.readingRowBorder]}>
                      <Text style={styles.treatmentName}>{t.productName}</Text>
                      <Text style={styles.treatmentAmount}>
                        {t.actual} {t.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Notes */}
            {serviceRecord.customerNote ? (
              <>
                <Text style={styles.sectionTitle}>Notes</Text>
                <View style={styles.card}>
                  <Text style={styles.notesText}>{serviceRecord.customerNote}</Text>
                </View>
              </>
            ) : null}

            {/* Ref */}
            <Text style={styles.refText}>Report ref: {serviceRecord.ref}</Text>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.centredInCard}>
              <Ionicons name="time-outline" size={32} color={colors.border} />
              <Text style={styles.pendingText}>
                {job.status === 'pending' || job.status === 'in_progress'
                  ? 'Service not yet completed'
                  : 'No report available'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
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
  headerSpacer: {
    width: 32,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
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
    marginTop: spacing.sm,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 80,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    paddingLeft: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  readingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  readingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  readingDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  readingName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  readingVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  lsiLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
  },
  treatmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  treatmentName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    flex: 1,
  },
  treatmentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notesText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },
  refText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  centredInCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  pendingText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
