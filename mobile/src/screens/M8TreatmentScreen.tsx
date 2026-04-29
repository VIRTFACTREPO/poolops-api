import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TreatmentEntry, useActiveJob } from '../context/ActiveJobContext';
import { borderRadius, colors, spacing, typography } from '../theme/tokens';

type StockRule = {
  amount: number;
  lowThreshold: number;
  unit: 'ml' | 'g';
};

const STOCK_RULES: Record<string, StockRule> = {
  'liquid chlorine': { amount: 5000, lowThreshold: 1000, unit: 'ml' },
  'ph buffer': { amount: 2000, lowThreshold: 600, unit: 'g' },
  'muriatic acid': { amount: 3500, lowThreshold: 800, unit: 'ml' },
  'alkalinity up': { amount: 2400, lowThreshold: 700, unit: 'g' },
};

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
  const { treatmentPrefill, treatmentEntries, setTreatmentEntries } = useActiveJob();

  useEffect(() => {
    const next = normalizePrefillToEntries(treatmentPrefill, treatmentEntries);
    if (JSON.stringify(next) !== JSON.stringify(treatmentEntries)) {
      setTreatmentEntries(next);
    }
  }, [treatmentPrefill, treatmentEntries, setTreatmentEntries]);

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
          name: entry.name,
          remaining,
          low,
          unit: rule.unit,
        };
      });
  }, [treatmentEntries]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Chemicals added</Text>

      <View style={styles.card}>
        {treatmentEntries.length === 0 ? (
          <Text style={styles.emptyText}>No recommendations yet. Add a chemical below.</Text>
        ) : (
          treatmentEntries.map((entry) => (
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
          ))
        )}
      </View>

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
            <View key={`${item.name}-${item.unit}`} style={styles.stockRow}>
              <Text style={styles.stockName}>{item.name}</Text>
              <Text style={[styles.stockValue, item.low && styles.stockValueLow]}>
                {item.remaining}{item.unit} remaining
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.base,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9CA3AF',
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
    paddingHorizontal: spacing.base,
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
    padding: spacing.base,
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
    padding: spacing.base,
    color: '#9CA3AF',
    fontSize: typography.fontSizes.sm,
  },
  stockEmpty: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
