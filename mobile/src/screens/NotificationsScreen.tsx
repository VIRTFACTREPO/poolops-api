import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

type NotificationType = 'schedule' | 'stock' | 'message' | 'flagged' | 'complete';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'schedule',
    title: 'Schedule updated',
    body: 'Peters, Sarah moved to 2:30pm — Wong, Helen added to route',
    time: '8 minutes ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'stock',
    title: 'Low stock — pH Buffer',
    body: 'Less than 1kg remaining. Restock before end of day.',
    time: '42 minutes ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'message',
    title: 'Message from office',
    body: "Can you call the Chen's after their service today? They have a question about the equipment.",
    time: '1 hour ago',
    isRead: false,
  },
  {
    id: '4',
    type: 'flagged',
    title: 'Flagged reading noted',
    body: 'Smith, David — Chlorine LOW flagged. Simon reviewed.',
    time: '2 hours ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'complete',
    title: 'Report sent',
    body: 'Service report delivered to Williams, James — 22 Ponsonby Rd',
    time: '3 hours ago',
    isRead: true,
  },
];

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  schedule: colors.primary,
  stock: colors.warning,
  message: colors.text,
  flagged: colors.error,
  complete: colors.success,
};

const NOTIFICATION_BG_COLORS: Record<NotificationType, string> = {
  schedule: '#EFF6FF',
  stock: '#FFFBEB',
  message: '#F3F4F6',
  flagged: '#FEF2F2',
  complete: '#F0FDF4',
};

// Map notification types to tab screen names (must match RootNavigator Tab.Screen names)
const NOTIFICATION_TYPE_MAP: Record<NotificationType, string | null> = {
  schedule: 'Home',        // RunSheetScreen — registered as "Home" tab
  stock: null,             // No dedicated screen — stay in notifications
  message: null,           // No dedicated screen — stay in notifications
  flagged: null,           // No dedicated screen — stay in notifications
  complete: null,          // No dedicated screen — stay in notifications
};

export function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const handleMarkAllRead = useCallback(async () => {
    // Mock API call to mark all as read
    // In production: await API.post('/notifications/mark-all-read');
    
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read on tap
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      const targetScreen = NOTIFICATION_TYPE_MAP[notification.type];
      if (targetScreen) {
        navigation.navigate(targetScreen as never);
      }
    },
    [navigation]
  );

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'schedule':
        return <Ionicons name="calendar" size={17} color={colors.primaryDark} />;
      case 'stock':
        return <Ionicons name="alert-circle" size={17} color={colors.warningDark} />;
      case 'message':
        return <Ionicons name="chatbubble" size={17} color={colors.textMuted} />;
      case 'flagged':
        return <Ionicons name="alert" size={17} color={colors.errorDark} />;
      case 'complete':
        return <Ionicons name="checkmark-circle" size={17} color={colors.successDark} />;
      default:
        return null;
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Scroll Area */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Unread Notifications */}
        {filteredNotifications('unread').length > 0 && (
          <>
            <Text style={styles.sectionLabel}>New</Text>
            {filteredNotifications('unread').map((notif) => (
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
                  <Text style={styles.subtitle}>{notif.body}</Text>
                  <Text style={styles.time}>{notif.time}</Text>
                </View>
                <View
                  style={[styles.unreadDot, { backgroundColor: NOTIFICATION_COLORS[notif.type], right: 13, top: 13 }]}
                />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Read Notifications */}
        {filteredNotifications('read').length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Earlier today</Text>
            {filteredNotifications('read').map((notif) => (
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
                  <Text style={styles.subtitle}>{notif.body}</Text>
                  <Text style={styles.time}>{notif.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {notifications.length === 0 && (
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
    lineHeight: 1.4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
    lineHeight: 1.4,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
