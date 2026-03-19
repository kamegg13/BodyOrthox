import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Analysis } from "../../capture/domain/analysis";
import { Patient } from "../../patients/domain/patient";
import {
  buildReportData,
  generateReportHtml,
  generateReportFileName,
  ReportData,
} from "../domain/report-generator";

// ─── Types ────────────────────────────────────────────────────

export type ReportStatus = "idle" | "generating" | "ready" | "error";

interface ReportState {
  status: ReportStatus;
  reportData: ReportData | null;
  reportHtml: string | null;
  fileName: string | null;
  errorMessage: string | null;
}

interface ReportActions {
  generateReport(analysis: Analysis, patient: Patient): void;
  reset(): void;
}

// ─── Store ────────────────────────────────────────────────────

export const useReportStore = create<ReportState & ReportActions>()(
  immer((set) => ({
    status: "idle",
    reportData: null,
    reportHtml: null,
    fileName: null,
    errorMessage: null,

    generateReport(analysis: Analysis, patient: Patient) {
      set((state) => {
        state.status = "generating";
        state.errorMessage = null;
      });

      try {
        const data = buildReportData(analysis, patient);
        const html = generateReportHtml(data);
        const fileName = generateReportFileName(
          patient.name,
          analysis.createdAt,
        );

        set((state) => {
          state.status = "ready";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          state.reportData = data as any;
          state.reportHtml = html;
          state.fileName = fileName;
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de la generation du rapport";
        set((state) => {
          state.status = "error";
          state.errorMessage = message;
        });
      }
    },

    reset() {
      set((state) => {
        state.status = "idle";
        state.reportData = null;
        state.reportHtml = null;
        state.fileName = null;
        state.errorMessage = null;
      });
    },
  })),
);
