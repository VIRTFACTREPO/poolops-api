import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { getApiClient } from '../services/api';

type VisitReason = 'water-issue' | 'extra-visit' | 'event-prep' | 'equipment-problem' | 'other';

interface FormData {
  reason: VisitReason | null;
  notes: string;
}

export function RequestVisitScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    reason: null,
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const reasons: { id: VisitReason; label: string; icon: string }[] = [
    { id: 'water-issue', label: 'Water issue', icon: 'water' },
    { id: 'extra-visit', label: 'Extra visit', icon: 'calendar' },
    { id: 'event-prep', label: 'Event prep', icon: 'party' },
    { id: 'equipment-problem', label: 'Equipment problem', icon: 'construct' },
    { id: 'other', label: 'Other', icon: 'help-circle' },
  ];

  const handleReasonSelect = (reason: VisitReason) => {
    setFormData(prev => ({ ...prev, reason }));
  };

  const handleNotesChange = (text: string) => {
    if (text.length <= 200) {
      setFormData(prev => ({ ...prev, notes: text }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.reason) {
      // Show error - need to select a reason
      return;
    }

    setIsLoading(true);

    try {
      await getApiClient().post('/owner/booking-request', {
        reason: formData.reason,
        notes: formData.notes || undefined,
      });

      // Navigate to confirmation, replace stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'RequestConfirm' as never }],
      });
    } catch (err) {
      console.error('Failed to submit:', err);
      // Show toast error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Visit</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Reason Selection Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Why are you requesting a visit?</Text>
          <View style={styles.reasonGrid}>
            {reasons.map((reason) => {
              const isSelected = formData.reason === reason.id;
              return (
                <TouchableOpacity
                  key={reason.id}
                  style={[styles.reasonTile, isSelected && styles.reasonTileActive]}
                  onPress={() => handleReasonSelect(reason.id)}
                >
                  <View style={[styles.reasonIcon, isSelected && styles.reasonIconActive]}>
                    <Ionicons
                      name={reason.icon}
                      size={24}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelActive]}>
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes (optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tell us more (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add details about your request..."
            placeholderTextColor={colors.textMuted}
            value={formData.notes}
            onChangeText={handleNotesChange}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{formData.notes.length}/200</Text>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.sendBtn, !formData.reason && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!formData.reason || isLoading}
        >
          {isLoading ? (
            <Ionicons name="refresh" size={20} color={colors.textInverse} />
          ) : (
            <Text style={styles.sendText}>SEND REQUEST</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function RequestConfirmScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>Request Sent!</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.confirmContainer}>
          <View style={styles.tickCircle}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={styles.confirmTitle}>Request sent!</Text>
          <Text style={styles.confirmText}>
            We'll be in touch soon to confirm your visit.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'OwnerHome' as never }],
              })
            }
          >
            <Text style={styles.doneText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  Spacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80, // Space for sticky footer
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    marginLeft: 2,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reasonTile: {
    flexBasis: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  reasonTileActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonIconActive: {
    backgroundColor: '#E0F2FE',
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  reasonLabelActive: {
    color: colors.primary,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginRight: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    paddingBottom: 16,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  tickCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  confirmText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
  },
  doneText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
