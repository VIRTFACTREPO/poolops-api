import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useActiveJob, PoolSnapshot } from '../context/ActiveJobContext';
import { colors, spacing, borderRadius } from '../theme/tokens';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { enqueuePhotoUpload } from '../services/offlineQueue';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

function photoKey(poolIndex: number, type: 'before' | 'after', isMulti: boolean) {
  return isMulti ? `p${poolIndex}-${type}` : type;
}

function isSpaPool(pool: PoolSnapshot) {
  return pool.type === 'spa' || pool.type?.startsWith('spa-');
}

function poolLabel(pool: PoolSnapshot, index: number) {
  return isSpaPool(pool) ? `Spa Pool ${index + 1}` : `Pool ${index + 1}`;
}

export function PhotoCaptureTab() {
  const { jobId, pools, photos, setPhotos } = useActiveJob();
  const isMulti = pools.length > 1;

  const openImagePicker = async (poolIndex: number, type: 'before' | 'after') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access needed', 'Please allow camera access in Settings to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const key = photoKey(poolIndex, type, isMulti);
        setPhotos({ [key]: uri });

        if (!jobId) return;

        const fileName = asset.fileName ?? `${key}-${Date.now()}.jpg`;
        const mimeType = asset.mimeType ?? 'image/jpeg';

        try {
          const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3003';
          const token = await SecureStore.getItemAsync('auth_token');
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });

          const response = await fetch(`${baseUrl}/technician/jobs/${jobId}/photos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ type: key, mimeType, fileName, base64 }),
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`Upload failed ${response.status}: ${body}`);
          }

          const { data } = await response.json();
          setPhotos({ [key]: data.url });
        } catch (uploadErr: any) {
          console.error('[PhotoCaptureTab] upload error:', uploadErr?.message);
          Alert.alert('Photo upload failed', uploadErr?.message ?? 'Could not upload photo. It will sync when connectivity improves.');
          setPhotos({ [key]: undefined });
          await enqueuePhotoUpload(jobId, {
            photoType: key,
            uri,
            fileName,
            mimeType,
            capturedAt: new Date().toISOString(),
          } as Record<string, unknown>);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not access photo library.');
    }
  };

  const renderPhotoCell = (poolIndex: number, type: 'before' | 'after') => {
    const key = photoKey(poolIndex, type, isMulti);
    const value = photos[key];
    const isTaken = !!value;
    const label = type === 'before' ? 'Before' : 'After';

    return (
      <TouchableOpacity
        key={key}
        style={[styles.photoCell, isTaken && styles.photoCellTaken]}
        onPress={() => openImagePicker(poolIndex, type)}
      >
        {isTaken ? (
          <>
            <View style={styles.photoCheck}>
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            </View>
            <Text style={[styles.photoCellLabel, { color: colors.success }]}>
              {label} ✓
            </Text>
            <Image source={{ uri: value }} style={styles.previewImage} />
          </>
        ) : (
          <>
            <Ionicons name="camera" size={28} color="#9CA3AF" />
            <Text style={styles.photoCellLabel}>{label}</Text>
            <Text style={styles.photoCellSub}>Tap to add</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderPoolSection = (pool: PoolSnapshot, index: number) => (
    <View key={pool.poolId} style={styles.poolSection}>
      {isMulti && (
        <Text style={styles.poolHeader}>{poolLabel(pool, index)}</Text>
      )}
      {!isMulti && (
        <Text style={styles.sectionLabel}>Before &amp; after</Text>
      )}
      <View style={styles.gridRow}>
        {renderPhotoCell(index, 'before')}
        {renderPhotoCell(index, 'after')}
      </View>
    </View>
  );

  const displayPools = pools.length > 0 ? pools : [{ poolId: 'default' } as PoolSnapshot];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {isMulti && (
        <Text style={styles.sectionLabel}>Before &amp; after</Text>
      )}

      {displayPools.map((pool, i) => renderPoolSection(pool, i))}

      <Text style={styles.photoHint}>All photos optional but recommended</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    paddingTop: 8,
  },
  poolSection: {
    gap: 6,
  },
  poolHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#374151',
    marginTop: spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoCellTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.successLight,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  photoCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCellLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  photoCellSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  previewImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xxl,
  },
  photoHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
