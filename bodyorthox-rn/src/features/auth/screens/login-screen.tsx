import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../core/auth/auth-store';
import { Btn } from '../../../components/Btn';
import { Field } from '../../../components/Field';
import { Icon } from '../../../components/icons';
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  letterSpacing,
  radius,
  spacing,
} from '../../../theme/tokens';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigation = useNavigation();

  // Le login est désormais OPTIONNEL (modal depuis Réglages › Compte) : on peut
  // le fermer sans se connecter. `canGoBack` garde-fou si présenté en racine.
  const canDismiss = navigation.canGoBack();
  const handleDismiss = () => {
    if (canDismiss) navigation.goBack();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Connecté : retour à l'écran appelant (Compte). L'état d'auth est déjà
      // reflété dans le store — pas de bascule de navigateur.
      if (navigation.canGoBack()) navigation.goBack();
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
          <View style={styles.hero}>
            <SafeAreaView edges={['top']} style={styles.heroSafe}>
              {canDismiss ? (
                <Pressable
                  onPress={handleDismiss}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  style={styles.closeBtn}
                  testID="login-close"
                >
                  <Icon name="back" size={18} color={colors.textInverse} />
                </Pressable>
              ) : null}
              <View style={styles.heroInner}>
                <Text style={styles.title}>Antidote Boost</Text>
                <Text style={styles.tagline}>
                  Orthopédie · Performance · Réathlétisation
                </Text>
                <Text style={styles.subtitle}>
                  Connectez-vous pour activer les sauvegardes chiffrées de vos
                  données (à venir). L'app fonctionne sans compte.
                </Text>
              </View>
            </SafeAreaView>
          </View>

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
    backgroundColor: colors.ink,
    borderRadius: radius.cardXl,
  },
  heroSafe: {
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.s12,
    left: spacing.s12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroInner: {
    alignItems: 'center',
    gap: spacing.s12,
    paddingHorizontal: spacing.heroPadH,
    paddingTop: spacing.s28,
    paddingBottom: spacing.s28,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.medium,
    color: colors.white60,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.eyebrow,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    color: colors.white60,
    textAlign: 'center',
    marginTop: spacing.s8,
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
