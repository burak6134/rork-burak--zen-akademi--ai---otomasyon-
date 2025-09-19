import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, Linking } from 'react-native';
import { router, Stack } from 'expo-router';
import { Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { BurakOzenLogo } from '@/components/BurakOzenLogo';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const { isDark } = useThemeStore();
  const { register } = useAuthStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin');
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert('Hata', 'Lütfen şifrenizi girin');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Hata', 'Devam etmek için Kullanım Koşulları ve Gizlilik Politikası\'nı okumalı ve kabul etmelisiniz');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(formData.name.trim(), formData.email.trim(), formData.password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Kayıt Hatası', 'Kayıt işlemi sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            
            <BurakOzenLogo 
              variant="vertical" 
              size={60} 
              style={styles.logo}
            />
            <ThemedText type="h2" color="primary" style={styles.title}>
              Hesap Oluştur
            </ThemedText>
            <ThemedText type="body" color="muted" style={styles.subtitle}>
              AI + Otomasyon eğitimlerine katılın
            </ThemedText>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText type="body" style={styles.label}>
                Ad Soyad
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Adınızı ve soyadınızı girin"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="body" style={styles.label}>
                E-posta
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="ornek@email.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="body" style={styles.label}>
                Şifre
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="body" style={styles.label}>
                Şifre Tekrar
              </ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Şifrenizi tekrar girin"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={theme.textMuted} />
                  ) : (
                    <Eye size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreedToTerms ? theme.primary : 'transparent',
                    borderColor: agreedToTerms ? theme.primary : theme.border,
                  }
                ]}>
                  {agreedToTerms && (
                    <Check size={16} color={theme.background} />
                  )}
                </View>
                <View style={styles.checkboxTextContainer}>
                  <View style={styles.termsTextRow}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL('https://burakozenakademi.com/kullanim-kosullari')}
                      style={styles.termsLink}
                    >
                      <ThemedText type="body" style={[styles.checkboxText, styles.linkText, { color: theme.primary }]}>
                        Kullanım Koşulları
                      </ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="body" style={styles.checkboxText}>
                      {' '}ve{' '}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => Linking.openURL('https://burakozenakademi.com/gizlilik')}
                      style={styles.termsLink}
                    >
                      <ThemedText type="body" style={[styles.checkboxText, styles.linkText, { color: theme.primary }]}>
                        Gizlilik Politikası
                      </ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="body" style={styles.checkboxText}>
                      'nı okudum ve kabul ediyorum.
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                {
                  backgroundColor: isLoading || !agreedToTerms ? theme.border : theme.primary,
                },
              ]}
              onPress={handleRegister}
              disabled={isLoading || !agreedToTerms}
            >
              <ThemedText
                type="body"
                style={[
                  styles.registerButtonText,
                  { color: isLoading || !agreedToTerms ? theme.textMuted : theme.background },
                ]}
              >
                {isLoading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
              </ThemedText>
            </TouchableOpacity>


          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms of Use Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="h2" style={styles.modalTitle}>
              Terms of Use
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTermsModal(false)}
            >
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.eulaContent}>
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                END USER LICENSE AGREEMENT (EULA)
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                1. ACCEPTANCE OF TERMS
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                By downloading, installing, or using this application, you agree to be bound by the terms and conditions of this End User License Agreement. If you do not agree to these terms, do not use this application.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                2. LICENSE GRANT
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                We grant you a limited, non-exclusive, non-transferable, revocable license to use this application for personal, non-commercial purposes in accordance with these terms.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                3. RESTRICTIONS
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                You may not:{"\n"}
                • Modify, adapt, or create derivative works of the application{"\n"}
                • Reverse engineer, decompile, or disassemble the application{"\n"}
                • Remove or alter any proprietary notices or labels{"\n"}
                • Use the application for any illegal or unauthorized purpose{"\n"}
                • Share your account credentials with others
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                4. USER CONTENT
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                You retain ownership of content you create or upload. By using our services, you grant us a worldwide, royalty-free license to use, store, and display your content as necessary to provide our services.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                5. PRIVACY
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                Your privacy is important to us. We collect and use information in accordance with our Privacy Policy. We do not sell your personal information to third parties.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                6. COMMUNITY GUIDELINES
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                When using community features, you agree to:{"\n"}
                • Be respectful and constructive in communications{"\n"}
                • Not post spam, advertisements, or inappropriate content{"\n"}
                • Not harass or disturb other users{"\n"}
                • Not infringe on copyright or intellectual property rights{"\n"}
                • Protect your personal information
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                7. DISCLAIMERS
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                The application is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                8. LIMITATION OF LIABILITY
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                In no event shall we be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the application.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                9. TERMINATION
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                We may terminate or suspend your access to the application at any time, with or without cause, with or without notice.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                10. CHANGES TO TERMS
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                We reserve the right to modify these terms at any time. Continued use of the application after changes constitutes acceptance of the new terms.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                11. GOVERNING LAW
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                These terms shall be governed by and construed in accordance with applicable laws.
              </ThemedText>
              
              <ThemedText type="body" style={[styles.eulaText, styles.eulaBold]}>
                12. CONTACT INFORMATION
              </ThemedText>
              <ThemedText type="body" style={styles.eulaText}>
                If you have any questions about these terms, please contact us through the application&apos;s support channels.
              </ThemedText>
              
              <ThemedText type="body" style={styles.eulaText}>
                By clicking &quot;I Agree&quot; you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
              </ThemedText>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.agreeButton,
                { backgroundColor: theme.primary }
              ]}
              onPress={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
            >
              <ThemedText type="body" style={[styles.agreeButtonText, { color: theme.background }]}>
                I Agree
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
    zIndex: 1,
  },
  logo: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: spacing.xxl,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    padding: spacing.xs,
  },
  termsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  termsTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLink: {
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxText: {
    lineHeight: 20,
  },
  registerButton: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  registerButtonText: {
    fontWeight: '600',
  },

  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  eulaContent: {
    gap: spacing.md,
  },
  eulaText: {
    lineHeight: 22,
  },
  eulaBold: {
    fontWeight: '600',
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  agreeButton: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  agreeButtonText: {
    fontWeight: '600',
  },
});