import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Certificate } from '@/types/api';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface CertificateCardProps {
  certificate: Certificate;
  showQR?: boolean;
}

export const CertificateCard = forwardRef<View, CertificateCardProps>(
  ({ certificate, showQR = true }, ref) => {
    const { isDark } = useThemeStore();
    const theme = isDark ? colors.dark : colors.light;

    const formattedDate = new Date(certificate.completedAtUTC).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <View ref={ref} style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={[styles.certificate, { borderColor: theme.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.primary }]}>
              🎓 BURAK ÖZEN AKADEMİ
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              AI + Otomasyon Eğitim Platformu
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.primary }]}>
            BAŞARI SERTİFİKASI
          </Text>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.recipient, { color: theme.text }]}>
              Bu sertifika
            </Text>
            <Text style={[styles.name, { color: theme.secondary }]}>
              {certificate.userName}
            </Text>
            <Text style={[styles.recipient, { color: theme.text }]}>
              adlı kişinin
            </Text>
            
            <View style={[styles.courseContainer, { 
              backgroundColor: `${theme.primary}15`,
              borderColor: `${theme.primary}30`
            }]}>
              <Text style={[styles.course, { color: theme.text }]}>
                &ldquo;{certificate.courseTitle}&rdquo;
              </Text>
            </View>
            
            <Text style={[styles.recipient, { color: theme.text }]}>
              kursunu başarıyla tamamladığını belgeler.
            </Text>
            
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              Tamamlanma Tarihi: {formattedDate}
            </Text>
          </View>

          {/* QR Code */}
          {showQR && (
            <View style={styles.qrContainer}>
              <QRCode
                value={certificate.deepLink}
                size={80}
                color={theme.text}
                backgroundColor={theme.surface}
              />
            </View>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: `${theme.primary}30` }]}>
            <Text style={[styles.signature, { color: theme.textSecondary }]}>
              Dijital olarak doğrulanmıştır
            </Text>
            <Text style={[styles.academy, { color: theme.primary }]}>
              Burak Özen Akademi
            </Text>
          </View>

          {/* Certificate ID */}
          <Text style={[styles.certificateId, { color: theme.textMuted }]}>
            Sertifika No: {certificate.certificateId}
          </Text>
        </View>
      </View>
    );
  }
);

CertificateCard.displayName = 'CertificateCard';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 16,
    margin: spacing.md,
  },
  certificate: {
    borderWidth: 3,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  recipient: {
    ...typography.h4,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  courseContainer: {
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  course: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  date: {
    ...typography.body,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  qrContainer: {
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  signature: {
    ...typography.body,
    textAlign: 'center',
  },
  academy: {
    ...typography.h4,
    fontWeight: 'bold',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  certificateId: {
    ...typography.small,
    marginTop: spacing.xl,
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
});