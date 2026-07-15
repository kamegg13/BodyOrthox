import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import {
  PatientDetail,
  type AnalysisHistoryItem,
  type PatientDetailData,
} from "../../screens/PatientDetail";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { usePatientsStore } from "../../features/patients/store/patients-store";
import { useAnalysisRepository } from "../../shared/hooks/use-analysis-repository";
import {
  patientAge,
  patientDisplayName,
  type Patient,
} from "../../features/patients/domain/patient";
import type { Analysis } from "../../features/capture/domain/analysis";
import { showToast } from "../../shared/toast/toast-store";

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
  const deletePatient = usePatientsStore((s) => s.deletePatient);
  const archivePatient = usePatientsStore((s) => s.archivePatient);
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
    // Sur PatientDetail, le `<` revient toujours à la racine du tab (Accueil
    // dans AnalysesTab, PatientsList dans PatientsTab), quel que soit le
    // point d'entrée sur cette fiche. `popToTop` fait partie de l'API
    // typée du navigateur natif (StackActionHelpers) : pas besoin de cast.
    navigation.popToTop();
  }, [navigation]);
  const handleEdit = useCallback(
    () => navigation.navigate("EditPatient", { patientId }),
    [navigation, patientId],
  );
  const handleCapture = useCallback(() => {
    // Cette fiche est montée dans AnalysesTab OU PatientsTab : on transmet le
    // tab d'origine pour que Processing reconstruise la pile au bon endroit
    // (sinon le retour post-analyse retombait toujours sur Accueil).
    const tabState = navigation.getParent?.()?.getState();
    const tabName = tabState?.routes[tabState.index]?.name;
    const originTab = tabName === "PatientsTab" ? "PatientsTab" : "AnalysesTab";
    navigation.navigate("Capture", { patientId, originTab });
  }, [navigation, patientId]);
  const handleGeneratePdf = useCallback(() => {
    if (!patient) return;
    if (analyses.length === 0) return;
    const last = [...analyses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!last) return;
    navigation.navigate("Report", { analysis: last, patient });
  }, [navigation, patient, analyses]);
  const handleProgressionReport = useCallback(() => {
    if (!patient) return;
    if (analyses.length < 2) return;
    navigation.navigate("ProgressionSelection", { patient, analyses: [...analyses] });
  }, [navigation, patient, analyses]);
  const handleHistoryPress = useCallback(
    (item: AnalysisHistoryItem) => {
      navigation.navigate("Results", { analysisId: item.id, patientId });
    },
    [navigation, patientId],
  );
  const handleDelete = useCallback(async () => {
    await deletePatient(patientId);
    const err = usePatientsStore.getState().error;
    if (err) {
      Alert.alert("Erreur", err);
      return;
    }
    showToast("Patient supprimé", "success");
    navigation.navigate("MainTabs", { screen: "PatientsTab" });
  }, [deletePatient, patientId, navigation]);
  const handleArchive = useCallback(async () => {
    await archivePatient(patientId);
    const err = usePatientsStore.getState().error;
    if (err) {
      Alert.alert("Erreur", err);
      return;
    }
    showToast("Patient archivé", "success");
    navigation.navigate("MainTabs", { screen: "PatientsTab" });
  }, [archivePatient, patientId, navigation]);
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
      return <LoadingState message="Chargement..." />;
    }
    return (
      <ErrorState
        message="Patient introuvable."
        actionLabel="Réessayer"
        onAction={() => navigation.goBack()}
      />
    );
  }
  if (error && !data) {
    return (
      <ErrorState
        message={error}
        actionLabel="Réessayer"
        onAction={() => navigation.goBack()}
      />
    );
  }
  if (!data) return <LoadingState message="Chargement…" />;

  return (
    <PatientDetail
      data={data}
      hideBottomTab
      onBack={handleBack}
      onEdit={handleEdit}
      onCapture={handleCapture}
      onGeneratePdf={handleGeneratePdf}
      onProgressionReport={handleProgressionReport}
      onHistoryPress={handleHistoryPress}
      onTabPress={handleTabPress}
      onArchive={handleArchive}
      onDelete={handleDelete}
    />
  );
}

export function buildDetailData(patient: Patient, analyses: readonly Analysis[]): PatientDetailData {
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

  const dob = patient.dateOfBirth ? formatShortDob(patient.dateOfBirth) : "—";
  const id = shortId(patient.id);
  const diagnosisDescription =
    patient.morphologicalProfile?.pathology?.trim() ||
    patient.morphologicalProfile?.notes?.trim() ||
    "Aucun diagnostic renseigné.";

  return {
    name: patientDisplayName(patient),
    sex,
    age: patientAge(patient) ?? 0,
    id,
    status,
    // null (jamais 0) quand la mesure n'est pas renseignée : afficher
    // « 0 cm » serait une donnée clinique fausse.
    heightCm: patient.morphologicalProfile?.heightCm || null,
    weightKg: patient.morphologicalProfile?.weightKg || null,
    dob,
    diagnosisDescription,
    history: buildHistory(analyses),
    analysisCount: analyses.length,
    ...(patient.referringPhysician ? { referringPhysician: patient.referringPhysician } : {}),
    ...(patient.consentDate ? { consentDate: formatShortDate(patient.consentDate) } : {}),
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
