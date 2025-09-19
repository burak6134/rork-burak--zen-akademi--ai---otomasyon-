import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Share, Calendar, Award } from 'lucide-react-native';
import { Certificate } from '@/types/api';
import { certificatesStore } from '@/lib/certificates.store';
import { certificatesService } from '@/lib/certificates';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function CertificatesScreen() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCertificates = async () => {
    try {
      const certs = await certificatesStore.listCertificates();
      setCertificates(certs);
    } catch (error) {
      console.error('Error loading certificates:', error);
      Alert.alert('Hata', 'Sertifikalar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCertificates();
  };

  const handleShare = async (certificate: Certificate) => {
    try {
      if (certificate.pdfUri) {
        await certificatesService.sharePDF(certificate);
      } else {
        Alert.alert(
          'PDF Bulunamadı',
          'PDF dosyası bulunamadı. Yeniden oluşturmak ister misiniz?',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Oluştur',
              onPress: async () => {
                try {
                  const updated = await certificatesService.regenerateFiles(certificate);
                  setCertificates(prev => 
                    prev.map(c => c.id === updated.id ? updated : c)
                  );
                  await certificatesService.sharePDF(updated);
                } catch (error) {
                  Alert.alert('Hata', 'PDF oluşturulurken bir hata oluştu.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error sharing certificate:', error);
      Alert.alert('Hata', 'Sertifika paylaşılırken bir hata oluştu.');
    }
  };

  const handleViewCertificate = (certificate: Certificate) => {
    router.push(`/certificates/${certificate.id}`);
  };

  const renderCertificateItem = ({ item }: { item: Certificate }) => {
    const formattedDate = new Date(item.completedAtUTC).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <TouchableOpacity
        style={[styles.certificateItem, { backgroundColor: theme.surface }]}
        onPress={() => handleViewCertificate(item)}
        testID={`certificate-item-${item.id}`}
      >
        <View style={styles.certificateHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Award size={24} color={theme.primary} />
          </View>
          <View style={styles.certificateInfo}>
            <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={2}>
              {item.courseTitle}
            </Text>
            <Text style={[styles.userName, { color: theme.secondary }]}>
              {item.userName}
            </Text>
            <View style={styles.dateContainer}>
              <Calendar size={14} color={theme.textMuted} />
              <Text style={[styles.date, { color: theme.textMuted }]}>
                {formattedDate}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.primary + '20' }]}
          onPress={() => handleShare(item)}
          testID={`share-certificate-${item.id}`}
        >
          <Share size={20} color={theme.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Award size={64} color={theme.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Henüz Sertifikanız Yok
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Bir kursu tamamladığınızda sertifikanız burada görünecek.
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Sertifikalarım',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }} 
      />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <FlatList
          data={certificates}
          renderItem={renderCertificateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.md,
    flexGrow: 1,
  },
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  certificateHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  certificateInfo: {
    flex: 1,
  },
  courseTitle: {
    ...typography.h4,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});