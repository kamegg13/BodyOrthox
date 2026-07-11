import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/shared/design-system/colors';
import { Shadows } from '@/shared/design-system/card-styles';
import { sizes } from '@/theme/tokens';
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
    >
      <Text style={styles.icon}>💬</Text>
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
    // Encre : le cyan est réservé aux actifs/liens (DESIGN_DIRECTION.md),
    // pas aux fonds de bouton.
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    zIndex: 999,
  },
  fabPressed: {
    opacity: 0.85,
    shadowOpacity: 0.15,
  },
  icon: {
    fontSize: 20,
  },
});
