import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { Eye, EyeOff, ExternalLink } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { BurakOzenLogo } from '@/components/BurakOzenLogo';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

const WP_PURCHASE_PAGE = 'https://example.com/akademi';
const WP_PASSWORD_RESET = 'https://example.com/my-account/lost-password/';

export default function LoginScreen() {
  const { isDark } = useThemeStore();
  const { login } = useAuthStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Giriş Hatası', 'E-posta veya şifre hatalı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleForgotPassword = () => {
    Linking.openURL(WP_PASSWORD_RESET);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <BurakOzenLogo 
              variant="vertical" 
              size={80} 
              style={styles.logo}
            />
            <ThemedText type="h1" color="primary" style={styles.title}>
              Burak Özen Akademi
            </ThemedText>
            <ThemedText type="body" color="muted" style={styles.subtitle}>
              AI + Otomasyon eğitimlerine erişin
            </ThemedText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
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
                value={email}
                onChangeText={setEmail}
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
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifrenizi girin"
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

            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  backgroundColor: isLoading ? theme.border : theme.primary,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <ThemedText
                type="body"
                style={[
                  styles.loginButtonText,
                  { color: isLoading ? theme.textMuted : theme.background },
                ]}
              >
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <ThemedText type="body" color="primary">
                Şifremi Unuttum
              </ThemedText>
              <ExternalLink size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Register Section */}
          <View style={styles.registerSection}>
            <ThemedText type="body" color="muted" style={styles.registerText}>
              Henüz hesabınız yok mu?
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.registerButton,
                { borderColor: theme.primary },
              ]}
              onPress={handleRegister}
            >
              <ThemedText type="body" color="primary">
                Hesap Oluştur
              </ThemedText>
              <ExternalLink size={16} color={theme.primary} />
            </TouchableOpacity>
            <ThemedText type="caption" color="muted" style={styles.centeredNote}>
              Yeni hesap oluşturmak için kayıt formunu doldurun.
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
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
  loginButton: {
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginButtonText: {
    fontWeight: '600',
  },
  forgotPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  registerSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  registerText: {
    textAlign: 'center',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  centeredNote: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
});