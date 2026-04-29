import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { getApiClient } from '../services/api';

// Owner Home API response types
interface OwnerHomeData {
  pool: {
    address: string;
  };
  status: {
    state: 'ok' | 'warning' | 'critical';
    label: string;
  };
  lastService: string;
  nextService: string;
  latestReadings: {
    ph: number;
    chlorine: number;
    lsi: number;
  };
}

// Traffic light helper - defined before styles to avoid forward reference
function getTrafficLight(value: number, min: number, max: number) {
  if (value >= min && value <= max) return 'success';
  if (value < min - 1 || value > max + 1) return 'critical';
  return 'warning';
}

function renderTrafficLight(
  value: number,
  min: number,
  max: number,
  label: string,
  colorsMap: Record<string, string>,
  labelsMap: Record<string, string>
) {
  const state = getTrafficLight(value, min, max);
  return (
    <View style={styles.readingItem}>
      <View style={styles.readingLabel}>
        <View
          style={[
            styles.trafficDot,
            { backgroundColor: colorsMap[state] },
          ]}
        />
        <Text style={styles.readingText}>{labelsMap[state]}</Text>
      </View>
      <Text style={styles.readingValue}>{value.toFixed(2)}</Text>
    </View>
  );
}

export function OwnerHomeScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState<OwnerHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOwnerHome = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getApiClient().get<OwnerHomeData>('/owner/home');
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch owner home data:', err);
      setError('Unable to load home screen');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOwnerHome();
  }, [fetchOwnerHome]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOwnerHome();
  }, [fetchOwnerHome]);

  // Status colors based on state
  const getStatusColors = (state: string) => {
    switch (state) {
      case 'ok':
        return {
          bg: colors.success,
          bgLight: colors.successLight,
          border: '#22C55E',
          bgHex: '#F0FDF4',
          text: '#14532D',
        };
      case 'warning':
        return {
          bg: colors.warning,
          bgLight: colors.warningLight,
          border: '#F59E0B',
          bgHex: '#FFFBEB',
          text: '#78350F',
        };
      case 'critical':
        return {
          bg: colors.error,
          bgLight: colors.errorLight,
          border: '#EF4444',
          bgHex: '#FEF2F2',
          text: '#7F1D1D',
        };
      default:
        return {
          bg: colors.textMuted,
          bgLight: colors.textMuted,
          border: colors.textMuted,
          bgHex: '#E5E7EB',
          text: '#4B5563',
        };
    }
  };

  const statusColors = data ? getStatusColors(data.status.state) : getStatusColors('ok');

  const handleViewReport = () => {
    // Navigate to ServiceReportDetail with jobId param
    navigation.navigate('ServiceReportDetail' as never);
  };

  const handleViewHistory = () => {
    // Navigate to Service History screen
    navigation.navigate('ServiceHistory' as never);
  };

  const handleRequestVisit = () => {
    // Navigate to RequestVisit screen
    navigation.navigate('RequestVisit' as never);
  };

  // Helper for traffic light display
  const renderTrafficDisplay = (value: number, min: number, max: number, label: string) => {
    const state = getTrafficLight(value, min, max);
    const colorsMap: Record<string, string> = {
      success: colors.success,
      warning: colors.warning,
      critical: colors.error,
    };
    const labelsMap: Record<string, string> = {
      success: label,
      warning: 'Warning: ' + label,
      critical: 'Critical: ' + label,
    };
    return renderTrafficLight(value, min, max, label, colorsMap, labelsMap);
  };

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading home screen...</Text>
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
            onPress={fetchOwnerHome}
          >
            <Ionicons name="refresh" size={16} color={colors.textInverse} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!data) {
    return null;
  }

  // Assume acceptable ranges
  const phMin = 7.2;
  const phMax = 7.8;
  const clMin = 1.0;
  const clMax = 3.0;
  const lsiMin = -0.5;
  const lsiMax = 0.5;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.appName}>PoolOps</Text>
        </View>
        <View style={styles.profileContainer}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>JH</Text>
          </View>
        </View>
      </View>

      {/* Pool Address */}
      <View style={styles.poolInfo}>
        <Text style={styles.poolLabel}>YOUR POOL</Text>
        <Text style={styles.poolAddress}>{data.pool.address}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Status Hero Card */}
        <View
          style={[
            styles.statusHero,
            { backgroundColor: statusColors.bgHex, borderColor: statusColors.border },
          ]}
        >
          <View style={[styles.statusBullet, { backgroundColor: statusColors.border }]} />
          <Text style={[styles.statusText, { color: statusColors.text }]}>{data.status.label}</Text>
        </View>

        {/* Service Dates */}
        <View style={styles.serviceDates}>
          <View style={styles.serviceDateItem}>
            <View style={styles.dateIcon}>
              <Ionicons name="checkmark-done-circle" size={20} color={colors.primary} />
            </View>
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Last service</Text>
              <Text style={styles.dateValue}>{data.lastService}</Text>
            </View>
          </View>
          <View style={styles.serviceDateItem}>
            <View style={styles.dateIcon}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Next service</Text>
              <Text style={styles.dateValue}>{data.nextService}</Text>
            </View>
          </View>
        </View>

        {/* Latest Readings Strip */}
        <View style={styles.readingsSection}>
          <Text style={styles.readingsLabel}> Latest readings</Text>
          <View style={styles.readingsContainer}>
            {renderTrafficDisplay(data.latestReadings.ph, phMin, phMax, 'pH')}
            {renderTrafficDisplay(data.latestReadings.chlorine, clMin, clMax, 'Cl')}
            {renderTrafficDisplay(data.latestReadings.lsi, lsiMin, lsiMax, 'LSI')}
          </View>
        </View>

        {/* REQUEST A VISIT CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleRequestVisit}>
          <Ionicons name="add-circle" size={20} color={colors.textInverse} />
          <Text style={styles.ctaText}>REQUEST A VISIT</Text>
        </TouchableOpacity>

        {/* VIEW REPORT Button */}
        <TouchableOpacity style={styles.reportButton} onPress={handleViewReport}>
          <Text style={styles.reportText}>VIEW REPORT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  profileContainer: {
    width: 36,
    height: 36,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  poolInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  poolLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  poolAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.xxs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statusHero: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusBullet: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  serviceDates: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  serviceDateItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#E0F2FE',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xxs,
  },
  readingsSection: {
    marginBottom: spacing.lg,
  },
  readingsLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  readingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  readingItem: {
    flex: 1,
    alignItems: 'center',
  },
  readingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  readingText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text,
  },
  readingValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  reportText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
