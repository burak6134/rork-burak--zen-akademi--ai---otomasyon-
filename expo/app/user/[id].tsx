import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { User, MessageCircle, UserX, Flag } from 'lucide-react-native';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Author } from '@/types/api';
import { communityService, getUserInitials } from '@/services/community';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [user, setUser] = useState<(Author & { isBlocked?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUserProfile();
    }
  }, [id]);

  const loadUserProfile = async () => {
    try {
      const userData = await communityService.getUserProfile(parseInt(id!));
      setUser(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Hata', 'Kullanıcı profili yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = () => {
    if (!user) return;
    
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${user.name} kullanıcısını engellemek istediğinizden emin misiniz?`,
      [
        {
          text: 'Engelle',
          onPress: async () => {
            try {
              await communityService.blockUser(user.id);
              setUser({ ...user, isBlocked: true });
              Alert.alert('Başarılı', 'Kullanıcı engellendi.');
            } catch (error) {
              Alert.alert('Hata', 'Kullanıcı engellenirken bir hata oluştu.');
            }
          },
          style: 'destructive',
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleUnblockUser = () => {
    if (!user) return;
    
    Alert.alert(
      'Engeli Kaldır',
      `${user.name} kullanıcısının engelini kaldırmak istediğinizden emin misiniz?`,
      [
        {
          text: 'Engeli Kaldır',
          onPress: async () => {
            try {
              await communityService.unblockUser(user.id);
              setUser({ ...user, isBlocked: false });
              Alert.alert('Başarılı', 'Engel kaldırıldı.');
            } catch (error) {
              Alert.alert('Hata', 'Engel kaldırılırken bir hata oluştu.');
            }
          },
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleReportUser = () => {
    if (!user) return;
    
    Alert.alert(
      'Kullanıcıyı Bildir',
      'Bu kullanıcıyı neden bildirmek istiyorsunuz?',
      [
        {
          text: 'Spam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Taciz',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Diğer',
          onPress: () => submitReport('other'),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    if (!user) return;
    
    try {
      await communityService.reportUser(user.id, reason);
      Alert.alert('Teşekkürler', 'Raporunuz alındı ve incelenecek.');
    } catch (error) {
      Alert.alert('Hata', 'Rapor gönderilirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Yükleniyor...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText type="body" color="muted">Profil yükleniyor...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Kullanıcı Bulunamadı' }} />
        <View style={styles.errorContainer}>
          <ThemedText type="body" color="muted">Kullanıcı bulunamadı.</ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText type="body" style={{ color: theme.background }}>Geri Dön</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: user.name }} />
      
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <User size={48} color={theme.background} />
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <ThemedText type="h2">{user.name}</ThemedText>
            {user.isBlocked && (
              <View style={[styles.blockedBadge, { backgroundColor: theme.error + '20' }]}>
                <UserX size={16} color={theme.error} />
                <ThemedText type="caption" style={{ color: theme.error }}>
                  Engellenmiş
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => {
              // TODO: Implement messaging when available
              Alert.alert('Bilgi', 'Mesajlaşma özelliği yakında eklenecek.');
            }}
          >
            <MessageCircle size={20} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary }}>
              Mesaj Gönder
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
            onPress={handleReportUser}
          >
            <Flag size={20} color={theme.error} />
            <ThemedText type="body" style={{ color: theme.error }}>
              Bildir
            </ThemedText>
          </TouchableOpacity>
          
          {user.isBlocked ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.success + '20' }]}
              onPress={handleUnblockUser}
            >
              <User size={20} color={theme.success} />
              <ThemedText type="body" style={{ color: theme.success }}>
                Engeli Kaldır
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
              onPress={handleBlockUser}
            >
              <UserX size={20} color={theme.error} />
              <ThemedText type="body" style={{ color: theme.error }}>
                Engelle
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Content */}
        <View style={styles.profileContent}>
          <ThemedText type="body" color="muted" style={styles.emptyText}>
            Kullanıcı profil bilgileri yakında eklenecek.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  profileContent: {
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});