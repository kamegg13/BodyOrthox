import { useMemo } from "react";
import { ApiAnalysisRepository } from "../../features/capture/data/api-analysis-repository";
import { IAnalysisRepository } from "../../features/capture/data/analysis-repository";
import { getDevAnalysisRepo, isDevMode } from "../../dev/dev-mode";

export function useAnalysisRepository(): IAnalysisRepository {
  return useMemo(() => {
    if (isDevMode()) {
      const dev = getDevAnalysisRepo();
      if (dev) return dev;
    }
    return new ApiAnalysisRepository();
  }, []);
}
