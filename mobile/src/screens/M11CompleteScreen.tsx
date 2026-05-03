import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { PoolSnapshot, useActiveJob } from '../context/ActiveJobContext';
import { calculateLsi } from '../utils/lsi';
import { enqueueJobCompletion } from '../services/offlineQueue';
import { markJobCompleted } from '../state/completedJobsStore';
import { borderRadius, colors, spacing, typography } from '../theme/tokens';
import { getApiClient } from '../services/api';

function isSpa(type?: string): boolean {
  return !!type && type.toLowerCase().includes('spa');
}

function poolDisplayLabel(pool?: PoolSnapshot): string {
  return isSpa(pool?.type) ? 'Spa Pool' : 'Pool';
}

function toNum(value: string) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function M11CompleteScreen() {
  const navigation = useNavigation();
  const { jobId, pools, activePoolIndex, setActivePoolIndex, poolReadings, treatmentEntries, photos, customerNote, officeNote } = useActiveJob();
  const [loading, setLoading] = useState(false);
  const [completionRefs, setCompletionRefs] = useState<Array<{ serviceRecordId?: string; ref?: string; poolId?: string }> | null>(null);

  const effectivePools = pools.length ? pools : [{ poolId: 'unknown' }];

  const perPoolLsi = useMemo(() =>
    effectivePools.map((_, i) => {
      const r = poolReadings[i];
      if (!r) return null;
      const ph = toNum(r.ph);
      const alkalinity = toNum(r.alkalinity);
      const calciumHardness = toNum(r.calciumHardness);
      const cyanuricAcid = toNum(r.cyanuricAcid);
      if (ph === null || alkalinity === null || calciumHardness === null || cyanuricAcid === null) return null;
      return calculateLsi({ ph, alkalinity, calciumHardness, cyanuricAcid });
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [poolReadings, effectivePools.length]);

  const displayReadings = poolReadings[activePoolIndex] ?? poolReadings[0];
  const displayLsi = perPoolLsi[activePoolIndex] ?? perPoolLsi[0];

  const photoCount = [photos.before, photos.after].filter(Boolean).length;

  const treatments = treatmentEntries.map((t) => ({
    id: t.id,
    name: t.name,
    recommendedAmount: t.recommendedAmount,
    actualAmount: Number(t.actualAmount || 0),
    unit: t.unit,
  }));

  const payload = useMemo(() => ({
    pools: effectivePools.map((pool, i) => ({
      poolId: pool.poolId,
      readings: poolReadings[i] ?? poolReadings[0],
      lsi: perPoolLsi[i] ?? null,
      treatments,
    })),
    notes: {
      customer: customerNote,
      office: officeNote,
    },
    photo_urls: {
      before: photos.before?.startsWith('https://') ? photos.before : null,
      after: photos.after?.startsWith('https://') ? photos.after : null,
      additional: [] as string[],
    },
    completedAt: new Date().toISOString(),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [customerNote, officeNote, perPoolLsi, photos, poolReadings, pools, treatmentEntries]);

  const handleComplete = async () => {
    if (!jobId || loading) return;
    setLoading(true);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const envelope = await getApiClient().post<{ ok: boolean; data: unknown }>(`/technician/jobs/${jobId}/complete`, payload as Record<string, unknown>);
      const data = (envelope as any)?.data;
      const refs: Array<{ serviceRecordId?: string; ref?: string; poolId?: string }> = Array.isArray(data) ? data : [];
      markJobCompleted(jobId, refs);
      setCompletionRefs(refs.length > 0 ? refs : [{ ref: 'saved' }]);
    } catch (err: any) {
      const is409 = err?.message?.includes('409') || err?.status === 409;
      if (!is409) {
        await enqueueJobCompletion({
          jobId,
          payload: payload as Record<string, unknown>,
          createdAt: new Date().toISOString(),
        });
      }
      markJobCompleted(jobId, []);
      setCompletionRefs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissConfirmation = () => {
    // @ts-ignore
    navigation.navigate('TechnicianTabs', { screen: 'Home' });
  };

  if (completionRefs !== null) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, styles.confirmCard]}>
            <Text style={styles.confirmTitle}>Job Complete</Text>
            {completionRefs.length === 0 ? (
              <Text style={styles.cardBody}>Saved offline — will sync when connected.</Text>
            ) : completionRefs[0]?.ref === 'saved' ? (
              <Text style={styles.cardBody}>Saved successfully.</Text>
            ) : (
              completionRefs.map((ref, i) => (
                <View key={ref.serviceRecordId ?? String(i)} style={styles.refRow}>
                  <Text style={styles.refLabel}>{completionRefs.length > 1 ? `${poolDisplayLabel(effectivePools[i])} ${i + 1}` : poolDisplayLabel(effectivePools[i])}</Text>
                  <Text style={styles.refValue}>{ref.ref ?? ref.serviceRecordId ?? '—'}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.completeBtn} onPress={handleDismissConfirmation}>
            <Text style={styles.completeBtnText}>Back to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{(() => {
            const label = poolDisplayLabel(pools[activePoolIndex]);
            const count = Math.max(pools.length, 1);
            const idx = Math.min(activePoolIndex + 1, count);
            const name = pools[activePoolIndex]?.name;
            return `${label} ${idx} of ${count}${name ? ` — ${name}` : ''}`;
          })()}</Text>
          {pools.length > 1 && (
            <View style={styles.poolStepRow}>
              <TouchableOpacity onPress={() => setActivePoolIndex(Math.max(0, activePoolIndex - 1))}><Text style={styles.poolStepBtn}>Previous</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setActivePoolIndex(Math.min(pools.length - 1, activePoolIndex + 1))}><Text style={styles.poolStepBtn}>Next</Text></TouchableOpacity>
            </View>
          )}
          <Text style={styles.cardBody}>FC {displayReadings?.freeChlorine || '—'} · pH {displayReadings?.ph || '—'} · TA {displayReadings?.alkalinity || '—'}</Text>
          <Text style={styles.cardBody}>CH {displayReadings?.calciumHardness || '—'} · CYA {displayReadings?.cyanuricAcid || '—'}</Text>
          <Text style={styles.cardMeta}>LSI: {displayLsi ? displayLsi.score.toFixed(2) : '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Treatments</Text>
          {treatmentEntries.length === 0 ? (
            <Text style={styles.cardBody}>No treatments entered</Text>
          ) : (
            treatmentEntries.map((item) => (
              <Text key={item.id} style={styles.cardBody}>
                {item.name || 'Custom chemical'} · {item.actualAmount || '0'}{item.unit}
              </Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photos</Text>
          <Text style={styles.cardBody}>{photoCount} attached</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.cardBody}>Customer: {customerNote || '—'}</Text>
          <Text style={styles.cardBody}>Office: {officeNote || '—'}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.completeBtn, loading && styles.completeBtnDisabled]} onPress={handleComplete} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.completeBtnText}>Mark complete</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingVertical: 14,
    paddingHorizontal: spacing.screen,
    marginHorizontal: -spacing.screen,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
  },
  poolStepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  poolStepBtn: { color: '#2563EB', fontSize: typography.fontSizes.sm, fontWeight: '600' },
  cardBody: {
    fontSize: typography.fontSizes.sm,
    color: '#374151',
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
  },
  completeBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: borderRadius.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 16,
  },
  completeBtnDisabled: {
    opacity: 0.7,
  },
  completeBtnText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.base,
    fontWeight: '700',
  },
  confirmCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  confirmTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: '700',
    color: '#166534',
    marginBottom: spacing.xs,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  refLabel: {
    fontSize: typography.fontSizes.sm,
    color: '#374151',
    fontWeight: '600',
  },
  refValue: {
    fontSize: typography.fontSizes.sm,
    color: '#374151',
    fontFamily: 'monospace',
  },
});