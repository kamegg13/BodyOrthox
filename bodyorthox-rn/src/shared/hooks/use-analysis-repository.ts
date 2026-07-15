import { IAnalysisRepository } from "../../features/capture/data/analysis-repository";
import { getDevAnalysisRepo, isDevMode } from "../../dev/dev-mode";
import { getWiredAnalysisRepository } from "../../features/capture/store/capture-store";

/**
 * Repository d'analyses partagé par les écrans (Résultats, Timeline, Replay,
 * Rapports, Fiche patient).
 *
 * Retourne l'instance ON-DEVICE câblée par initializeDatabase() — plus
 * d'ApiAnalysisRepository ici : les données de santé ne quittent pas
 * l'appareil (décision 2026-07-15). Fail closed : si la base locale n'est pas
 * initialisée, on lève une erreur explicite plutôt que de retomber en silence
 * sur un transport réseau.
 */
export function useAnalysisRepository(): IAnalysisRepository {
  if (isDevMode()) {
    const dev = getDevAnalysisRepo();
    if (dev) return dev;
  }

  const repo = getWiredAnalysisRepository();
  if (!repo) {
    throw new Error(
      "Repository d'analyses non initialisé — initializeDatabase() n'a pas abouti.",
    );
  }
  return repo;
}
