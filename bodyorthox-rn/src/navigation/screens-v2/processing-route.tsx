import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { Icon } from "../../components";
import { colors, fonts, fontSize, fontWeight, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Processing">;

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

// ────────────────────────────────────────────────────────────
// Route — wrapper navigation (params, stores, chrome v2)
// ────────────────────────────────────────────────────────────

/**
 * Durée de la confirmation avant la navigation automatique vers Results.
 * L'analyse est déjà sauvegardée avant cet écran (voir use-capture-logic
 * handleSave) — ce délai n'est qu'une transition visuelle, pas un traitement
 * réel, donc il reste volontairement court (≤ 1s).
 */
const CONFIRMATION_HOLD_MS = 900;

export function ProcessingRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  // Stabilise les references pour eviter de relancer l'effect
  // a chaque re-render parent (params est un nouvel objet souvent).
  const navigatedRef = useRef(false);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const goToResults = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const p = paramsRef.current;
    // Stack cible dans le TAB D'ORIGINE de la capture : racine du tab ->
    // PatientDetail -> Results. Garantit que `goBack` depuis Results pop vers
    // PatientDetail, et `popToTop` depuis PatientDetail revient à la racine
    // du tab d'où la capture avait été lancée (Accueil ou Liste patients).
    const originTab = p.originTab ?? "AnalysesTab";
    const tabRoot =
      originTab === "PatientsTab" ? "PatientsList" : "AnalysesHome";
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          state: {
            routes: [
              {
                name: originTab,
                state: {
                  routes: [
                    { name: tabRoot },
                    {
                      name: "PatientDetail",
                      params: { patientId: p.patientId },
                    },
                    {
                      name: "Results",
                      params: {
                        analysisId: p.analysisId,
                        patientId: p.patientId,
                        ...(p.capturedImageUrl ? { capturedImageUrl: p.capturedImageUrl } : {}),
                        ...(p.allLandmarks ? { allLandmarks: p.allLandmarks } : {}),
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  }, [navigation]);

  // Confirmation courte, puis auto-advance vers Results — pas d'étapes
  // factices ni de bouton Annuler (l'analyse est déjà persistée).
  useEffect(() => {
    const timer = setTimeout(goToResults, CONFIRMATION_HOLD_MS);
    return () => clearTimeout(timer);
  }, [goToResults]);

  return <Processing />;
}
