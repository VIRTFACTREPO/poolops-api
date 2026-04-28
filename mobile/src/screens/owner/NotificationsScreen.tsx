import React, { useState, useEffect } from 'react';
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
import { getApiClient } from '../services/api';

interface Notification {
  id: string;
  type: 'visit-update' | 'schedule-change' | 'message' | 'schedule-update';
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}

export function OwnerNotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getApiClient().get<Notification[]>('/owner/notifications');
      setNotifications(res);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await getApiClient().patch('/owner/notifications/read-all', {});
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Call markAllRead when screen becomes active
  useEffect(() => {
    const focusUnsub = navigation.addListener('focus', () => {
      markAllRead();
    });
    return () => focusUnsub();
  }, [navigation]);

  const handleNotificationPress = (notification: Notification) => {
    if (
      notification.type === 'visit-update' ||
      notification.type === 'schedule-change'
    ) {
      navigation.navigate('ServiceReportDetail' as never);
    } else {
      navigation.navigate('OwnerHome' as never);
    }
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
            <Ionicons name="bell-outline" size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header - tab screen, no back arrow */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.map((notification) => {
          return (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.card,
                notification.isRead ? styles.cardRead : styles.cardUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.icon}>
                {notification.type === 'visit-update' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.successDark} />
                )}
                {notification.type === 'schedule-change' && (
                  <Ionicons name="time" size={24} color={colors.warningDark} />
                )}
                {notification.type === 'message' && (
                  <Ionicons name="chatbubble" size={24} color={colors.text} />
                )}
                {notification.type === 'schedule-update' && (
                  <Ionicons name="calendar" size={24} color={colors.primaryDark} />
                )}
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, notification.isRead && styles.titleRead]}>{notification.title}</Text>
                <Text style={styles.bodyText}>{notification.body}</Text>
                <Text style={styles.timestamp}>{notification.timestamp}</Text>
              </View>
              {!notification.isRead && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// Shadow object defined before StyleSheet.create to avoid self-reference
const shadowSm = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};

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
    paddingVertical: spacing.lg * 2,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: spacing.lg,
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
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
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadowSm,
  },
  cardRead: {
    backgroundColor: '#FFFFFF',
  },
  cardUnread: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  titleRead: {
    color: '#374151',
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: '#0EA5E9',
    marginLeft: spacing.xs,
    marginTop: spacing.sm,
  },
});
