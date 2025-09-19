import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Share, Download, Copy, RefreshCw } from 'lucide-react-native';
import { Certificate } from '@/types/api';
import { certificatesStore } from '@/lib/certificates.store';
import { certificatesService } from '@/lib/certificates';
import { CertificateCard } from '@/components/CertificateCard';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function CertificateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const certificateRef = useRef<View>(null);

  useEffect(() => {
    loadCertificate();
  }, [id]);

  const loadCertificate = async () => {
    if (!id) return;
    
    try {
      const cert = await certificatesStore.getCertificateById(id);
      setCertificate(cert);
    } catch (error) {
      console.error('Error loading certificate:', error);
      Alert.alert('Hata', 'Sertifika yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePDF = async () => {
    if (!certificate) return;

    try {
      if (certificate.pdfUri) {
        await certificatesService.sharePDF(certificate);
      } else {
        await handleRegenerateFiles();
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Hata', 'PDF paylaşılırken bir hata oluştu.');
    }
  };

  const handleSharePNG = async () => {
    if (!certificate || !certificateRef.current) return;

    try {
      const pngUri = await certificatesService.generatePNG(certificateRef.current);
      await certificatesService.sharePNG(pngUri);
    } catch (error) {
      console.error('Error sharing PNG:', error);
      Alert.alert('Hata', 'Görsel paylaşılırken bir hata oluştu.');
    }
  };

  const handleCopyLink = async () => {
    if (!certificate) return;

    try {
      await certificatesService.copyLink(certificate);
      Alert.alert('Başarılı', 'Bağlantı kopyalandı.');
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Hata', 'Bağlantı kopyalanırken bir hata oluştu.');
    }
  };

  const handleRegenerateFiles = async () => {
    if (!certificate) return;

    setRegenerating(true);
    try {
      const updated = await certificatesService.regenerateFiles(certificate);
      setCertificate(updated);
      Alert.alert('Başarılı', 'Sertifika dosyaları yeniden oluşturuldu.');
    } catch (error) {
      console.error('Error regenerating files:', error);
      Alert.alert('Hata', 'Dosyalar oluşturulurken bir hata oluştu.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Sertifika yükleniyor...
        </Text>
      </View>
    );
  }

  if (!certificate) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          Sertifika bulunamadı
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Sertifika Detayı',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }} 
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <CertificateCard 
          ref={certificateRef}
          certificate={certificate} 
          showQR={true}
        />

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleSharePDF}
            testID="share-pdf-button"
          >
            <Download size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>PDF Paylaş</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
            onPress={handleSharePNG}
            testID="share-png-button"
          >
            <Share size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Görsel Paylaş</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleCopyLink}
            testID="copy-link-button"
          >
            <Copy size={20} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Bağlantıyı Kopyala</Text>
          </TouchableOpacity>

          {!certificate.pdfUri && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.warning }]}
              onPress={handleRegenerateFiles}
              disabled={regenerating}
              testID="regenerate-button"
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {regenerating ? 'Oluşturuluyor...' : 'Dosyaları Yenile'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            Sertifika Bilgileri
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Sertifika No:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {certificate.certificateId}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
              Tamamlanma Tarihi:
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(certificate.completedAtUTC).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  infoTitle: {
    ...typography.h4,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  infoLabel: {
    ...typography.body,
    flex: 1,
    minWidth: 120,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});