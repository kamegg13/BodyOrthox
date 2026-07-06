import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../core/auth/auth-store';
import { Btn } from '../../../components/Btn';
import { Field } from '../../../components/Field';
import { Gradient } from '../../../components/gradient';
import { Logo } from '../../../components/Logo';
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  gradients,
  radius,
  spacing,
} from '../../../theme/tokens';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Identifiants incorrects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <Gradient gradient={gradients.hero} radius={radius.cardXl} style={styles.hero}>
            <SafeAreaView edges={['top']} style={styles.heroSafe}>
              <View style={styles.heroDecor} pointerEvents="none" />
              <View style={styles.heroInner}>
                <Logo size={34} light />
                <Text style={styles.tagline}>
                  Orthopédie · Performance · Réathlétisation
                </Text>
              </View>
            </SafeAreaView>
          </Gradient>

          {/* FORM */}
          <View style={styles.form}>
            <Field
              label="Email"
              type="email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              testID="login-email"
            />
            <Field
              label="Mot de passe"
              type="password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              testID="login-password"
            />

            {error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Btn
              label={isLoading ? 'Connexion…' : 'Se connecter'}
              onPress={handleLogin}
              disabled={isLoading}
              full
              style={styles.submit}
              testID="login-submit"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.s20,
    gap: spacing.s24,
  },
  hero: {
    overflow: 'hidden',
  },
  heroSafe: {
    width: '100%',
  },
  heroDecor: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 24,
    borderColor: colors.white06,
  },
  heroInner: {
    alignItems: 'center',
    gap: spacing.s10,
    paddingHorizontal: spacing.heroPadH,
    paddingTop: spacing.s28,
    paddingBottom: spacing.s28,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.white60,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  form: {
    gap: spacing.s16,
  },
  errorBanner: {
    backgroundColor: colors.redLight,
    borderRadius: radius.field,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s10,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.red,
    textAlign: 'center',
  },
  submit: {
    marginTop: spacing.s4,
  },
});
