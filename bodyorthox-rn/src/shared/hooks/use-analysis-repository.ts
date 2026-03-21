import { useMemo } from "react";
import { getDatabase } from "../../core/database/init";
import { SqliteAnalysisRepository } from "../../features/capture/data/sqlite-analysis-repository";
import { IAnalysisRepository } from "../../features/capture/data/analysis-repository";

export function useAnalysisRepository(): IAnalysisRepository {
  return useMemo(() => {
    const db = getDatabase();
    return new SqliteAnalysisRepository(db);
  }, []);
}
