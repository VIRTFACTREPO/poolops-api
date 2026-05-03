import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChemicalReadings, PoolSnapshot, TreatmentEntry, TreatmentRecommendation, useActiveJob } from '../context/ActiveJobContext';
import { borderRadius, colors, spacing, typography } from '../theme/tokens';

type StockRule = {
  amount: number;
  lowThreshold: number;
  unit: 'ml' | 'g';
};

const STOCK_RULES: Record<string, StockRule> = {
  'liquid chlorine': { amount: 5000, lowThreshold: 1000, unit: 'ml' },
  'chlorine / bromine': { amount: 2000, lowThreshold: 500, unit: 'ml' },
  'ph buffer': { amount: 2000, lowThreshold: 600, unit: 'g' },
  'muriatic acid': { amount: 3500, lowThreshold: 800, unit: 'ml' },
  'alkalinity up': { amount: 2400, lowThreshold: 700, unit: 'g' },
};

function parseReading(value: string) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function isSpa(type?: string): boolean {
  return !!type && type.toLowerCase().includes('spa');
}

function poolDisplayLabel(pool?: PoolSnapshot): string {
  return isSpa(pool?.type) ? 'Spa Pool' : 'Pool';
}

function buildPoolTreatments(readings: ChemicalReadings, poolType?: string): TreatmentRecommendation[] {
  const spa = isSpa(poolType);
  const cl = parseReading(readings.freeChlorine);
  const ph = parseReading(readings.ph);
  const alk = parseReading(readings.alkalinity);
  const calcium = parseReading(readings.calciumHardness);
  const cya = spa ? 0 : parseReading(readings.cyanuricAcid);

  // Only generate recommendations when all relevant readings are present
  if (cl === null || ph === null || alk === null || calcium === null || (!spa && cya === null)) return [];

  const output: TreatmentRecommendation[] = [];

  if (cl < 1) {
    output.push({
      id: 'liq-chlorine',
      name: spa ? 'Chlorine / Bromine' : 'Liquid Chlorine',
      recommendedAmount: spa ? 150 : 400,
      unit: 'ml',
      reason: 'Raise free chlorine',
    });
  }
  if (ph < 7.2) {
    output.push({ id: 'ph-up', name: 'pH Buffer', recommendedAmount: spa ? 50 : 150, unit: 'g', reason: 'Raise pH into target range' });
  }
  if (ph > 7.6) {
    output.push({ id: 'ph-down', name: 'Muriatic Acid', recommendedAmount: spa ? 80 : 250, unit: 'ml', reason: 'Lower pH into target range' });
  }
  if (alk < 80) {
    output.push({ id: 'alk-up', name: 'Alkalinity Up', recommendedAmount: spa ? 100 : 300, unit: 'g', reason: 'Raise alkalinity' });
  }
  if (alk > 120) {
    output.push({ id: 'alk-down', name: 'Muriatic Acid', recommendedAmount: spa ? 150 : 500, unit: 'ml', reason: 'Lower alkalinity — add acid in small doses with pump running' });
  }
  if (calcium < (spa ? 150 : 200)) {
    output.push({ id: 'calcium-low', name: 'Calcium Hardness Increaser', recommendedAmount: spa ? 200 : 500, unit: 'g', reason: 'Raise calcium hardness into range' });
  }
  if (calcium > (spa ? 250 : 400)) {
    output.push({ id: 'calcium-high', name: 'Partial drain & refill', recommendedAmount: 0, unit: 'g', reason: 'Calcium hardness too high — no chemical fix, dilution required' });
  }
  // CYA not applicable to spa pools
  if (!spa && cya !== null && cya < 30) {
    output.push({ id: 'cya-low', name: 'Cyanuric Acid (Stabiliser)', recommendedAmount: 200, unit: 'g', reason: 'Raise stabiliser into 30–50 range' });
  }
  if (!spa && cya !== null && cya > 50) {
    output.push({ id: 'cya-high', name: 'Partial drain & refill', recommendedAmount: 0, unit: 'g', reason: 'Cyanuric acid too high — no chemical fix, dilution required' });
  }

  if (output.length === 0) {
    output.push({ id: 'maintain', name: 'No correction needed', recommendedAmount: 0, unit: 'g', reason: 'All readings within target range' });
  }

  return output;
}

function normalizePrefillToEntries(
  prefill: Array<{ id: string; name: string; recommendedAmount: number; unit: 'ml' | 'g' }>,
  existing: TreatmentEntry[],
): TreatmentEntry[] {
  if (prefill.length === 0) return existing;

  const existingMap = new Map(existing.map((entry) => [entry.id, entry]));
  const merged = prefill.map((item) => {
    const prior = existingMap.get(item.id);
    return {
      id: item.id,
      name: item.name,
      recommendedAmount: item.recommendedAmount,
      actualAmount: prior?.actualAmount ?? (item.recommendedAmount > 0 ? String(item.recommendedAmount) : ''),
      unit: item.unit,
    };
  });

  const customRows = existing.filter((entry) => entry.id.startsWith('custom-'));
  return [...merged, ...customRows];
}

export function M8TreatmentScreen() {
  const { pools, poolReadings, treatmentPrefill, treatmentEntries, setTreatmentEntries } = useActiveJob();

  const isMultiPool = pools.length > 1;

  useEffect(() => {
    let derivedPrefill: TreatmentRecommendation[];

    if (pools.length > 1) {
      // Per-pool entries use prefixed IDs (p0-, p1-, …) to keep sections separate in the flat array
      derivedPrefill = pools.flatMap((pool, i) => {
        const readings = poolReadings[i];
        if (!readings) return [];
        return buildPoolTreatments(readings, pool.type).map((r) => ({ ...r, id: `p${i}-${r.id}` }));
      });
    } else if (pools.length === 1 && poolReadings[0]) {
      derivedPrefill = buildPoolTreatments(poolReadings[0], pools[0].type);
    } else {
      derivedPrefill = treatmentPrefill;
    }

    const next = normalizePrefillToEntries(derivedPrefill, treatmentEntries);
    if (JSON.stringify(next) !== JSON.stringify(treatmentEntries)) {
      setTreatmentEntries(next);
    }
  }, [pools, poolReadings, treatmentPrefill, treatmentEntries, setTreatmentEntries]);

  const updateEntry = (id: string, patch: Partial<TreatmentEntry>) => {
    setTreatmentEntries(treatmentEntries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const addCustomRow = () => {
    setTreatmentEntries([
      ...treatmentEntries,
      {
        id: `custom-${Date.now()}`,
        name: '',
        recommendedAmount: 0,
        actualAmount: '',
        unit: 'g',
      },
    ]);
  };

  const stockPreview = useMemo(() => {
    return treatmentEntries
      .filter((entry) => entry.name.trim().length > 0)
      .map((entry) => {
        const key = entry.name.trim().toLowerCase();
        const rule = STOCK_RULES[key] ?? { amount: 1500, lowThreshold: 400, unit: entry.unit };
        const actual = Number(entry.actualAmount || '0');
        const used = Number.isFinite(actual) ? actual : 0;
        const remaining = Math.max(0, rule.amount - used);
        const low = remaining <= rule.lowThreshold;
        return {
          id: entry.id,
          name: entry.name,
          remaining,
          low,
          unit: rule.unit,
        };
      });
  }, [treatmentEntries]);

  const customEntries = treatmentEntries.filter((e) => e.id.startsWith('custom-'));

  const renderEntry = (entry: TreatmentEntry) => (
    <View key={entry.id} style={styles.row}>
      <View style={styles.infoCol}>
        {entry.id.startsWith('custom-') ? (
          <TextInput
            style={styles.nameInput}
            value={entry.name}
            onChangeText={(text) => updateEntry(entry.id, { name: text })}
            placeholder="Chemical name"
            placeholderTextColor="#9CA3AF"
          />
        ) : (
          <Text style={styles.name}>{entry.name}</Text>
        )}
        <Text style={styles.recommended}>Recommended: {entry.recommendedAmount}{entry.unit}</Text>
      </View>

      <TextInput
        style={styles.amountInput}
        keyboardType="decimal-pad"
        value={entry.actualAmount}
        onChangeText={(text) => updateEntry(entry.id, { actualAmount: text.replace(/[^0-9.]/g, '') })}
        placeholder={entry.recommendedAmount > 0 ? String(entry.recommendedAmount) : '0'}
        placeholderTextColor="#9CA3AF"
      />
      <Text style={styles.unit}>{entry.unit}</Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
    >
      <Text style={styles.sectionLabel}>Chemicals added</Text>

      {isMultiPool ? (
        <>
          {pools.map((pool, i) => {
            const sectionEntries = treatmentEntries.filter((e) => !e.id.startsWith('custom-') && e.id.startsWith(`p${i}-`));
            return (
              <View key={pool.poolId}>
                <Text style={styles.poolHeader}>{poolDisplayLabel(pool)}</Text>
                <View style={styles.card}>
                  {sectionEntries.length === 0 ? (
                    <Text style={styles.emptyText}>No recommendations yet.</Text>
                  ) : (
                    sectionEntries.map(renderEntry)
                  )}
                </View>
              </View>
            );
          })}
          {customEntries.length > 0 && (
            <View style={styles.card}>
              {customEntries.map(renderEntry)}
            </View>
          )}
        </>
      ) : (
        <>
          {pools.length === 1 && (
            <Text style={styles.poolHeader}>{poolDisplayLabel(pools[0])}</Text>
          )}
          <View style={styles.card}>
            {treatmentEntries.length === 0 ? (
              <Text style={styles.emptyText}>No recommendations yet. Add a chemical below.</Text>
            ) : (
              treatmentEntries.map(renderEntry)
            )}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.addLink} onPress={addCustomRow}>
        <Text style={styles.addLinkIcon}>＋</Text>
        <Text style={styles.addLinkText}>Add another chemical</Text>
      </TouchableOpacity>

      <View style={styles.stockCard}>
        <Text style={styles.stockLabel}>Stock after this job (preview only)</Text>
        {stockPreview.length === 0 ? (
          <Text style={styles.stockEmpty}>No stock changes yet.</Text>
        ) : (
          stockPreview.map((item) => (
            <View key={item.id} style={styles.stockRow}>
              <Text style={styles.stockName}>{item.name}</Text>
              <Text style={[styles.stockValue, item.low && styles.stockValueLow]}>
                {item.remaining}{item.unit} remaining
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9CA3AF',
  },
  poolHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#374151',
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    color: '#111827',
  },
  recommended: {
    marginTop: 2,
    fontSize: 11,
    color: '#9CA3AF',
  },
  nameInput: {
    minHeight: 28,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    color: '#111827',
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
  },
  amountInput: {
    width: 58,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.md,
    paddingHorizontal: 6,
    paddingVertical: 7,
    textAlign: 'center',
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  unit: {
    minWidth: 22,
    fontSize: 12,
    color: '#6B7280',
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  addLinkIcon: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 16,
  },
  addLinkText: {
    fontSize: typography.fontSizes.sm,
    color: '#9CA3AF',
  },
  stockCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: spacing.md,
    gap: spacing.xs,
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9CA3AF',
    marginBottom: spacing.xs,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  stockName: {
    fontSize: 12,
    color: '#374151',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  stockValueLow: {
    color: '#F59E0B',
  },
  emptyText: {
    padding: spacing.md,
    color: '#9CA3AF',
    fontSize: typography.fontSizes.sm,
  },
  stockEmpty: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
