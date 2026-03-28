import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Send, X } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { communityService } from '@/services/community';
import MediaPicker, { SelectedMedia } from '@/components/MediaPicker';

export default function CreatePostScreen() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [text, setText] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);

  const canPost = text.trim().length > 0 && !isPosting;

  const handlePost = async () => {
    if (!canPost) return;

    setIsPosting(true);
    try {
      // Upload media files first
      const mediaIds: number[] = [];
      
      for (const media of selectedMedia) {
        try {
          const uploadResult = await communityService.uploadMedia(
            media.uri,
            media.name,
            media.type
          );
          mediaIds.push(uploadResult.id);
        } catch (err) {
          console.error('Media upload error:', err);
          // Continue with other media files
        }
      }

      // Create the post
      await communityService.createPost({
        text: text.trim(),
        mediaIds,
        group: 'Genel', // Default group
      });

      // Navigate back and show success
      router.back();
      
      // Note: In a real app, you might want to refresh the feed or use a state management solution
      setTimeout(() => {
        Alert.alert('Başarılı', 'Gönderiniz paylaşıldı!');
      }, 100);
      
    } catch (err) {
      console.error('Post creation error:', err);
      Alert.alert('Hata', 'Gönderi paylaşılırken bir hata oluştu. Tekrar deneyin.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    if (text.trim() || selectedMedia.length > 0) {
      Alert.alert(
        'Değişiklikleri Kaybet',
        'Yazdığınız içerik kaybolacak. Emin misiniz?',
        [
          { text: 'Devam Et', style: 'cancel' },
          { text: 'Kaybet', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Yeni Gönderi',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerLeft: () => (
            <Pressable
              style={styles.headerButton}
              onPress={handleCancel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={24} color={theme.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              style={[
                styles.postButton,
                {
                  backgroundColor: canPost ? theme.primary : theme.surfaceVariant,
                },
              ]}
              onPress={handlePost}
              disabled={!canPost}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Send
                size={16}
                color={canPost ? theme.background : theme.textMuted}
              />
              <Text
                style={[
                  styles.postButtonText,
                  {
                    color: canPost ? theme.background : theme.textMuted,
                  },
                ]}
              >
                {isPosting ? 'Gönderiliyor...' : 'Gönder'}
              </Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            placeholder="Ne düşünüyorsun? Deneyimlerini, sorularını veya önerilerini paylaş..."
            placeholderTextColor={theme.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            maxLength={2000}
            autoFocus
          />
          
          <View style={styles.characterCount}>
            <Text style={[styles.characterCountText, { color: theme.textMuted }]}>
              {text.length}/2000
            </Text>
          </View>
        </View>

        <MediaPicker
          selectedMedia={selectedMedia}
          onMediaSelected={setSelectedMedia}
          maxItems={5}
        />

        <View style={styles.tips}>
          <Text style={[styles.tipsTitle, { color: theme.text }]}>
            💡 İpuçları
          </Text>
          <Text style={[styles.tipsText, { color: theme.textMuted }]}>
            • Deneyimlerinizi detaylı anlatın{'\n'}
            • Sorularınızı net bir şekilde sorun{'\n'}
            • Blueprint dosyalarınızı paylaşın{'\n'}
            • Başkalarının gönderilerine saygılı yorumlar yapın
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  postButtonText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  inputContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  textInput: {
    minHeight: 120,
    maxHeight: 200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  characterCountText: {
    ...typography.small,
  },
  tips: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
  },
  tipsTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipsText: {
    ...typography.caption,
    lineHeight: 18,
  },
});