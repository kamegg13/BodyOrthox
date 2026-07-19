import React, { useCallback, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { Report, type ReportData, type ReportRow } from "../../screens/Report";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { useReportStore } from "../../features/report/store/report-store";
import {
  downloadReport,
  shareReport,
} from "../../features/report/data/share-service";
import { confirmPrivacyBeforeShare } from "../../features/report/data/privacy-confirm";
import { useAuthStore } from "../../core/auth/auth-store";
import { calculateBilateralAngles, classifyHKA } from "../../features/capture/data/angle-calculator";
import {
  HKA_REF_MAX,
  HKA_REF_MIN,
  hkaRangeLabel,
  hkaRangeStatus,
} from "../../shared/domain/hka-range";
import type { Analysis } from "../../features/capture/domain/analysis";
import {
  patientDisplayName,
  type Patient,
} from "../../features/patients/domain/patient";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Report">;

export function ReportRoute() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { analysis, patient } = params;
  const user = useAuthStore((s) => s.user);

  const status = useReportStore((s) => s.status);
  const reportHtml = useReportStore((s) => s.reportHtml);
  const fileName = useReportStore((s) => s.fileName);
  const errorMessage = useReportStore((s) => s.errorMessage);
  const generateReport = useReportStore((s) => s.generateReport);
  const reset = useReportStore((s) => s.reset);

  // Photo BRUTE : le squelette n'est plus incrusté (canvas web-only) mais
  // superposé — SVG dans le HTML du PDF, PhotoSkeletonOverlay en preview.
  // Même mécanisme sur web et natif.
  const photoBase64 = analysis.capturedImageUrl;

  // Les notes cliniques du praticien (Résultats) sont reprises telles
  // quelles — le PDF remis au patient doit contenir la même conclusion
  // clinique.
  useEffect(() => {
    reset();
    generateReport(analysis, patient, {
      ...(photoBase64 ? { photoBase64 } : {}),
      ...(analysis.clinicalNotes ? { notes: analysis.clinicalNotes } : {}),
    });
    return () => reset();
  }, [analysis, patient, photoBase64, generateReport, reset]);


  const data = useMemo<ReportData>(
    () => buildReportData(analysis, patient, user, photoBase64),
    [analysis, patient, user, photoBase64],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  // « Partager » et « Envoyer » ouvrent tous deux le share sheet OS (seul
  // mécanisme d'envoi disponible dans l'app — pas de canal email/SMS dédié) :
  // ils partagent la même logique (avertissement confidentialité + PDF réel)
  // mais restent deux callbacks distincts pour rester alignés sur l'intention
  // de chaque bouton.
  const shareViaSheet = useCallback(
    async (errorTitle: string) => {
      if (!reportHtml || !fileName) return;
      const confirmed = await confirmPrivacyBeforeShare();
      if (!confirmed) return;
      const result = await shareReport(reportHtml, fileName);
      if (result.kind === "error") {
        Alert.alert(errorTitle, result.message);
      }
    },
    [reportHtml, fileName],
  );

  const handleShare = useCallback(
    () => shareViaSheet("Partage impossible"),
    [shareViaSheet],
  );
  const handleSend = useCallback(
    () => shareViaSheet("Envoi impossible"),
    [shareViaSheet],
  );

  // « Télécharger PDF » sauvegarde le fichier localement, sans share sheet :
  // pas d'avertissement de confidentialité (aucun destinataire tiers), mais
  // confirmation de l'emplacement une fois l'enregistrement terminé.
  const handleDownload = useCallback(async () => {
    if (!reportHtml || !fileName) return;
    const result = await downloadReport(reportHtml, fileName);
    if (result.kind === "downloaded") {
      Alert.alert(
        "PDF enregistré",
        `Le rapport a été enregistré : ${result.filePath}`,
      );
    } else {
      Alert.alert("Échec de l'enregistrement", result.message);
    }
  }, [reportHtml, fileName]);

  if (status === "generating") {
    return <LoadingState fullScreen message="Génération du rapport..." />;
  }
  if (status === "error" && errorMessage) {
    return (
      <ErrorState
        message={errorMessage}
        actionLabel="Réessayer"
        onAction={() =>
          generateReport(
            analysis,
            patient,
            analysis.clinicalNotes ? { notes: analysis.clinicalNotes } : {},
          )
        }
      />
    );
  }

  return (
    <Report
      data={data}
      onBack={handleBack}
      onShare={handleShare}
      onDownload={handleDownload}
      onSend={handleSend}
    />
  );
}

function buildReportData(
  analysis: Analysis,
  patient: Patient,
  user: { firstName?: string; lastName?: string; email: string } | null,
  capturedImageUrl?: string,
): ReportData {
  const date = new Date(analysis.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const bilateral =
    analysis.bilateralAngles ??
    (analysis.allLandmarks ? calculateBilateralAngles(analysis.allLandmarks) : null);

  // null = angle non mesurable (jamais présenté comme une valeur normale)
  const leftHKA = hkaValueOrNull(bilateral?.leftHKA);
  const rightHKA = hkaValueOrNull(bilateral?.rightHKA);

  const rows: readonly ReportRow[] = [
    buildHkaRow("HKA gauche", leftHKA),
    buildHkaRow("HKA droit", rightHKA),
    buildRow("Hanche", round(analysis.angles.hipAngle), 0, "°"),
    buildRow("Genou", round(analysis.angles.kneeAngle), 0, "°"),
    buildRow("Cheville", round(analysis.angles.ankleAngle), 0, "°"),
  ];

  const skeleton =
    capturedImageUrl && analysis.allLandmarks
      ? {
          landmarks: analysis.allLandmarks,
          allLandmarks: analysis.allLandmarks,
          ...(bilateral ? { bilateralAngles: bilateral } : {}),
        }
      : undefined;

  // Position factuelle par rapport à la plage de référence — aucune
  // classification de gravité (positionnement non-DM).
  const rangeLabel = hkaRangeLabel(hkaRangeStatus(leftHKA, rightHKA));

  const practitioner = formatPractitioner(user);
  const practitionerId = "—";
  const number = formatReportNumber(analysis, patient);

  return {
    number,
    title: "Rapport d’analyse posturale",
    patientName: patientDisplayName(patient),
    date,
    practitioner,
    practitionerId,
    rangeLabel,
    rows,
    confidenceScore: analysis.confidenceScore,
    ...(capturedImageUrl ? { capturedImageUrl } : {}),
    ...(skeleton ? { skeleton } : {}),
    ...(analysis.clinicalNotes ? { clinicalNotes: analysis.clinicalNotes } : {}),
  };
}

function buildRow(label: string, value: number, norm: number, unit: "°" | "mm"): ReportRow {
  const delta = round(value - norm);
  const sign = delta >= 0 ? "+" : "";
  return {
    label,
    value: `${value}${unit}`,
    norm: `${norm}${unit}`,
    delta: `${sign}${delta}${unit}`,
    status: "measured",
  };
}

/** HKA row that shows "—" instead of a fabricated value when unmeasured. */
function buildHkaRow(label: string, value: number | null): ReportRow {
  if (value === null) {
    return {
      label,
      value: "—",
      norm: "180°",
      delta: "—",
      status: "unavailable",
      angleValue: null,
      angleRefMin: HKA_REF_MIN,
      angleRefMax: HKA_REF_MAX,
    };
  }
  return {
    ...buildRow(label, value, 180, "°"),
    angleValue: value,
    angleRefMin: HKA_REF_MIN,
    angleRefMax: HKA_REF_MAX,
  };
}

/** Rounded HKA value, or null when the angle could not be measured (0 / non-finite). */
function hkaValueOrNull(value: number | undefined): number | null {
  if (value === undefined || classifyHKA(value) === "unavailable") return null;
  return round(value);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatPractitioner(
  user: { firstName?: string; lastName?: string; email: string } | null,
): string {
  if (!user) return "Praticien";
  if (user.firstName || user.lastName) {
    return `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(" ")}`;
  }
  return `Dr. ${user.email.split("@")[0] ?? ""}`.trim();
}

function formatReportNumber(analysis: Analysis, patient: Patient): string {
  const year = new Date(analysis.createdAt).getFullYear();
  const idShort = (patient.id.replace(/-/g, "").slice(0, 4) || "0000").toUpperCase();
  const seq = analysis.id.replace(/-/g, "").slice(0, 2).toUpperCase();
  return `RPT-${year}-${idShort}-${seq}`;
}
