import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { OfflineQueueState } from '../hooks/useOfflineQueue';

interface SyncBannerProps {
  queue: OfflineQueueState;
}

export function SyncBanner({ queue }: SyncBannerProps) {
  const { pendingCount, isSyncing, triggerSync } = queue;
  const visible = pendingCount > 0 || isSyncing;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  const label = isSyncing
    ? 'Syncing…'
    : `${pendingCount} pending — tap to sync`;

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <View style={[styles.dot, isSyncing ? styles.dotPulse : styles.dotPending]} />
      <Text style={styles.label}>{label}</Text>
      {!isSyncing && (
        <TouchableOpacity onPress={triggerSync} style={styles.btn}>
          <Text style={styles.btnText}>Sync now</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  dotPending: {
    backgroundColor: '#FBBF24',
  },
  dotPulse: {
    backgroundColor: '#34D399',
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  btn: {
    backgroundColor: '#334155',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  btnText: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '600',
  },
});
