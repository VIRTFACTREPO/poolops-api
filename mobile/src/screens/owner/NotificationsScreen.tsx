import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/tokens';

// Mock notifications data (will be replaced with real API when available)
// API endpoint: GET /owner/notifications (stubbed, not yet implemented)
interface Notification {
  id: string;
  type: 'visit-update' | 'schedule-change' | 'message' | 'schedule-update';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'visit-update',
    title: 'Visit completed',
    body: 'Peters, Sarah — Service completed. Updated report available.',
    timestamp: '10 minutes ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'schedule-change',
    title: 'Schedule updated',
    body: 'Your next service was moved to Friday 2pm at your request.',
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'message',
    title: 'Message from technician',
    body: "Simon: The pH was high. I've adjusted it. Let me know if you have questions.",
    timestamp: '5 hours ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'schedule-update',
    title: 'Upcoming service scheduled',
    body: 'Chen, Michael — Service scheduled for Thursday 10am.',
    timestamp: 'Yesterday',
    isRead: true,
  },
];

export function OwnerNotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Wire up to GET /owner/notifications when API is ready
      // For now, use mock data
      setNotifications(MOCK_NOTIFICATIONS);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = (notification: Notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'visit-update':
      case 'schedule-change':
        // Navigate to job/service detail
        break;
      case 'message':
        // Navigate to messages/inbox
        break;
      case 'schedule-update':
        // Navigate to schedule
        break;
      default:
        break;
    }
  };

  const getTypeColors = (type: string) => {
    const colorsMap: Record<string, { bg: string; border: string; icon: string }> = {
      'visit-update': { bg: '#D1FAE5', border: colors.success, icon: 'checkmark-circle' },
      'schedule-change': { bg: '#FEF3C7', border: colors.warning, icon: 'time' },
      'message': { bg: '#DBEAFE', border: colors.primary, icon: 'chatbubble' },
      'schedule-update': { bg: '#E0F2FE', border: colors.primary, icon: 'calendar' },
    };
    return colorsMap[type] || { bg: '#F3F4F6', border: colors.textMuted, icon: 'help-circle' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <View style={styles.errorState}>
            <Ionicons name="warning-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {notifications.map((notification) => {
          const typeColors = getTypeColors(notification.type);
          return (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.card,
                notification.isRead ? styles.cardRead : styles.cardUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={[styles.icon, { backgroundColor: typeColors.bg }]}>
                <Ionicons
                  name={typeColors.icon}
                  size={24}
                  color={typeColors.border}
                />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.bodyText}>{notification.body}</Text>
                <Text style={styles.timestamp}>{notification.timestamp}</Text>
              </View>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
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
  badge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...styles.shadowSm,
  },
  cardRead: {
    opacity: 0.7,
  },
  cardUnread: {
    borderLeftWidth: 3,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bodyText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: spacing.xxs,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
    marginTop: spacing.sm,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
