import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useActiveJob } from '../context/ActiveJobContext';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export function JobNotesTab() {
  const { customerNote, officeNote, setCustomerNote, setOfficeNote } = useActiveJob();

  return (
    <View style={styles.container}>
      {/* Customer Note */}
      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Ionicons name="person" size={16} color={colors.success} />
          <Text style={styles.noteHeaderLabel}>Customer note</Text>
          <View style={[styles.noteBadge, styles.noteBadgeGreen]}>
            <Text style={styles.noteBadgeText}>In report</Text>
          </View>
        </View>
        <TextInput
          style={styles.noteInput}
          placeholder="Enter customer note..."
          placeholderTextColor="#9CA3AF"
          value={customerNote}
          onChangeText={setCustomerNote}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Office Note */}
      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Ionicons name="lock-closed" size={16} color={colors.error} />
          <Text style={styles.noteHeaderLabel}>Office note</Text>
          <View style={[styles.noteBadge, styles.noteBadgeRed]}>
            <Text style={styles.noteBadgeText}>Internal only</Text>
          </View>
        </View>
        <TextInput
          style={styles.noteInput}
          placeholder="Enter office note..."
          placeholderTextColor="#9CA3AF"
          value={officeNote}
          onChangeText={setOfficeNote}
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  noteHeader: {
    padding: 10,
    paddingBottom: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  noteHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#374151',
    flex: 1,
  },
  noteBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSizes.xs,
    fontWeight: '500',
  },
  noteBadgeGreen: {
    backgroundColor: colors.successLight,
    color: colors.successDark,
  },
  noteBadgeRed: {
    backgroundColor: colors.errorLight,
    color: colors.errorDark,
  },
  noteBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '500',
  },
  noteBadgeRedText: {
    color: '#B91C1C',
  },
  noteInput: {
    minHeight: 90,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter',
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
});
