import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Icon } from "../components";
import { colors, fonts, fontSize, fontWeight, spacing } from "../theme/tokens";

interface ProcessingProps {
  readonly title?: string;
}

const BADGE_SIZE = 72;

/**
 * Écran de confirmation post-capture — l'analyse est déjà sauvegardée en base
 * avant l'affichage (voir ProcessingRoute), donc il n'y a rien à « annuler »
 * ici : cette vue n'est qu'une transition courte vers Results, sans étapes
 * factices ni action de sortie.
 */
export function Processing({ title = "Analyse enregistrée" }: ProcessingProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Indisponible sur cette plateforme (ex. certains environnements web) —
        // on garde l'animation par défaut plutôt que de bloquer l'écran.
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility?.(title);
  }, [title]);

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, scale, opacity]);

  return (
    <View style={styles.root} testID="processing-confirmation">
      <StatusBar barStyle="dark-content" />
      <View style={styles.body}>
        <Animated.View
          style={[styles.badge, { opacity, transform: [{ scale }] }]}
        >
          <Icon name="check" size={32} color={colors.textInverse} strokeWidth={2.5} />
        </Animated.View>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s16,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
});
