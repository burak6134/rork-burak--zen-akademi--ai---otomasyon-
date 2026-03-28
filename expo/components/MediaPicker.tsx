import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, Image as ImageIcon, FileText, X } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export interface SelectedMedia {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface MediaPickerProps {
  selectedMedia: SelectedMedia[];
  onMediaSelected: (media: SelectedMedia[]) => void;
  maxItems?: number;
}

export default function MediaPicker({
  selectedMedia,
  onMediaSelected,
  maxItems = 5,
}: MediaPickerProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'İzin Gerekli',
            'Medya dosyalarına erişim için izin vermeniz gerekiyor.',
            [{ text: 'Tamam' }]
          );
          return false;
        }
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    if (selectedMedia.length >= maxItems) {
      if (Platform.OS !== 'web') {
        Alert.alert('Limit Aşıldı', `En fazla ${maxItems} medya dosyası seçebilirsiniz.`);
      } else {
        console.warn(`En fazla ${maxItems} medya dosyası seçebilirsiniz.`);
      }
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: SelectedMedia = {
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type === 'image' ? 'image/jpeg' : 'image/jpeg',
          size: asset.fileSize,
        };
        onMediaSelected([...selectedMedia, newMedia]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pickVideo = async () => {
    if (selectedMedia.length >= maxItems) {
      if (Platform.OS !== 'web') {
        Alert.alert('Limit Aşıldı', `En fazla ${maxItems} medya dosyası seçebilirsiniz.`);
      } else {
        console.warn(`En fazla ${maxItems} medya dosyası seçebilirsiniz.`);
      }
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: SelectedMedia = {
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          type: 'video/mp4',
          size: asset.fileSize,
        };
        onMediaSelected([...selectedMedia, newMedia]);
      }
    } catch (error) {
      console.error('Video picker error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Hata', 'Video seçilirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    if (selectedMedia.length >= maxItems) {
      if (Platform.OS !== 'web') {
        Alert.alert('Limit Aşıldı', `En fazla ${maxItems} medya dosyası seçebilirsiniz.`);
      } else {
        console.warn(`En fazla ${maxItems} medya dosyası seçebilirsiniz.`);
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/json', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: SelectedMedia = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        };
        onMediaSelected([...selectedMedia, newMedia]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    onMediaSelected(newMedia);
  };

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={16} color={theme.primary} />;
    if (type.startsWith('video/')) return <Camera size={16} color={theme.primary} />;

    return <FileText size={16} color={theme.primary} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  return (
    <View style={styles.container}>
      {/* Media Selection Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.mediaButton, { backgroundColor: theme.surfaceVariant }]}
          onPress={pickImage}
          disabled={isLoading}
        >
          <ImageIcon size={20} color={theme.primary} />
          <Text style={[styles.buttonText, { color: theme.text }]}>Resim</Text>
        </Pressable>

        <Pressable
          style={[styles.mediaButton, { backgroundColor: theme.surfaceVariant }]}
          onPress={pickVideo}
          disabled={isLoading}
        >
          <Camera size={20} color={theme.primary} />
          <Text style={[styles.buttonText, { color: theme.text }]}>Video</Text>
        </Pressable>

        <Pressable
          style={[styles.mediaButton, { backgroundColor: theme.surfaceVariant }]}
          onPress={pickDocument}
          disabled={isLoading}
        >
          <FileText size={20} color={theme.primary} />
          <Text style={[styles.buttonText, { color: theme.text }]}>Dosya</Text>
        </Pressable>
      </View>

      {/* Selected Media List */}
      {selectedMedia.length > 0 && (
        <View style={styles.selectedMedia}>
          <Text style={[styles.selectedTitle, { color: theme.text }]}>
            Seçilen Medya ({selectedMedia.length}/{maxItems})
          </Text>
          {selectedMedia.map((media, index) => (
            <View
              key={`${media.name}-${media.size}-${index}`}
              style={[styles.mediaItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.mediaInfo}>
                {getMediaIcon(media.type)}
                <View style={styles.mediaDetails}>
                  <Text style={[styles.mediaName, { color: theme.text }]} numberOfLines={1}>
                    {media.name}
                  </Text>
                  <Text style={[styles.mediaSize, { color: theme.textMuted }]}>
                    {formatFileSize(media.size)}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => removeMedia(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={theme.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {isLoading && (
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          Medya seçiliyor...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
  },
  buttonText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  selectedMedia: {
    marginTop: spacing.sm,
  },
  selectedTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediaDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  mediaName: {
    ...typography.caption,
    fontWeight: '500',
  },
  mediaSize: {
    ...typography.small,
  },
  removeButton: {
    padding: spacing.xs,
  },
  loadingText: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});