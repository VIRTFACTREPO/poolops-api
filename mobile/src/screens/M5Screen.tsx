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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { getApiClient } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type M5RouteParams = { jobId?: string };
type M5ScreenRouteProp = RouteProp<{ M5: M5RouteParams }, 'M5'>;

interface JobDetail {
  id: string;
  status: string;
  customer: { name: string; address: string; phone?: string } | null;
  pool: {
    id: string;
    volumeLitres: number;
    poolType: string;
    surfaceType?: string;
    indoorOutdoor?: string;
    gateAccess?: string;
    warnings?: string;
    equipmentNotes?: string;
  } | null;
  equipment: { id: string; name: string; type: string; manufacturer?: string; model?: string }[];
  lastVisits: { date: string; isFlagged: boolean; lsiLabel: string; lsiScore: number }[];
}

function capitalize(str?: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function daysAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function M5Screen() {
  const route = useRoute<M5ScreenRouteProp>();
  const navigation = useNavigation();
  const jobId = route.params?.jobId;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    getApiClient()
      .get<{ ok: boolean; data: JobDetail }>(`/technician/jobs/${jobId}`)
      .then((res) => setJob(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleStartJob = async () => {
    if (!jobId || starting) return;
    setStarting(true);
    try {
      await getApiClient().patch(`/technician/jobs/${jobId}`, { status: 'in_progress' });
    } catch {
      // Continue even if patch fails — M6 will retry
    } finally {
      setStarting(false);
    }
    // @ts-ignore
    navigation.navigate('M6', { jobId });
  };

  const pool = job?.pool;
  const specs = pool
    ? ([
        pool.volumeLitres ? { icon: 'water-outline', label: `${Math.round(pool.volumeLitres / 1000)}k L` } : null,
        pool.surfaceType ? { icon: 'layers-outline', label: capitalize(pool.surfaceType) } : null,
        pool.poolType ? { icon: 'flask-outline', label: capitalize(pool.poolType) } : null,
        pool.indoorOutdoor === 'outdoor' ? { icon: 'sunny-outline', label: 'Outdoor' } :
          pool.indoorOutdoor === 'indoor' ? { icon: 'home-outline', label: 'Indoor' } : null,
      ].filter(Boolean) as { icon: string; label: string }[])
    : [];

  const accessItems: { label: string; value: string }[] = [];
  if (pool?.gateAccess) accessItems.push({ label: 'Gate access', value: pool.gateAccess });
  if (pool?.warnings) accessItems.push({ label: 'Warning', value: pool.warnings });
  if (pool?.equipmentNotes) accessItems.push({ label: 'Notes', value: pool.equipmentNotes });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.error, textAlign: 'center' }}>{error ?? 'Job not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{job.customer?.name ?? 'Unknown'}</Text>
          <Text style={styles.headerAddr}>{job.customer?.address ?? ''}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{capitalize(job.status)}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Access Notes */}
        {accessItems.length > 0 && (
          <View style={styles.accessCard}>
            <View style={styles.accessHeader}>
              <Ionicons name="key" size={13} color="#B45309" />
              <Text style={styles.accessLabel}>Access notes</Text>
            </View>
            {accessItems.map((item, idx) => (
              <View key={idx} style={styles.accessRow}>
                <Text style={styles.accessKey}>{item.label}</Text>
                <Text style={styles.accessVal}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pool Specs */}
        {specs.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Pool specs</Text>
            <View style={styles.specsCard}>
              <View style={styles.specsRow}>
                {specs.map((spec, idx) => (
                  <View key={idx} style={styles.specPill}>
                    <Ionicons name={spec.icon as React.ComponentProps<typeof Ionicons>['name']} size={13} color="#374151" />
                    <Text style={styles.specPillText}>{spec.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Equipment */}
        {job.equipment.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Equipment</Text>
            <View style={styles.equipCard}>
              {job.equipment.map((item, idx) => (
                <View key={item.id} style={[styles.equipRow, idx === job.equipment.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.equipKey}>{capitalize(item.type)}</Text>
                  <Text style={styles.equipVal}>{item.name}{item.model ? ` — ${item.model}` : ''}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Last Visits */}
        {job.lastVisits.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Last {job.lastVisits.length} visit{job.lastVisits.length !== 1 ? 's' : ''}</Text>
            <View style={styles.visitsCard}>
              {job.lastVisits.map((visit, idx) => (
                <View key={idx} style={[styles.visitRow, idx === job.lastVisits.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.visitDate}>{daysAgo(visit.date)}</Text>
                  <Text style={styles.visitSummary}>LSI {visit.lsiScore?.toFixed(2) ?? '—'} · {visit.lsiLabel}</Text>
                  <View style={[styles.visitDot, { backgroundColor: visit.isFlagged ? colors.error : colors.success }]} />
                </View>
              ))}
            </View>
          </>
        )}

        {job.lastVisits.length === 0 && (
          <View style={styles.noVisits}>
            <Text style={styles.noVisitsText}>No previous service records</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Footer */}
      {job.status !== 'complete' && (
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.startBtn, starting && { opacity: 0.7 }]} onPress={handleStartJob} disabled={starting}>
            {starting
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.startBtnText}>{job.status === 'in_progress' ? 'Resume job' : 'Start job'}</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F3' },
  header: {
    padding: 12,
    paddingHorizontal: 20,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
  headerAddr: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  statusPill: {
    backgroundColor: '#F3F4F6', borderRadius: borderRadius.full,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  statusPillText: { fontSize: 11, fontWeight: '600', color: colors.textLight, textTransform: 'capitalize' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 8 },
  accessCard: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderLeftWidth: 4, borderLeftColor: '#F59E0B', borderRadius: borderRadius.xxl,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  accessHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  accessLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: '#B45309' },
  accessRow: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  accessKey: { fontSize: 12, fontWeight: '600', color: '#92400E', minWidth: 90 },
  accessVal: { fontSize: 12, color: '#92400E', flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted },
  specsCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.xxl, padding: 12,
  },
  specsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  specPill: {
    backgroundColor: '#F5F5F3', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.lg, paddingVertical: 7, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  specPillText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  equipCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.xxl, overflow: 'hidden',
  },
  equipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  equipKey: { fontSize: 12, color: colors.textMuted, minWidth: 90 },
  equipVal: { fontSize: 12, fontWeight: '500', color: '#374151', flex: 1 },
  visitsCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.xxl, overflow: 'hidden',
  },
  visitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  visitDate: { fontSize: 12, fontWeight: '600', color: '#374151', minWidth: 80 },
  visitSummary: { fontSize: 12, color: '#6B7280', flex: 1 },
  visitDot: { width: 7, height: 7, borderRadius: borderRadius.full },
  noVisits: { alignItems: 'center', paddingVertical: 24 },
  noVisitsText: { fontSize: 13, color: colors.textMuted },
  footer: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  startBtn: {
    width: '100%', backgroundColor: '#111827', borderRadius: borderRadius.xxxl,
    minHeight: 56, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  startBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
