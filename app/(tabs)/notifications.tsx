import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Bell, BookOpen, HelpCircle, Megaphone, Users } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Notification } from '@/types/api';
import { apiService } from '@/services/api';
import { colors, spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = async () => {
    try {
      const notificationsData = await apiService.getNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    console.log('Notification pressed:', notification);
    
    try {
      if (notification.type === 'course' && notification.courseId) {
        router.push(`/course/${notification.courseId}`);
      } else if (notification.type === 'quiz' && notification.courseId && notification.lessonId) {
        router.push(`/lesson/${notification.lessonId}`);
      } else if (notification.type === 'community' && notification.postId) {
        router.push(`/post/${notification.postId}`);
      } else if (notification.type === 'community' && notification.userId) {
        router.push(`/user/${notification.userId}`);
      } else {
        console.log('No navigation defined for this notification type');
      }
      
      markAsRead(notification.id);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'course':
        return <BookOpen size={20} color={theme.primary} />;
      case 'quiz':
        return <HelpCircle size={20} color={theme.secondary} />;
      case 'community':
        return <Users size={20} color={theme.success} />;
      case 'announcement':
        return <Megaphone size={20} color={theme.warning} />;
      default:
        return <Bell size={20} color={theme.textMuted} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 48) return 'Dün';
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <ThemedText type="h1">Bildirimler</ThemedText>
        <ThemedText type="body" color="muted">
          {notifications.filter(n => !n.isRead).length} okunmamış
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={theme.textMuted} />
            <ThemedText type="h3" color="muted" style={styles.emptyTitle}>
              Henüz bildirim yok
            </ThemedText>
            <ThemedText type="body" color="muted" style={styles.emptyDescription}>
              Yeni dersler ve güncellemeler hakkında bildirim alacaksınız
            </ThemedText>
          </View>
        ) : (
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: notification.isRead ? theme.surface : theme.primary + '10',
                    borderLeftColor: notification.isRead ? theme.border : theme.primary,
                  },
                ]}
                onPress={() => handleNotificationPress(notification)}
                testID={`notification-${notification.id}`}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                      {getNotificationIcon(notification.type)}
                    </View>
                    <View style={styles.notificationInfo}>
                      <ThemedText
                        type="body"
                        style={[
                          styles.notificationTitle,
                          { fontWeight: notification.isRead ? 'normal' : 'bold' },
                        ]}
                      >
                        {notification.title}
                      </ThemedText>
                      <ThemedText type="caption" color="muted">
                        {formatDate(notification.createdAt)}
                      </ThemedText>
                    </View>
                    {!notification.isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                    )}
                  </View>
                  <ThemedText type="body" color="muted" style={styles.notificationMessage}>
                    {notification.message}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    textAlign: 'center',
  },
  notificationsContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContent: {
    padding: spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
});