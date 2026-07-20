import { IDatabase } from "./database";

/**
 * Droit à l'effacement (RGPD art. 17) — supprime TOUTES les données locales
 * (analyses puis patients). Passe par `IDatabase.transaction()` pour que
 * l'opération soit atomique sur natif (rollback SQLite réel) comme sur web
 * (rollback simulé, voir database.web.ts) : un crash entre les deux DELETE
 * ne doit jamais laisser une suppression partielle silencieuse.
 */
export async function deleteAllData(db: IDatabase): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute("DELETE FROM analyses");
    await tx.execute("DELETE FROM patients");
  });
}
