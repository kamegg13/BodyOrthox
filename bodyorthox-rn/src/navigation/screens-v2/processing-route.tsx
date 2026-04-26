import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { Processing, type ProcessingStep } from "../../screens/Processing";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Processing">;

const STEP_DURATION_MS = 700;
const FINAL_HOLD_MS = 400;

const STEP_TEMPLATE: readonly { id: string; title: string; subtitle: string }[] = [
  { id: "lm", title: "Détection des landmarks", subtitle: "68 keypoints · 4 vues" },
  { id: "ja", title: "Calcul des angles", subtitle: "12 angles obtenus" },
  { id: "norm", title: "Comparaison aux normes HKA", subtitle: "Référence DB clinique" },
  { id: "rep", title: "Préparation du rapport", subtitle: "Mise en page PDF" },
];

export function ProcessingRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [activeIndex, setActiveIndex] = useState(0);

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

  const handleAbort = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    // Retour vers la fiche patient (dans le tab Patients).
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          state: {
            routes: [
              {
                name: "PatientsTab",
                state: {
                  routes: [
                    { name: "PatientsList" },
                    { name: "PatientDetail", params: { patientId: params.patientId } },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  }, [navigation, params.patientId]);

  // Cadencement visuel + auto-advance vers Results.
  useEffect(() => {
    const total = STEP_TEMPLATE.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= total; i++) {
      timers.push(setTimeout(() => setActiveIndex(i), i * STEP_DURATION_MS));
    }
    timers.push(setTimeout(goToResults, total * STEP_DURATION_MS + FINAL_HOLD_MS));

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [goToResults]);

  const steps: readonly ProcessingStep[] = STEP_TEMPLATE.map((s, i) => ({
    ...s,
    state: i < activeIndex ? "done" : i === activeIndex ? "active" : "pending",
  }));

  return <Processing steps={steps} onAbort={handleAbort} />;
}
