import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Linking } from 'react-native';

import { User, Moon, Sun, HelpCircle, LogOut, ExternalLink, RefreshCw, FileText, Shield } from 'lucide-react-native';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/services/api';


const WP_PASSWORD_RESET = 'https://example.com/my-account/lost-password/';

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout, deleteAccount } = useAuthStore();
  const theme = isDark ? colors.dark : colors.light;
  


  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handlePasswordReset = () => {
    Linking.openURL(WP_PASSWORD_RESET);
  };

  const handleRefreshCourses = async () => {
    try {
      // Refresh course access
      await apiService.getMyCourses();
      Alert.alert('Başarılı', 'Kurs erişimleri güncellendi');
    } catch (error) {
      Alert.alert('Hata', 'Kurs erişimleri güncellenirken bir hata oluştu');
    }
  };



  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Son Uyarı',
              'Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.',
              [
                {
                  text: 'İptal',
                  style: 'cancel',
                },
                {
                  text: 'Evet, Sil',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      Alert.alert('Başarılı', 'Hesabınız başarıyla silindi.');
                    } catch (error) {
                      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: isDark ? Sun : Moon,
      title: 'Tema',
      subtitle: isDark ? 'Açık tema' : 'Koyu tema',
      onPress: toggleTheme,
    },
    {
      icon: RefreshCw,
      title: 'Kurs listemi güncelle',
      subtitle: 'Erişimleri yenile',
      onPress: handleRefreshCourses,
    },
    {
      icon: ExternalLink,
      title: 'Şifre Sıfırla',
      subtitle: 'Web sitesinde şifrenizi değiştirin',
      onPress: handlePasswordReset,
    },
    {
      icon: FileText,
      title: 'Kullanım Koşulları',
      subtitle: 'Hizmet şartlarını görüntüle',
      onPress: () => Linking.openURL('https://burakozenakademi.com/kullanim-kosullari'),
    },
    {
      icon: Shield,
      title: 'Gizlilik Politikası',
      subtitle: 'Veri koruma politikamızı görüntüle',
      onPress: () => Linking.openURL('https://burakozenakademi.com/gizlilik'),
    },
    {
      icon: HelpCircle,
      title: 'Yardım & Destek',
      subtitle: 'Sık sorulan sorular ve destek',
      onPress: () => {
        Alert.alert('Yardım', 'Destek için info@burakozenakadem.com adresine yazabilirsiniz');
      },
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="h1">Profil</ThemedText>
        </View>

        {/* User Info */}
        <ThemedView surface style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                  <User size={32} color={theme.background} />
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <ThemedText type="h2">{user?.name || 'Kullanıcı'}</ThemedText>
              <ThemedText type="body" color="muted">
                {user?.email || 'email@example.com'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>



        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: theme.surface },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: theme.primary + '20' }]}>
                  <item.icon size={20} color={theme.primary} />
                </View>
                <View style={styles.menuText}>
                  <ThemedText type="body">{item.title}</ThemedText>
                  <ThemedText type="caption" color="muted">
                    {item.subtitle}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error + '20' }]}
          onPress={handleLogout}
        >
          <LogOut size={20} color={theme.error} />
          <ThemedText type="body" style={[styles.logoutText, { color: theme.error }]}>
            Çıkış Yap
          </ThemedText>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={[styles.deleteAccountButton, { backgroundColor: theme.error + '10', borderColor: theme.error }]}
          onPress={handleDeleteAccount}
        >
          <ThemedText type="caption" style={[styles.deleteAccountText, { color: theme.error }]}>
            Hesabı Sil
          </ThemedText>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText type="caption" color="muted" style={styles.appVersion}>
            Burak Özen Akademi v1.0.0
          </ThemedText>
          <ThemedText type="caption" color="muted" style={styles.copyright}>
            © 2024 Burak Özen Akademi
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
  header: {
    padding: spacing.md,
    paddingTop: spacing.xxl,
  },
  userCard: {
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  menuContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  menuItem: {
    borderRadius: 12,
    padding: spacing.md,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  logoutText: {
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  appVersion: {
    textAlign: 'center',
  },
  copyright: {
    textAlign: 'center',
  },
  deleteAccountButton: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteAccountText: {
    fontWeight: '500',
  },
});