import React, { useCallback, useEffect, useRef } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { Processing } from "../../screens/Processing";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Processing">;

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
    // Stack cible : Dashboard -> PatientDetail -> Results
    // Garantit que `goBack` depuis Results pop vers PatientDetail,
    // et `popToTop` depuis PatientDetail revient au Dashboard.
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          state: {
            routes: [
              {
                name: "AnalysesTab",
                state: {
                  routes: [
                    { name: "AnalysesHome" },
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
