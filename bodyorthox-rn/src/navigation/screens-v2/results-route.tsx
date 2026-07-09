import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { patientDisplayName } from "../../features/patients/domain/patient";
import { calculateBilateralAngles, classifyHKA } from "../../features/capture/data/angle-calculator";
import type { PoseLandmarks, BilateralAngles } from "../../features/capture/data/angle-calculator";
import { composeSkeletonImage } from "../../features/capture/data/skeleton-canvas";
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
  const effectiveLandmarks: PoseLandmarks | undefined = (allLandmarks ?? analysis?.allLandmarks) as
    | PoseLandmarks
    | undefined;
  const bilateral: BilateralAngles | undefined =
    analysis?.bilateralAngles ??
    (effectiveLandmarks ? calculateBilateralAngles(effectiveLandmarks) : undefined);

  // Photo + skeleton compositee (web). Native renvoie l'URL d'origine.
  const [composedImage, setComposedImage] = useState<string | undefined>(effectiveImageUrl);

  useEffect(() => {
    let cancelled = false;
    setComposedImage(effectiveImageUrl);
    if (!effectiveImageUrl || !effectiveLandmarks || !bilateral) return;
    composeSkeletonImage(effectiveImageUrl, effectiveLandmarks, bilateral).then((url) => {
      if (!cancelled) setComposedImage(url);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveImageUrl, effectiveLandmarks, bilateral]);

  const data = useMemo<ResultsData | null>(() => {
    if (!analysis || !patient) return null;
    return buildResultsData(analysis, patientDisplayName(patient), effectiveLandmarks, composedImage);
  }, [analysis, patient, effectiveLandmarks, composedImage]);

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

  // null = angle non mesurable (jamais présenté comme une valeur normale)
  const leftHKA = hkaValueOrNull(bilateral?.leftHKA);
  const rightHKA = hkaValueOrNull(bilateral?.rightHKA);
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
  value: number | null,
  norm: number,
  unit: "°" | "mm",
): AngleMeasurement {
  return { key, label, value, norm, unit };
}

/** Rounded HKA value, or null when the angle could not be measured (0 / non-finite). */
function hkaValueOrNull(value: number | undefined): number | null {
  if (value === undefined || classifyHKA(value) === "unavailable") return null;
  return round(value);
}

function severityFromAnalysis(
  leftHKA: number | null,
  rightHKA: number | null,
): "normal" | "moderate" | "severe" | "unavailable" {
  const deltas = [leftHKA, rightHKA]
    .filter((v): v is number => v !== null)
    .map((v) => Math.abs(180 - v));
  if (deltas.length === 0) return "unavailable";
  const worst = Math.max(...deltas);
  if (worst < 2) return "normal";
  if (worst < 6) return "moderate";
  return "severe";
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatShareText(d: ResultsData): string {
  const fmt = (m: AngleMeasurement): string =>
    m.value === null ? "—" : `${m.value}${m.unit}`;
  const lines = [
    `Patient : ${d.patientName}`,
    `Date : ${d.date}`,
    `Severite : ${d.severity}`,
    `HKA gauche : ${fmt(d.hka.left)}  (norme ${d.hka.left.norm}°)`,
    `HKA droit : ${fmt(d.hka.right)}  (norme ${d.hka.right.norm}°)`,
    "",
    ...d.postural.map((m) => `${m.label} : ${fmt(m)}  (norme ${m.norm}${m.unit})`),
  ];
  return lines.join("\n");
}
