import { buildExportPayload, exportFileName } from "../data-export";
import type { Patient } from "../../../patients/domain/patient";
import type { Analysis } from "../../../capture/domain/analysis";
import type { IPatientRepository } from "../../../patients/data/patient-repository";
import type { IAnalysisRepository } from "../../../capture/data/analysis-repository";

const patientA = { id: "p1", name: "Jean Dupont" } as unknown as Patient;
const patientB = { id: "p2", displayLabel: "Sophie L." } as unknown as Patient;

const analysisA1 = { id: "a1", patientId: "p1" } as unknown as Analysis;
const analysisA2 = { id: "a2", patientId: "p1" } as unknown as Analysis;

function makePatientRepo(patients: Patient[]): IPatientRepository {
  return {
    getAll: jest.fn().mockResolvedValue(patients),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    delete: jest.fn(),
  };
}

function makeAnalysisRepo(byPatient: Record<string, Analysis[]>): IAnalysisRepository {
  return {
    getForPatient: jest.fn((id: string) => Promise.resolve(byPatient[id] ?? [])),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as IAnalysisRepository;
}

describe("buildExportPayload", () => {
  it("exporte tous les patients avec leurs analyses", async () => {
    const payload = await buildExportPayload(
      makePatientRepo([patientA, patientB]),
      makeAnalysisRepo({ p1: [analysisA1, analysisA2] }),
      "2026-07-19T10:00:00.000Z",
    );

    expect(payload.exportVersion).toBe(1);
    expect(payload.exportedAt).toBe("2026-07-19T10:00:00.000Z");
    expect(payload.patients).toHaveLength(2);
    expect(payload.patients[0]).toEqual({
      patient: patientA,
      analyses: [analysisA1, analysisA2],
    });
    expect(payload.patients[1]).toEqual({ patient: patientB, analyses: [] });
  });

  it("produit un export vide mais valide sans patients", async () => {
    const payload = await buildExportPayload(
      makePatientRepo([]),
      makeAnalysisRepo({}),
      "2026-07-19T10:00:00.000Z",
    );

    expect(payload.patients).toEqual([]);
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});

describe("exportFileName", () => {
  it("date le fichier au jour de l'export", () => {
    expect(exportFileName("2026-07-19T10:00:00.000Z")).toBe(
      "bodyorthox-export-2026-07-19.json",
    );
  });
});
