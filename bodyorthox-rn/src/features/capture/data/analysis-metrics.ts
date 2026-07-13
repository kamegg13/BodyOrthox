import { getDatabase } from "../../../core/database/init";

/**
 * Nombre d'analyses réalisées depuis minuit (heure locale) — métrique du
 * dashboard. `created_at` est stocké en ISO UTC (`toISOString()`), la
 * comparaison lexicographique avec le minuit local converti en UTC est donc
 * exacte. Retourne 0 si la base n'est pas prête (boot, preview web) : une
 * stat vide vaut mieux qu'un crash du dashboard.
 */
export async function countAnalysesToday(now: Date = new Date()): Promise<number> {
  try {
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    const db = getDatabase();
    const result = await db.execute(
      "SELECT COUNT(*) as count FROM analyses WHERE created_at >= ?",
      [midnight.toISOString()],
    );
    return Number(result.rows[0]?.["count"] ?? 0);
  } catch {
    return 0;
  }
}
