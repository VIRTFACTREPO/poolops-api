import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { getApiClient } from '../services/api';

type NotificationType = 'service_complete' | 'visit_confirmed' | 'schedule_change' | 'flagged_reading' | 'office_message' | 'request_received';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  reference_id?: string;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getNavTarget(notif: Notification): { screen: string; params?: object } | null {
  switch (notif.type) {
    case 'service_complete':
      return { screen: 'M5', params: { jobId: notif.reference_id } };
    case 'visit_confirmed':
      return { screen: 'Schedule', params: undefined };
    case 'schedule_change':
      return { screen: 'Home', params: undefined };
    case 'flagged_reading':
    case 'office_message':
      return null;
    case 'request_received':
      return { screen: 'Home', params: undefined };
    default:
      return null;
  }
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  service_complete: colors.success,
  visit_confirmed: colors.primary,
  schedule_change: colors.primary,
  flagged_reading: colors.error,
  office_message: colors.text,
  request_received: colors.warning,
};

const NOTIFICATION_BG_COLORS: Record<NotificationType, string> = {
  service_complete: '#F0FDF4',
  visit_confirmed: '#EFF6FF',
  schedule_change: '#EFF6FF',
  flagged_reading: '#FEF2F2',
  office_message: '#F3F4F6',
  request_received: '#FFFBEB',
};

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getApiClient().get<{ data: any[] }>('/technician/notifications')
        .then((res) => {
          if (!active) return;
          const rows = Array.isArray((res as any)?.data?.data)
            ? (res as any).data.data
            : Array.isArray((res as any)?.data)
              ? (res as any).data
              : [];
          const mapped: Notification[] = rows.map((n: any) => ({
            id: String(n.id),
            type: n.type as NotificationType,
            title: n.title,
            body: n.body,
            time: formatRelativeTime(n.created_at),
            isRead: Boolean(n.read),
            reference_id: n.reference_id,
          }));
          setNotifications(mapped);
        })
        .catch((err) => console.error('Notifications fetch failed:', err))
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    getApiClient().patch('/technician/notifications/read-all').catch(() => {});
  }, []);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      getApiClient().patch(`/technician/notifications/${notification.id}/read`).catch(() => {});

      const target = getNavTarget(notification);
      if (target) {
        navigation.navigate(target.screen as never, target.params as never);
      } else {
        setExpandedId((prev) => (prev === notification.id ? null : notification.id));
      }
    },
    [navigation]
  );

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'service_complete': return <Ionicons name="checkmark-circle" size={17} color={colors.successDark} />;
      case 'visit_confirmed': return <Ionicons name="calendar-outline" size={17} color={colors.primaryDark} />;
      case 'schedule_change': return <Ionicons name="calendar" size={17} color={colors.primaryDark} />;
      case 'flagged_reading': return <Ionicons name="alert" size={17} color={colors.errorDark} />;
      case 'office_message': return <Ionicons name="chatbubble" size={17} color={colors.textMuted} />;
      case 'request_received': return <Ionicons name="alert-circle" size={17} color={colors.warningDark} />;
      default: return null;
    }
  };

  const filteredNotifications = (section: 'unread' | 'read') => {
    if (section === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications.filter((n) => n.isRead);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />}

        {filteredNotifications('unread').length > 0 && (
          <>
            <Text style={styles.sectionLabel}>New</Text>
            {filteredNotifications('unread').map((notif) => {
              const isExpanded = expandedId === notif.id;
              const hasNav = !!getNavTarget(notif);
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.card, styles.cardUnread, { borderLeftColor: NOTIFICATION_COLORS[notif.type] }]}
                  onPress={() => handleNotificationPress(notif)}
                >
                  <View style={[styles.icon, { backgroundColor: NOTIFICATION_BG_COLORS[notif.type] }]}>
                    {getNotificationIcon(notif.type)}
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.title}>{notif.title}</Text>
                    <Text style={styles.subtitle} numberOfLines={isExpanded ? undefined : 2}>{notif.body}</Text>
                    <Text style={styles.time}>{notif.time}</Text>
                    {!hasNav && isExpanded && (
                      <Text style={styles.expandHint}>Tap to collapse</Text>
                    )}
                  </View>
                  <View
                    style={[styles.unreadDot, { backgroundColor: NOTIFICATION_COLORS[notif.type], right: 13, top: 13 }]}
                  />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {filteredNotifications('read').length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Earlier today</Text>
            {filteredNotifications('read').map((notif) => {
              const isExpanded = expandedId === notif.id;
              const hasNav = !!getNavTarget(notif);
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={styles.card}
                  onPress={() => handleNotificationPress(notif)}
                >
                  <View style={[styles.icon, { backgroundColor: NOTIFICATION_BG_COLORS[notif.type] }]}>
                    {getNotificationIcon(notif.type)}
                  </View>
                  <View style={styles.body}>
                    <Text style={[styles.title, { color: colors.text }]}>{notif.title}</Text>
                    <Text style={styles.subtitle} numberOfLines={isExpanded ? undefined : 2}>{notif.body}</Text>
                    <Text style={styles.time}>{notif.time}</Text>
                    {!hasNav && isExpanded && (
                      <Text style={styles.expandHint}>Tap to collapse</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {!loading && notifications.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={48} color={colors.border} />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E4E8',
  },
  header: {
    padding: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F3',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  markReadBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  scrollContent: {
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    padding: 8,
    paddingVertical: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.xxl,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cardUnread: {
    borderLeftWidth: 3,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  expandHint: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
  },
  unreadDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
