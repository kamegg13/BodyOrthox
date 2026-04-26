import React, { useCallback, useMemo } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Share, Platform } from "react-native";
import type { RootStackParamList } from "../types";
import { Results, type ResultsData, type AngleMeasurement } from "../../screens/Results";
import { LoadingSpinner } from "../../shared/components/loading-spinner";
import { ErrorWidget } from "../../shared/components/error-widget";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import { useAsyncData } from "../../shared/hooks/use-async-data";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import { calculateBilateralAngles } from "../../features/capture/data/angle-calculator";
import type { PoseLandmarks } from "../../features/capture/data/angle-calculator";
import type { Analysis } from "../../features/capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Results">;

export function ResultsRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysisId, patientId, capturedImageUrl, allLandmarks } = params;

  const repo = useAnalysisRepository();
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useAsyncData(() => repo.getById(analysisId), [analysisId, repo]);

  const patient = usePatientsStore((s) =>
    s.patients.find((p) => p.id === patientId),
  );

  const effectiveImageUrl = capturedImageUrl ?? analysis?.capturedImageUrl;

  const data = useMemo<ResultsData | null>(() => {
    if (!analysis || !patient) return null;
    return buildResultsData(analysis, patient.name, allLandmarks, effectiveImageUrl);
  }, [analysis, patient, allLandmarks, effectiveImageUrl]);

  const handleBack = useCallback(() => {
    // La stack est garantie [..., PatientDetail, Results] :
    // - depuis l'historique : push Results sur PatientDetail
    // - depuis Processing : reset → [Dashboard, PatientDetail, Results]
    // Donc goBack() pop proprement vers PatientDetail.
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("PatientDetail", { patientId });
  }, [navigation, patientId]);

  const handleShare = useCallback(async () => {
    if (!data) return;
    const text = formatShareText(data);
    if (Platform.OS === "web") {
      const nav = (typeof navigator !== "undefined" ? navigator : null) as
        | (Navigator & { share?: (input: { title?: string; text?: string }) => Promise<void> })
        | null;
      if (nav?.share) {
        try {
          await nav.share({ title: "Résultats d’analyse", text });
        } catch {
          /* user cancelled */
        }
      }
      return;
    }
    try {
      await Share.share({ message: text });
    } catch {
      /* ignore */
    }
  }, [data]);

  const handleGenerateReport = useCallback(() => {
    if (!analysis || !patient) return;
    navigation.navigate("Report", { analysis, patient });
  }, [navigation, analysis, patient]);

  if (isLoading) return <LoadingSpinner fullScreen message="Chargement des résultats..." />;
  if (error) return <ErrorWidget message={error} onRetry={refetch} />;
  if (!analysis || !data) {
    return <ErrorWidget message="Analyse introuvable." onRetry={refetch} />;
  }

  return (
    <Results
      data={data}
      onBack={handleBack}
      onShare={handleShare}
      onGenerateReport={handleGenerateReport}
    />
  );
}

function buildResultsData(
  analysis: Analysis,
  patientName: string,
  fallbackLandmarks?: PoseLandmarks,
  imageUrl?: string,
): ResultsData {
  const bilateral =
    analysis.bilateralAngles ??
    (fallbackLandmarks ? calculateBilateralAngles(fallbackLandmarks) : null);

  const leftHKA = round(bilateral?.leftHKA ?? 180);
  const rightHKA = round(bilateral?.rightHKA ?? 180);
  const norms = { hka: 180, shoulder: 0, pelvis: 5, head: 0, spine: 10 };

  const hka = {
    left:  measure("hka-l", "HKA gauche", leftHKA, norms.hka, "°"),
    right: measure("hka-r", "HKA droit",  rightHKA, norms.hka, "°"),
  };

  const postural: readonly AngleMeasurement[] = [
    measure("hip", "Inclin. bassin", round(analysis.angles.hipAngle), norms.pelvis, "°"),
    measure("knee", "Angle genou",   round(analysis.angles.kneeAngle), 0, "°"),
    measure("ankle", "Angle cheville", round(analysis.angles.ankleAngle), 0, "°"),
  ];

  const severity = severityFromAnalysis(leftHKA, rightHKA);
  const date = new Date(analysis.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const type = "Analyse posturale";

  return {
    patientName,
    date,
    type,
    severity,
    hka,
    postural,
    ...(imageUrl ? { capturedImageUrl: imageUrl } : {}),
  };
}

function measure(
  key: string,
  label: string,
  value: number,
  norm: number,
  unit: "°" | "mm",
): AngleMeasurement {
  return { key, label, value, norm, unit };
}

function severityFromAnalysis(leftHKA: number, rightHKA: number): "normal" | "moderate" | "severe" {
  const worst = Math.max(Math.abs(180 - leftHKA), Math.abs(180 - rightHKA));
  if (worst < 2) return "normal";
  if (worst < 6) return "moderate";
  return "severe";
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatShareText(d: ResultsData): string {
  const lines = [
    `Patient : ${d.patientName}`,
    `Date : ${d.date}`,
    `Severite : ${d.severity}`,
    `HKA gauche : ${d.hka.left.value}°  (norme ${d.hka.left.norm}°)`,
    `HKA droit : ${d.hka.right.value}°  (norme ${d.hka.right.norm}°)`,
    "",
    ...d.postural.map((m) => `${m.label} : ${m.value}${m.unit}  (norme ${m.norm}${m.unit})`),
  ];
  return lines.join("\n");
}
