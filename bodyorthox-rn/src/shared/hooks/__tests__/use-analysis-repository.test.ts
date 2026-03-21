import { renderHook } from "@testing-library/react-native";

const mockDb = { execute: jest.fn(), initialize: jest.fn() };

jest.mock("../../../core/database/init", () => ({
  getDatabase: () => mockDb,
}));

jest.mock("../../../features/capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation((db: unknown) => ({
    _db: db,
    getForPatient: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));

import { useAnalysisRepository } from "../use-analysis-repository";
import { SqliteAnalysisRepository } from "../../../features/capture/data/sqlite-analysis-repository";

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

  it("creates SqliteAnalysisRepository with the database instance", () => {
    renderHook(() => useAnalysisRepository());
    expect(SqliteAnalysisRepository).toHaveBeenCalledWith(mockDb);
  });

  it("returns the same instance on re-render (memoized)", () => {
    const { result, rerender } = renderHook(() => useAnalysisRepository());
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });

  it("creates SqliteAnalysisRepository only once across re-renders", () => {
    const { rerender } = renderHook(() => useAnalysisRepository());
    rerender({});
    rerender({});
    expect(SqliteAnalysisRepository).toHaveBeenCalledTimes(1);
  });
});
