import { renderHook } from "@testing-library/react-native";

jest.mock("../../../dev/dev-mode", () => ({
  isDevMode: () => false,
  getDevAnalysisRepo: () => null,
}));

import { useAnalysisRepository } from "../use-analysis-repository";
import { ApiAnalysisRepository } from "../../../features/capture/data/api-analysis-repository";

describe("useAnalysisRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an IAnalysisRepository instance", () => {
    const { result } = renderHook(() => useAnalysisRepository());
    expect(result.current).toBeDefined();
    expect(result.current.getForPatient).toBeDefined();
    expect(result.current.getById).toBeDefined();
    expect(result.current.create).toBeDefined();
    expect(result.current.update).toBeDefined();
    expect(result.current.delete).toBeDefined();
  });

  it("returns an ApiAnalysisRepository instance outside dev mode", () => {
    const { result } = renderHook(() => useAnalysisRepository());
    expect(result.current).toBeInstanceOf(ApiAnalysisRepository);
  });

  it("returns the same instance on re-render (memoized)", () => {
    const { result, rerender } = renderHook(() => useAnalysisRepository());
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });

  it("does not recreate the repository across re-renders", () => {
    const { result, rerender } = renderHook(() => useAnalysisRepository());
    const first = result.current;
    rerender({});
    rerender({});
    expect(result.current).toBe(first);
  });
});
