/**
 * Le hook doit retourner le repository d'analyses ON-DEVICE câblé par
 * initializeDatabase() (store capture) — plus jamais d'ApiAnalysisRepository :
 * les données de santé ne quittent pas l'appareil (décision 2026-07-15).
 */
import { renderHook } from "@testing-library/react-native";

jest.mock("../../../dev/dev-mode", () => ({
  isDevMode: () => false,
  getDevAnalysisRepo: () => null,
}));

import { useAnalysisRepository } from "../use-analysis-repository";
import { useCaptureStore } from "../../../features/capture/store/capture-store";
import { IAnalysisRepository } from "../../../features/capture/data/analysis-repository";

const fakeRepo: IAnalysisRepository = {
  getForPatient: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as IAnalysisRepository;

describe("useAnalysisRepository", () => {
  // Ce cas doit passer AVANT tout setRepository : le repository du store
  // capture est un état de module, non réinitialisable entre tests.
  it("jette une erreur explicite quand aucun repository n'est câblé (fail closed)", () => {
    expect(() => renderHook(() => useAnalysisRepository())).toThrow(
      /non initialisé/i,
    );
  });

  it("retourne le repository câblé par initializeDatabase (store capture)", () => {
    useCaptureStore.getState().setRepository(fakeRepo);

    const { result } = renderHook(() => useAnalysisRepository());

    expect(result.current).toBe(fakeRepo);
  });

  it("retourne la même instance à chaque re-render", () => {
    useCaptureStore.getState().setRepository(fakeRepo);
    const { result, rerender } = renderHook(() => useAnalysisRepository());
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });
});
