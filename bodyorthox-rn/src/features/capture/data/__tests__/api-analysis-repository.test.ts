import { ApiAnalysisRepository } from "../api-analysis-repository";
import { apiRequest } from "../../../../core/api/api-client";

jest.mock("../../../../core/api/api-client");
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const apiAnalysis = {
  id: "a1",
  patientId: "p1",
  hkaLeft: 176.2,
  hkaRight: 177.5,
  landmarksJson: null,
  bilateralAnglesJson: null,
  analyzedAt: "2026-03-19T14:30:00.000Z",
  createdAt: "2026-03-19T14:30:00.000Z",
  confidenceScore: 0.92,
  kneeAngle: 176.2,
  hipAngle: 175.0,
  ankleAngle: 174.5,
  mlCorrected: false,
  manualCorrectionJoint: null,
  clinicalNotes: null,
};

describe("ApiAnalysisRepository — clinicalNotes", () => {
  let repo: ApiAnalysisRepository;

  beforeEach(() => {
    repo = new ApiAnalysisRepository();
    jest.clearAllMocks();
  });

  it("maps clinicalNotes from the API response", async () => {
    mockApiRequest.mockResolvedValue({
      ...apiAnalysis,
      clinicalNotes: "Suivi recommandé dans 3 mois.",
    });

    const analysis = await repo.getById("a1");

    expect(analysis?.clinicalNotes).toBe("Suivi recommandé dans 3 mois.");
  });

  it("leaves clinicalNotes undefined when the API returns null", async () => {
    mockApiRequest.mockResolvedValue({ ...apiAnalysis, clinicalNotes: null });

    const analysis = await repo.getById("a1");

    expect(analysis?.clinicalNotes).toBeUndefined();
  });

  it("sends a trimmed clinicalNotes on create", async () => {
    mockApiRequest.mockResolvedValue(apiAnalysis);

    await repo.create({
      patientId: "p1",
      angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
      confidenceScore: 0.92,
      clinicalNotes: "  Observation initiale.  ",
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/patients/p1/analyses",
      expect.objectContaining({
        body: expect.stringContaining('"clinicalNotes":"Observation initiale."'),
      }),
    );
  });

  it("sends null clinicalNotes on create when omitted", async () => {
    mockApiRequest.mockResolvedValue(apiAnalysis);

    await repo.create({
      patientId: "p1",
      angles: { kneeAngle: 176.2, hipAngle: 175.0, ankleAngle: 174.5 },
      confidenceScore: 0.92,
    });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/patients/p1/analyses",
      expect.objectContaining({
        body: expect.stringContaining('"clinicalNotes":null'),
      }),
    );
  });

  it("PATCHes clinicalNotes when provided in an update", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    await repo.update("a1", { clinicalNotes: "Nouvelle note." });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/analyses/a1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"clinicalNotes":"Nouvelle note."'),
      }),
    );
  });

  it("clears clinicalNotes to null on update when set to a blank string", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    await repo.update("a1", { clinicalNotes: "   " });

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/analyses/a1",
      expect.objectContaining({
        body: expect.stringContaining('"clinicalNotes":null'),
      }),
    );
  });

  it("omits clinicalNotes from the PATCH body when not part of the partial update", async () => {
    mockApiRequest.mockResolvedValue(undefined);

    await repo.update("a1", { manualCorrectionApplied: true });

    const call = mockApiRequest.mock.calls.find((c) => c[0] === "/analyses/a1");
    const body = JSON.parse((call?.[1] as { body: string }).body);
    expect(body).not.toHaveProperty("clinicalNotes");
  });
});
