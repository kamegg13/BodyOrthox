import { useMemo } from "react";
import { ApiAnalysisRepository } from "../../features/capture/data/api-analysis-repository";
import { IAnalysisRepository } from "../../features/capture/data/analysis-repository";

export function useAnalysisRepository(): IAnalysisRepository {
  return useMemo(() => new ApiAnalysisRepository(), []);
}
