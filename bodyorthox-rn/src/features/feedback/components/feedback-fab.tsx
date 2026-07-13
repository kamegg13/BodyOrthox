import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/icons';
import { colors, sizes } from '../../../theme/tokens';
import { Shadows } from '@/shared/design-system/card-styles';
import { useFeedbackStore } from '../store/feedback-store';

export function FeedbackFab() {
  const { openModal } = useFeedbackStore();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(() => {
    openModal();
  }, [openModal]);

  // Au-dessus de la tab bar + son inset de sécurité (varie selon l'appareil —
  // un offset fixe recouvrait la tab bar sur les téléphones à home indicator).
  const bottom = insets.bottom + sizes.bottomTab + sizes.bottomTabSafePad;

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Envoyer un retour"
      testID="feedback-fab"
    >
      <Icon name="chat" size={20} color={colors.ink} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    // Utilitaire annexe : surface carte + bordure, il ne doit pas rivaliser
    // avec les CTA primaires cyan de l'écran.
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    zIndex: 999,
  },
  fabPressed: {
    opacity: 0.85,
    shadowOpacity: 0.15,
  },
});
