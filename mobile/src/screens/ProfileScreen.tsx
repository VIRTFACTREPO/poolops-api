import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getApiClient } from '../services/api';

function ToggleSwitch({ value, onPress }: { value: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
      onPress={onPress}
    >
      <View style={[styles.toggleThumb, { left: value ? 21 : 3, top: 3 }]} />
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const { logout, user, role } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };
  const [settings, setSettings] = useState({
    scheduleChanges: true,
    stockAlerts: true,
    officeMessages: true,
    smsAlerts: false,
  });

  const toggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    
    // Update local state optimistically
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    
    // Call API to update preference
    try {
      await getApiClient().patch('/profile', { [key]: newValue });
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getVersion = () => {
    // In production, get from app.json or package.json
    return 'v1.0.4';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user?.name)}</Text></View>
        <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
        <Text style={styles.profileRole}>{role ?? '—'}</Text>
      </View>

      {/* Scroll Area */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsRow}>
            <View style={[styles.icon, styles.iconDark]}>
              <Ionicons name="person" size={15} color={colors.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Personal details</Text>
            <Text style={styles.settingsValue}>{user?.email ?? '—'}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <View style={[styles.icon, styles.iconDark]}>
              <Ionicons name="key" size={15} color={colors.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Change password</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.border} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.settingsGroup}>
          {[
            { key: 'scheduleChanges', label: 'Schedule changes', colorClass: 'blue' },
            { key: 'stockAlerts', label: 'Low stock alerts', colorClass: 'amber' },
            { key: 'officeMessages', label: 'Office messages', colorClass: 'dark' },
            { key: 'smsAlerts', label: 'SMS alerts', colorClass: 'green' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.settingsRow}
              onPress={() => toggleSetting(item.key as keyof typeof settings)}
            >
              <View style={[styles.icon, (styles as any)[`icon${item.colorClass.charAt(0).toUpperCase() + item.colorClass.slice(1)}` as never]]}>
                {getSettingIcon(item.key)}
              </View>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <ToggleSwitch
                value={settings[item.key as keyof typeof settings]}
                onPress={() => toggleSetting(item.key as keyof typeof settings)}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Section */}
        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingsRow}>
            <View style={[styles.icon, styles.iconDark]}>
              <Ionicons name="information-circle" size={15} color={colors.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>App version</Text>
            <Text style={styles.settingsValue}>{getVersion()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRow}>
            <View style={[styles.icon, styles.iconDark]}>
              <Ionicons name="cloud-download" size={15} color={colors.textMuted} />
            </View>
            <Text style={styles.settingsLabel}>Check for updates</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.border} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={16} color={colors.errorDark} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>PoolOps · Pool Pro NZ · {getVersion()}</Text>
      </ScrollView>

    </SafeAreaView>
  );
}

function getSettingIcon(key: string) {
  switch (key) {
    case 'scheduleChanges':
      return <Ionicons name="calendar" size={15} color={colors.primaryDark} />;
    case 'stockAlerts':
      return <Ionicons name="alert-circle" size={15} color={colors.warningDark} />;
    case 'officeMessages':
      return <Ionicons name="chatbubble" size={15} color={colors.textMuted} />;
    case 'smsAlerts':
      return <Ionicons name="call-outline" size={15} color={colors.successDark} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E4E8',
  },
  profileHeader: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#F5F5F3',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileRole: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    backgroundColor: '#F3F4F6',
    color: colors.textLight,
    borderRadius: borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  settings: {
    backgroundColor: '#F5F5F3',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F3',
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
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconDark: {
    backgroundColor: '#F3F4F6',
  },
  iconBlue: {
    backgroundColor: '#EFF6FF',
  },
  iconAmber: {
    backgroundColor: '#FFFBEB',
  },
  iconGreen: {
    backgroundColor: '#F0FDF4',
  },
  iconRed: {
    backgroundColor: '#FEF2F2',
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  settingsValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 6,
  },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: borderRadius.full,
    position: 'relative',
  },
  toggleOn: {
    backgroundColor: '#111827',
  },
  toggleOff: {
    backgroundColor: colors.border,
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    width: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: borderRadius.xxl,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.errorDark,
  },
  versionText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
