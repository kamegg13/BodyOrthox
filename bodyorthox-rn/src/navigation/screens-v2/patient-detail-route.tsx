import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import {
  PatientDetail,
  type AnalysisHistoryItem,
  type PatientDetailData,
} from "../../screens/PatientDetail";
import { LoadingSpinner } from "../../shared/components/loading-spinner";
import { ErrorWidget } from "../../shared/components/error-widget";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import { patientAge, type Patient } from "../../features/patients/domain/patient";
import type { Analysis } from "../../features/capture/domain/analysis";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "PatientDetail">;

export function PatientDetailRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const patient = usePatientsStore((s) =>
    s.patients.find((p) => p.id === patientId),
  );
  const patientsLoading = usePatientsStore((s) => s.isLoading);
  const patientsCount = usePatientsStore((s) => s.patients.length);
  const repo = useAnalysisRepository();
  const [analyses, setAnalyses] = useState<readonly Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAnalyses(true);
    setError(null);
    repo
      .getForPatient(patientId)
      .then((result) => {
        if (!cancelled) setAnalyses(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoadingAnalyses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, repo]);

  const data = useMemo<PatientDetailData | null>(() => {
    if (!patient) return null;
    return buildDetailData(patient, analyses);
  }, [patient, analyses]);

  const handleBack = useCallback(() => {
    // Sur PatientDetail, le `<` doit toujours revenir a la racine du tab
    // (Accueil dans AnalysesTab, PatientsList dans PatientsTab).
    // popToTop evite la boucle Results <-> PatientDetail.
    const popToTop = (navigation as unknown as { popToTop?: () => void }).popToTop;
    if (typeof popToTop === "function") {
      popToTop.call(navigation);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);
  const handleEdit = useCallback(
    () => navigation.navigate("EditPatient", { patientId }),
    [navigation, patientId],
  );
  const handleCapture = useCallback(
    () => navigation.navigate("Capture", { patientId }),
    [navigation, patientId],
  );
  const handleGeneratePdf = useCallback(() => {
    if (!patient) return;
    if (analyses.length === 0) return;
    const last = [...analyses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!last) return;
    navigation.navigate("Report", { analysis: last, patient });
  }, [navigation, patient, analyses]);
  const handleHistoryPress = useCallback(
    (item: AnalysisHistoryItem) => {
      navigation.navigate("Results", { analysisId: item.id, patientId });
    },
    [navigation, patientId],
  );
  const handleTabPress = useCallback(
    (key: "home" | "patients" | "capture" | "reports" | "settings") => {
      switch (key) {
        case "home":
          navigation.navigate("MainTabs", { screen: "AnalysesTab" });
          return;
        case "patients":
          navigation.navigate("MainTabs", { screen: "PatientsTab" });
          return;
        case "settings":
          navigation.navigate("MainTabs", { screen: "CompteTab" });
          return;
        default:
          return;
      }
    },
    [navigation],
  );

  if (!patient) {
    // Si on attend les patients (initial load), afficher loading plutot que "introuvable"
    if (patientsLoading || patientsCount === 0 || loadingAnalyses) {
      return <LoadingSpinner message="Chargement..." />;
    }
    return (
      <ErrorWidget
        message="Patient introuvable."
        onRetry={() => navigation.goBack()}
      />
    );
  }
  if (error && !data) {
    return <ErrorWidget message={error} onRetry={() => navigation.goBack()} />;
  }
  if (!data) return <LoadingSpinner message="Chargement…" />;

  return (
    <PatientDetail
      data={data}
      hideBottomTab
      onBack={handleBack}
      onEdit={handleEdit}
      onCapture={handleCapture}
      onGeneratePdf={handleGeneratePdf}
      onHistoryPress={handleHistoryPress}
      onTabPress={handleTabPress}
    />
  );
}

function buildDetailData(patient: Patient, analyses: readonly Analysis[]): PatientDetailData {
  const sex: "F" | "M" | "X" =
    patient.morphologicalProfile?.sex === "female"
      ? "F"
      : patient.morphologicalProfile?.sex === "male"
      ? "M"
      : "X";
  const archived = Boolean(patient.archivedAt);
  const pains = patient.morphologicalProfile?.pains?.length ?? 0;
  const status: PatientDetailData["status"] = archived
    ? { label: "Archivé", color: "amber" }
    : pains > 0
    ? { label: "Suivi", color: "amber" }
    : { label: "Actif", color: "teal" };

  const dob = formatShortDob(patient.dateOfBirth);
  const id = shortId(patient.id);
  const diagnosisDescription =
    patient.morphologicalProfile?.pathology?.trim() ||
    patient.morphologicalProfile?.notes?.trim() ||
    "Aucun diagnostic renseigné.";

  return {
    name: patient.name,
    sex,
    age: patientAge(patient),
    id,
    status,
    heightCm: patient.morphologicalProfile?.heightCm ?? 0,
    weightKg: patient.morphologicalProfile?.weightKg ?? 0,
    dob,
    diagnosisLabel: "Diagnostic principal",
    diagnosisDescription,
    history: buildHistory(analyses),
  };
}

function buildHistory(analyses: readonly Analysis[]): readonly AnalysisHistoryItem[] {
  return [...analyses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map<AnalysisHistoryItem>((a) => {
      const dateLabel = formatShortDate(a.createdAt);
      const ba = a.bilateralAngles;
      const hka =
        ba && ba.leftHKA && ba.rightHKA
          ? `${Math.round(ba.leftHKA)}° / ${Math.round(ba.rightHKA)}°`
          : undefined;
      const sev = severityFromAnalysis(a);
      return {
        id: a.id,
        date: dateLabel,
        type: "Posture · analyse complète",
        ...(hka ? { hka } : {}),
        severity: sev,
      };
    });
}

function severityFromAnalysis(a: Analysis): "normal" | "moderate" | "severe" {
  const ba = a.bilateralAngles;
  if (!ba) return "normal";
  const worstDelta = Math.max(
    Math.abs(180 - ba.leftHKA),
    Math.abs(180 - ba.rightHKA),
  );
  if (worstDelta < 2) return "normal";
  if (worstDelta < 6) return "moderate";
  return "severe";
}

function formatShortDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortId(id: string): string {
  if (id.length <= 8) return id;
  return `P-${id.slice(0, 4).toUpperCase()}`;
}
