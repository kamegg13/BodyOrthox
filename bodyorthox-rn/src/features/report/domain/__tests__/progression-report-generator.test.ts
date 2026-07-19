import {
  buildProgressionPreviewRows,
  buildProgressionSynthesisSummary,
  generateProgressionReportHtml,
  buildProgressionReportData,
} from "../progression-report-generator";
import { Analysis } from "../../../capture/domain/analysis";
import { Patient } from "../../../patients/domain/patient";

const mockPatient: Patient = {
  id: "patient-1",
  name: "Jean Dupont",
  dateOfBirth: "1985-06-15",
  morphologicalProfile: null,
  createdAt: "2026-03-19T10:00:00.000Z",
};

function makeAnalysis(overrides: Partial<Analysis> & Pick<Analysis, "id" | "createdAt">): Analysis {
  return {
    patientId: "patient-1",
    angles: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
    confidenceScore: 0.9,
    manualCorrectionApplied: false,
    manualCorrectionJoint: null,
    ...overrides,
  };
}

describe("buildProgressionPreviewRows — données réelles, jamais interpolées", () => {
  it("expose la mesure HKA réelle de chaque analyse et null pour une séance sans mesure bilatérale", () => {
    const analyses: Analysis[] = [
      makeAnalysis({ id: "a1", createdAt: "2026-01-01T00:00:00.000Z", bilateralAngles: undefined }),
      makeAnalysis({
        id: "a2",
        createdAt: "2026-02-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 173.2,
          rightHKA: 178.5,
        },
      }),
    ];

    const rows = buildProgressionPreviewRows(analyses);

    expect(rows[0].leftHKA).toBeNull();
    expect(rows[0].rightHKA).toBeNull();
    expect(rows[1].leftHKA).toBe(173.2);
    expect(rows[1].rightHKA).toBe(178.5);
  });

  it("ne calcule jamais de delta contre une valeur indisponible", () => {
    const analyses: Analysis[] = [
      makeAnalysis({ id: "a1", createdAt: "2026-01-01T00:00:00.000Z", bilateralAngles: undefined }),
      makeAnalysis({
        id: "a2",
        createdAt: "2026-02-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 173.2,
          rightHKA: 178.5,
        },
      }),
    ];

    const rows = buildProgressionPreviewRows(analyses);

    // Pas de séance précédente exploitable pour a2 (a1 est indisponible)
    expect(rows[1].leftDelta).toBeNull();
    expect(rows[1].rightDelta).toBeNull();
  });

  it("calcule un delta réel entre deux séances mesurées", () => {
    const analyses: Analysis[] = [
      makeAnalysis({
        id: "a1",
        createdAt: "2026-01-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 173.0,
          rightHKA: 176.0,
        },
      }),
      makeAnalysis({
        id: "a2",
        createdAt: "2026-02-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 175.5,
          rightHKA: 177.2,
        },
      }),
    ];

    const rows = buildProgressionPreviewRows(analyses);

    expect(rows[1].leftDelta).toBeCloseTo(2.5);
    expect(rows[1].rightDelta).toBeCloseTo(1.2);
  });
});

describe("buildProgressionSynthesisSummary — synthèse honnête", () => {
  it("n'est pas disponible avec une seule analyse sélectionnée", () => {
    const analyses: Analysis[] = [
      makeAnalysis({ id: "a1", createdAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(buildProgressionSynthesisSummary(analyses).available).toBe(false);
  });

  it("n'est pas disponible quand aucune des deux séances n'a de mesure HKA", () => {
    const analyses: Analysis[] = [
      makeAnalysis({ id: "a1", createdAt: "2026-01-01T00:00:00.000Z", bilateralAngles: undefined }),
      makeAnalysis({ id: "a2", createdAt: "2026-02-01T00:00:00.000Z", bilateralAngles: undefined }),
    ];
    expect(buildProgressionSynthesisSummary(analyses).available).toBe(false);
  });

  it("calcule la même tendance textuelle que celle utilisée dans le HTML exporté", () => {
    const analyses: Analysis[] = [
      makeAnalysis({
        id: "a1",
        createdAt: "2026-01-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 173.0,
          rightHKA: 176.0,
        },
      }),
      makeAnalysis({
        id: "a2",
        createdAt: "2026-02-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 175.5,
          rightHKA: 177.2,
        },
      }),
    ];

    const summary = buildProgressionSynthesisSummary(analyses);
    expect(summary.available).toBe(true);
    expect(summary.leftTrendText).toContain("173.0°");
    expect(summary.leftTrendText).toContain("175.5°");

    const data = buildProgressionReportData(mockPatient, analyses);
    const html = generateProgressionReportHtml(data);
    expect(html).toContain(summary.leftTrendText);
    expect(html).toContain(summary.rightTrendText);
  });

  // ── Test anti-dérive : aperçu écran et export PDF partagent UN SEUL
  // calcul (computeSynthesis) — ce test échouerait si l'un des deux
  // rendus recalculait first/last/trend indépendamment de l'autre.
  it("reste cohérente avec le PDF même quand une seule des deux jambes a une mesure exploitable", () => {
    const analyses: Analysis[] = [
      makeAnalysis({
        id: "a1",
        createdAt: "2026-01-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 172.0,
          rightHKA: 0,
        },
      }),
      makeAnalysis({
        id: "a2",
        createdAt: "2026-02-01T00:00:00.000Z",
        bilateralAngles: {
          left: { kneeAngle: 176, hipAngle: 175, ankleAngle: 174 },
          right: { kneeAngle: 177, hipAngle: 176, ankleAngle: 175 },
          leftHKA: 174.5,
          rightHKA: 0,
        },
      }),
    ];

    const summary = buildProgressionSynthesisSummary(analyses);
    expect(summary.available).toBe(true);
    expect(summary.leftTrendText).toBeDefined();
    expect(summary.rightTrendText).toBeUndefined();

    const data = buildProgressionReportData(mockPatient, analyses);
    const html = generateProgressionReportHtml(data);
    expect(html).toContain(summary.leftTrendText);
    expect(html).toContain("HKA Gauche");
    expect(html).not.toContain("HKA Droite</strong>");
  });
});
