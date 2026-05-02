import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { useActiveJob } from '../context/ActiveJobContext';
import { colors, spacing, borderRadius } from '../theme/tokens';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { enqueuePhotoUpload } from '../services/offlineQueue';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

export function PhotoCaptureTab() {
  const { jobId, photos, setPhotos } = useActiveJob();
  const { before, after } = photos;

  const openImagePicker = async (type: 'before' | 'after') => {
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
        setPhotos({ [type]: uri });

        if (!jobId) return;

        const fileName = asset.fileName ?? `${type}-${Date.now()}.jpg`;
        const mimeType = asset.mimeType ?? 'image/jpeg';

        try {
          const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3003';
          const token = await SecureStore.getItemAsync('auth_token');
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

          const response = await fetch(`${baseUrl}/technician/jobs/${jobId}/photos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ type, mimeType, fileName, base64 }),
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`Upload failed ${response.status}: ${body}`);
          }

          const { data } = await response.json();
          setPhotos({ [type]: data.url });
        } catch (uploadErr: any) {
          console.error('[PhotoCaptureTab] upload error:', uploadErr?.message);
          Alert.alert('Photo upload failed', uploadErr?.message ?? 'Could not upload photo. It will sync when connectivity improves.');
          setPhotos({ [type]: undefined });
          await enqueuePhotoUpload(jobId, {
            photoType: type,
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

  const handleAddAdditional = () => {
    Alert.alert('Add photo', 'Please use the Before or After cells to add photos.');
  };

  const renderPhotoCell = ({
    type,
    label,
    value,
  }: {
    type: 'before' | 'after';
    label: string;
    value: string | undefined;
  }) => {
    const isTaken = !!value;

    return (
      <TouchableOpacity
        style={[styles.photoCell, isTaken && styles.photoCellTaken]}
        onPress={() => openImagePicker(type)}
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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Before &amp; after</Text>

      <FlatList
        data={[{ type: 'before' as const, label: 'Before', value: before }, { type: 'after' as const, label: 'After', value: after }]}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => renderPhotoCell(item)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.scrollContent}
      />

      <TouchableOpacity style={styles.addLink} onPress={handleAddAdditional}>
        <Ionicons name="add-circle" size={16} color="#9CA3AF" />
        <Text style={styles.addLinkText}>Add additional photo</Text>
      </TouchableOpacity>

      <Text style={styles.photoHint}>All photos optional but recommended</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F3',
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  gridRow: {
    gap: 10,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  photoCell: {
    width: '48%',
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
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  addLinkText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  photoHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
