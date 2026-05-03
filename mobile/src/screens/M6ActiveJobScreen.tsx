import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  ActiveJobProvider,
  ActiveJobTab,
  ACTIVE_JOB_TABS,
  ChemicalReadings,
  PoolSnapshot,
  TreatmentRecommendation,
  useActiveJob,
} from '../context/ActiveJobContext';
import { PhotoCaptureTab } from './PhotoCaptureTab';
import { JobNotesTab } from './JobNotesTab';
import { M11CompleteScreen } from './M11CompleteScreen';
import { calculateLsi } from '../utils/lsi';
import { M8TreatmentScreen } from './M8TreatmentScreen';
import { borderRadius, colors, spacing, typography } from '../theme/tokens';
import { enqueueJobStart } from '../services/offlineQueue';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { SyncBanner } from '../components/SyncBanner';
import { getApiClient } from '../services/api';

type M6RouteParams = {
  jobId?: string;
};

type M6RouteProp = RouteProp<{ M6: M6RouteParams }, 'M6'>;

type ReadingKey = keyof ChemicalReadings;

type ReadingRule = {
  key: ReadingKey;
  label: string;
  min: number;
  max: number;
  step?: string;
};

function getReadingsConfig(poolType?: string): ReadingRule[] {
  if (poolType === 'spa') {
    return [
      { key: 'freeChlorine', label: 'Free Chlorine', min: 3.0, max: 5.0, step: '0.1' },
      { key: 'ph', label: 'pH', min: 7.2, max: 7.8, step: '0.1' },
      { key: 'alkalinity', label: 'Alkalinity', min: 80, max: 120, step: '1' },
      { key: 'calciumHardness', label: 'Calcium Hardness', min: 150, max: 250, step: '1' },
      { key: 'temperature', label: 'Temperature (°C)', min: 37, max: 40, step: '0.1' },
    ];
  }
  return [
    { key: 'freeChlorine', label: 'Free Chlorine', min: 1.0, max: 3.0, step: '0.1' },
    { key: 'ph', label: 'pH', min: 7.2, max: 7.6, step: '0.1' },
    { key: 'alkalinity', label: 'Alkalinity', min: 80, max: 120, step: '1' },
    { key: 'calciumHardness', label: 'Calcium Hardness', min: 200, max: 400, step: '1' },
    { key: 'cyanuricAcid', label: 'Cyanuric Acid', min: 30, max: 50, step: '1' },
  ];
}

const LAST_READINGS_MOCK: ChemicalReadings = {
  freeChlorine: '0.8',
  ph: '7.4',
  alkalinity: '95',
  calciumHardness: '280',
  cyanuricAcid: '42',
};

const TAB_META: { key: ActiveJobTab; title: string; cta: string; ctaColor: string }[] = [
  { key: 'readings', title: 'Readings', cta: 'Next — Treatment', ctaColor: '#111827' },
  { key: 'treatment', title: 'Treatment', cta: 'Save treatment', ctaColor: '#111827' },
  { key: 'photos', title: 'Photos', cta: 'Save photos', ctaColor: '#111827' },
  { key: 'notes', title: 'Notes', cta: 'Save notes', ctaColor: '#111827' },
  { key: 'complete', title: 'Complete', cta: 'Complete job', ctaColor: '#111827' },
];

function formatVisitDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function AbandonSheet({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.sheetBackdrop} onPress={onCancel}>
        <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Abandon active job?</Text>
          <Text style={styles.sheetBody}>You have unsaved progress. Are you sure you want to abandon this job?</Text>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetBtnGhost} onPress={onCancel}>
              <Text style={styles.sheetBtnGhostText}>Keep working</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetBtnDanger} onPress={onConfirm}>
              <Text style={styles.sheetBtnDangerText}>Abandon</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function parseReading(value: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function readingState(value: string, min: number, max: number, isFocused = false) {
  const num = parseReading(value);
  if (num === null || value.trim() === '') return { dot: '#D1D5DB', isValid: false, status: '' as '' | 'LOW' | 'HIGH' };
  if (num >= min && num <= max) return { dot: '#22C55E', isValid: true, status: '' as const };
  // Don't show error state while the field is actively being edited
  if (isFocused) return { dot: '#D1D5DB', isValid: false, status: '' as '' | 'LOW' | 'HIGH' };
  if (num < min) return { dot: '#EF4444', isValid: false, status: 'LOW' as const };
  return { dot: '#EF4444', isValid: false, status: 'HIGH' as const };
}

function buildRecommendedTreatments(readings: ChemicalReadings): TreatmentRecommendation[] {
  const output: TreatmentRecommendation[] = [];
  const cl = parseReading(readings.freeChlorine);
  const ph = parseReading(readings.ph);
  const alk = parseReading(readings.alkalinity);
  const calcium = parseReading(readings.calciumHardness);
  const cya = parseReading(readings.cyanuricAcid);

  if (cl !== null && cl < 1) {
    output.push({ id: 'liq-chlorine', name: 'Liquid Chlorine', recommendedAmount: 400, unit: 'ml', reason: 'Raise free chlorine' });
  }
  if (ph !== null && ph < 7.2) {
    output.push({ id: 'ph-up', name: 'pH Buffer', recommendedAmount: 150, unit: 'g', reason: 'Raise pH into target range' });
  }
  if (ph !== null && ph > 7.6) {
    output.push({ id: 'ph-down', name: 'Muriatic Acid', recommendedAmount: 250, unit: 'ml', reason: 'Lower pH into target range' });
  }
  if (alk !== null && alk < 80) {
    output.push({ id: 'alk-up', name: 'Alkalinity Up', recommendedAmount: 300, unit: 'g', reason: 'Raise alkalinity' });
  }
  if (alk !== null && alk > 120) {
    output.push({ id: 'alk-down', name: 'Muriatic Acid', recommendedAmount: 500, unit: 'ml', reason: 'Lower alkalinity — add acid in small doses with pump running' });
  }
  if (calcium !== null && calcium > 400) {
    output.push({ id: 'calcium-high', name: 'Partial drain & refill', recommendedAmount: 0, unit: 'g', reason: 'Calcium hardness too high — no chemical fix, dilution required' });
  }
  if (cya !== null && cya > 50) {
    output.push({ id: 'cya-high', name: 'Partial drain & refill', recommendedAmount: 0, unit: 'g', reason: 'Cyanuric acid too high — no chemical fix, dilution required' });
  }

  if (output.length === 0) {
    output.push({ id: 'maintain', name: 'No correction needed', recommendedAmount: 0, unit: 'g', reason: 'All readings within target range' });
  }

  return output;
}

function ReadingsTab() {
  const { readings, pools, readingsPoolIndex, setReadings, useLastReadings, setTreatmentPrefill, setTabComplete } = useActiveJob();
  const [focusedField, setFocusedField] = useState<ReadingKey | null>(null);

  const currentPoolType = pools[readingsPoolIndex]?.type;
  const isSpa = currentPoolType === 'spa';
  const readingRules = useMemo(() => getReadingsConfig(currentPoolType), [currentPoolType]);

  const derived = useMemo(
    () =>
      readingRules.map((rule) => ({
        ...rule,
        ...readingState(readings[rule.key] ?? '', rule.min, rule.max, focusedField === rule.key),
      })),
    [readings, focusedField, readingRules],
  );

  const hasAllReadings = readingRules.every((r) => (readings[r.key] ?? '').trim() !== '');
  const allValid = derived.every((d) => d.isValid);

  const lsiResult = useMemo(() => {
    if (isSpa || !hasAllReadings) return null;
    const ph = parseReading(readings.ph);
    const alkalinity = parseReading(readings.alkalinity);
    const calciumHardness = parseReading(readings.calciumHardness);
    const cyanuricAcid = parseReading(readings.cyanuricAcid);
    if (ph === null || alkalinity === null || calciumHardness === null || cyanuricAcid === null) return null;
    return calculateLsi({ ph, alkalinity, calciumHardness, cyanuricAcid });
  }, [isSpa, hasAllReadings, readings]);

  const recommendations = useMemo(() => {
    if (!lsiResult) return [];
    return buildRecommendedTreatments(readings);
  }, [lsiResult, readings]);

  useEffect(() => {
    setTabComplete('readings', allValid && hasAllReadings);
  }, [allValid, hasAllReadings, setTabComplete]);

  useEffect(() => {
    setTreatmentPrefill(recommendations.filter((r) => r.recommendedAmount > 0));
  }, [recommendations, setTreatmentPrefill]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.tabContentWrap}
    >
      {pools.length > 1 && (
        <View style={styles.readingsPoolHeader}>
          <Text style={styles.readingsPoolLabel}>
            {`${isSpa ? 'Spa Pool' : 'Pool'} · ${readingsPoolIndex + 1} of ${pools.length}`}
          </Text>
        </View>
      )}

      {derived.map((field) => (
        <View key={field.key} style={styles.readingField}>
          <View style={[styles.trafficDot, { backgroundColor: field.dot }]} />
          <Text style={styles.readingLabel}>{field.label}</Text>
          <TextInput
            style={[styles.readingInput, field.status ? styles.readingInputError : null]}
            keyboardType="decimal-pad"
            value={readings[field.key] ?? ''}
            onChangeText={(text) => setReadings({ [field.key]: text.replace(/[^0-9.]/g, '') })}
            onFocus={() => setFocusedField(field.key)}
            onBlur={() => setFocusedField(null)}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={[styles.readingTarget, field.status ? styles.readingTargetBad : null]}>
            {field.status ? `${field.status} · ${field.min}-${field.max}` : `${field.min}-${field.max}`}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.useLastLink} onPress={() => useLastReadings(LAST_READINGS_MOCK)}>
        <Text style={styles.useLastText}>Use last readings</Text>
      </TouchableOpacity>

      {lsiResult && (
        <View style={styles.lsiCard}>
          <Text style={styles.lsiLabel}>LSI Water Balance</Text>
          <Text style={styles.lsiScore}>{lsiResult.score.toFixed(2)}</Text>
          <Text style={styles.lsiDesc}>{lsiResult.description}</Text>
        </View>
      )}

      {lsiResult && (
        <View style={styles.recoCard}>
          <Text style={styles.recoLabel}>Recommended Treatment</Text>
          {recommendations.map((item) => (
            <View key={item.id} style={styles.recoItem}>
              <View style={styles.recoDot} />
              <Text style={styles.recoText}>
                {item.recommendedAmount > 0 ? `Add ${item.recommendedAmount}${item.unit} ${item.name}` : item.name}
                {' · '}
                {item.reason}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ActiveJobContent() {
  const navigation = useNavigation();
  const { jobId, pools, startedAt, currentTab, completedTabs, readingsPoolIndex, setReadingsPoolIndex, setCurrentTab, markTabComplete, setPools } = useActiveJob();
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt);
  const [showAbandonSheet, setShowAbandonSheet] = useState(false);
  const [poolInfoExpanded, setPoolInfoExpanded] = useState(false);
  const queue = useOfflineQueue();

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  // Enqueue JOB_START when the job screen mounts — if offline it will sync later
  useEffect(() => {
    if (!jobId) return;
    const tryStart = async () => {
      try {
        await getApiClient().patch(`/technician/jobs/${jobId}`, { status: 'in_progress' });
      } catch {
        await enqueueJobStart(jobId, { startedAt: new Date(startedAt).toISOString() });
      }
    };
    tryStart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowAbandonSheet(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const loadJob = async () => {
      try {
        const envelope = await getApiClient().get<{ ok: boolean; data: Record<string, unknown> }>(`/technician/jobs/${jobId}`);
        const res = (envelope as any)?.data ?? envelope as Record<string, unknown>;
        const rawPools: any[] = Array.isArray(res?.pools)
          ? (res.pools as any[])
          : res?.pool
          ? [res.pool]
          : [];
        const normalized: PoolSnapshot[] = rawPools.map((pool: any, index: number) => ({
          poolId: String(pool?.id ?? pool?.poolId ?? `pool-${index + 1}`),
          name: pool?.name,
          type: pool?.poolType ?? pool?.type,
          volumeLitres: pool?.volumeLitres ?? pool?.volume,
          gateAccess: pool?.gateAccess,
          warnings: Array.isArray(pool?.warnings) ? pool.warnings : [],
          equipment: Array.isArray(res?.equipment) ? (res.equipment as any[]) : [],
          lastVisits: Array.isArray(res?.lastVisits) ? (res.lastVisits as any[]) : [],
        }));
        setPools(normalized);
      } catch {
        setPools([]);
      }
    };
    loadJob();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const activeTabMeta = useMemo(() => TAB_META.find((t) => t.key === currentTab) ?? TAB_META[0], [currentTab]);

  const ctaLabel = useMemo(() => {
    if (currentTab === 'readings' && pools.length > 1 && readingsPoolIndex < pools.length - 1) {
      return `Next Pool (${readingsPoolIndex + 2} of ${pools.length}) →`;
    }
    return activeTabMeta.cta;
  }, [currentTab, pools.length, readingsPoolIndex, activeTabMeta.cta]);

  const handleCta = () => {
    if (currentTab === 'readings' && pools.length > 1 && readingsPoolIndex < pools.length - 1) {
      setReadingsPoolIndex(readingsPoolIndex + 1);
      return;
    }
    if (currentTab !== 'readings') {
      markTabComplete(currentTab);
    }
    const idx = ACTIVE_JOB_TABS.indexOf(currentTab);
    if (idx < ACTIVE_JOB_TABS.length - 1) {
      setCurrentTab(ACTIVE_JOB_TABS[idx + 1]);
      return;
    }
    navigation.goBack();
  };

  const handleAbandon = () => {
    setShowAbandonSheet(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowAbandonSheet(true)} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Active Job</Text>
          <Text style={styles.subtitle}>{jobId ? `Job ${jobId}` : 'No job id'}</Text>
        </View>
      </View>

      <SyncBanner queue={queue} />

      <View style={styles.timerPill}>
        <View style={styles.timerPulse} />
        <Text style={styles.timerLabel}>Live timer</Text>
        <Text style={styles.timerValue}>{formatDuration(elapsed)}</Text>
      </View>

      {pools.length > 0 && (
        <View style={styles.poolSection}>
          <TouchableOpacity style={styles.poolToggle} onPress={() => setPoolInfoExpanded((v) => !v)} activeOpacity={0.7}>
            <View style={styles.poolToggleLeft}>
              <Text style={styles.poolToggleTitle}>
                {pools.length === 1
                  ? `Pool 1${pools[0].name ? ` — ${pools[0].name}` : ''}`
                  : `${pools.length} pools`}
              </Text>
              <Text style={styles.poolToggleMeta}>
                {`${pools[0].type ?? '—'} · ${pools[0].volumeLitres != null ? `${pools[0].volumeLitres}L` : '—'}`}
              </Text>
            </View>
            <Ionicons name={poolInfoExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {poolInfoExpanded && pools.map((pool, idx) => (
            <View key={pool.poolId} style={styles.poolCard}>
              <Text style={styles.poolTitle}>{`Pool ${idx + 1}${pool.name ? ` — ${pool.name}` : ''}`}</Text>
              <Text style={styles.poolMeta}>{`Type: ${pool.type ?? '—'} · Volume: ${pool.volumeLitres ?? '—'}L`}</Text>
              <Text style={styles.poolMeta}>{`Gate access: ${pool.gateAccess ?? '—'}`}</Text>
              <Text style={styles.poolMeta}>{`Warnings: ${(pool.warnings ?? []).length ? pool.warnings?.join(', ') : 'None'}`}</Text>
              {!!pool.equipment?.length && <Text style={styles.poolSubhead}>Equipment</Text>}
              {pool.equipment?.map((eq, eIdx) => (
                <Text key={`${pool.poolId}-eq-${eIdx}`} style={styles.poolMeta}>• {eq.name ?? eq.type ?? 'Equipment'}</Text>
              ))}
              {!!pool.lastVisits?.length && <Text style={styles.poolSubhead}>Last visits</Text>}
              {pool.lastVisits?.map((visit, vIdx) => (
                <Text key={`${pool.poolId}-visit-${vIdx}`} style={styles.poolMeta}>• {visit.date ? formatVisitDate(visit.date) : '—'}{visit.lsiLabel ? ` · ${visit.lsiLabel}` : ''}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={styles.tabBarWrap}>
        {TAB_META.map((tab) => {
          const active = currentTab === tab.key;
          const done = completedTabs.includes(tab.key);
          return (
            <TouchableOpacity key={tab.key} style={[styles.tabItem, active && styles.tabItemActive]} onPress={() => setCurrentTab(tab.key)}>
              <Text style={[styles.tabTitle, active && styles.tabTitleActive]}>{tab.title}</Text>
              <View style={[styles.tabCompleteDot, done && styles.tabCompleteDotDone]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.tabSlot}>
          {currentTab === 'readings' ? (
            <ReadingsTab />
          ) : currentTab === 'treatment' ? (
            <M8TreatmentScreen />
          ) : currentTab === 'photos' ? (
            <PhotoCaptureTab />
          ) : currentTab === 'notes' ? (
            <JobNotesTab />
          ) : currentTab === 'complete' ? (
            <M11CompleteScreen />
          ) : (
            <View style={styles.slotCard}>
              <Text style={styles.slotTitle}>{activeTabMeta.title} tab content</Text>
              <Text style={styles.slotBody}>This tab slot is wired to ActiveJobContext and persists active state across all five tabs.</Text>
            </View>
          )}
        </View>

        {currentTab !== 'complete' ? (
          <View style={styles.stickyCtaWrap}>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: activeTabMeta.ctaColor }]} onPress={handleCta}>
              <Text style={styles.ctaText}>{ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <AbandonSheet visible={showAbandonSheet} onCancel={() => setShowAbandonSheet(false)} onConfirm={handleAbandon} />
    </SafeAreaView>
  );
}

export function M6ActiveJobScreen() {
  const route = useRoute<M6RouteProp>();
  return (
    <ActiveJobProvider jobId={route.params?.jobId}>
      <ActiveJobContent />
    </ActiveJobProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  header: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    fontSize: 18,
    color: colors.text,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    color: colors.text,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textLight,
  },
  timerPill: {
    marginTop: spacing.md,
    marginHorizontal: spacing.screen,
    backgroundColor: '#DCFCE7',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerPulse: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: '#22C55E',
  },
  timerLabel: {
    color: '#166534',
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
  },
  timerValue: {
    marginLeft: 'auto',
    color: '#166534',
    fontSize: typography.fontSizes.base,
    fontWeight: '700',
  },
  poolSection: {
    marginTop: spacing.md,
    marginHorizontal: spacing.screen,
    gap: spacing.sm,
  },
  poolToggle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poolToggleLeft: {
    flex: 1,
    gap: 2,
  },
  poolToggleTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  poolToggleMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.textLight,
  },
  poolCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: 4,
  },
  poolTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    color: colors.text,
  },
  poolSubhead: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  poolMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.textLight,
  },
  tabBarWrap: {
    marginTop: spacing.md,
    marginHorizontal: spacing.screen,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#111827',
  },
  tabTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabTitleActive: {
    color: '#111827',
    fontWeight: '700',
  },
  tabCompleteDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
  },
  tabCompleteDotDone: {
    backgroundColor: '#22C55E',
  },
  tabContentWrap: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  readingsPoolHeader: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  readingsPoolLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  readingField: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  readingLabel: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: '#374151',
    fontWeight: '500',
  },
  readingInput: {
    width: 64,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
    color: '#111827',
    fontWeight: '700',
  },
  readingInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  readingTarget: {
    minWidth: 78,
    textAlign: 'right',
    fontSize: 10,
    color: '#9CA3AF',
  },
  readingTargetBad: {
    color: '#EF4444',
    fontWeight: '600',
  },
  useLastLink: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  useLastText: {
    fontSize: typography.fontSizes.sm,
    color: '#9CA3AF',
  },
  lsiCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  lsiLabel: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lsiScore: {
    fontSize: 28,
    color: '#B45309',
    fontWeight: '700',
  },
  lsiDesc: {
    fontSize: typography.fontSizes.sm,
    color: '#92400E',
  },
  recoCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recoLabel: {
    fontSize: 10,
    color: '#0369A1',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  recoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  recoDot: {
    width: 5,
    height: 5,
    borderRadius: borderRadius.full,
    backgroundColor: '#0369A1',
    marginTop: 6,
  },
  recoText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  slotCard: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  slotTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  slotBody: {
    fontSize: typography.fontSizes.sm,
    color: colors.textLight,
    lineHeight: 20,
  },
  tabSlot: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },
  stickyCtaWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingVertical: 14,
    paddingHorizontal: spacing.screen,
  },
  ctaBtn: {
    width: '100%',
    minHeight: 56,
    borderRadius: borderRadius.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ctaText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.base,
    fontWeight: '700',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sheetBody: {
    fontSize: typography.fontSizes.sm,
    color: colors.textLight,
    lineHeight: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sheetBtnGhost: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnGhostText: {
    color: colors.text,
    fontWeight: '600',
  },
  sheetBtnDanger: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  sheetBtnDangerText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
});
