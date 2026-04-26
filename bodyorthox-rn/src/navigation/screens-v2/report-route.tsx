import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";
import { Report, type ReportData, type ReportRow } from "../../screens/Report";
import { LoadingSpinner } from "../../shared/components/loading-spinner";
import { ErrorWidget } from "../../shared/components/error-widget";
import { useReportStore } from "../../features/report/store/report-store";
import { shareReport } from "../../features/report/data/share-service";
import { useAuthStore } from "../../core/auth/auth-store";
import { calculateBilateralAngles } from "../../features/capture/data/angle-calculator";
import type { Analysis } from "../../features/capture/domain/analysis";
import type { Patient } from "../../features/patients/domain/patient";

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

  // Génère le HTML du rapport au mount, comme l'écran legacy.
  useEffect(() => {
    reset();
    generateReport(analysis, patient, {});
    return () => reset();
  }, [analysis, patient, generateReport, reset]);

  const data = useMemo<ReportData>(
    () => buildReportData(analysis, patient, user),
    [analysis, patient, user],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleShare = useCallback(async () => {
    if (!reportHtml || !fileName) return;
    await shareReport(reportHtml, fileName);
  }, [reportHtml, fileName]);

  const handleDownload = useCallback(async () => {
    if (!reportHtml || !fileName) return;
    await shareReport(reportHtml, fileName);
  }, [reportHtml, fileName]);

  const handleSend = handleShare;

  if (status === "generating") {
    return <LoadingSpinner fullScreen message="Génération du rapport..." />;
  }
  if (status === "error" && errorMessage) {
    return (
      <ErrorWidget
        message={errorMessage}
        onRetry={() => generateReport(analysis, patient, {})}
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
): ReportData {
  const date = new Date(analysis.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const bilateral =
    analysis.bilateralAngles ??
    (analysis.allLandmarks ? calculateBilateralAngles(analysis.allLandmarks) : null);

  const leftHKA = round(bilateral?.leftHKA ?? 180);
  const rightHKA = round(bilateral?.rightHKA ?? 180);

  const rows: readonly ReportRow[] = [
    buildRow("HKA gauche", leftHKA, 180, "°"),
    buildRow("HKA droit", rightHKA, 180, "°"),
    buildRow("Hanche", round(analysis.angles.hipAngle), 0, "°"),
    buildRow("Genou", round(analysis.angles.kneeAngle), 0, "°"),
    buildRow("Cheville", round(analysis.angles.ankleAngle), 0, "°"),
  ];

  const severity = severityFrom(leftHKA, rightHKA);
  const sevColor = severity === "normal" ? "green" : severity === "moderate" ? "amber" : "red";
  const sevLabel = severity === "normal" ? "Normal" : severity === "moderate" ? "Modéré" : "Sévère";

  const practitioner = formatPractitioner(user);
  const practitionerId = "—";
  const number = formatReportNumber(analysis, patient);

  return {
    number,
    title: "Rapport d’analyse posturale",
    patientName: patient.name,
    date,
    practitioner,
    practitionerId,
    severityLabel: sevLabel,
    severityColor: sevColor,
    rows,
  };
}

function buildRow(label: string, value: number, norm: number, unit: "°" | "mm"): ReportRow {
  const delta = round(value - norm);
  const sev = severityFromDelta(delta);
  const sign = delta >= 0 ? "+" : "";
  return {
    label,
    value: `${value}${unit}`,
    norm: `${norm}${unit}`,
    delta: `${sign}${delta}${unit}`,
    severity: sev,
  };
}

function severityFromDelta(delta: number): "normal" | "moderate" | "severe" {
  const a = Math.abs(delta);
  if (a < 2) return "normal";
  if (a < 6) return "moderate";
  return "severe";
}

function severityFrom(leftHKA: number, rightHKA: number): "normal" | "moderate" | "severe" {
  const worst = Math.max(Math.abs(180 - leftHKA), Math.abs(180 - rightHKA));
  if (worst < 2) return "normal";
  if (worst < 6) return "moderate";
  return "severe";
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
