/**
 * Droit à l'effacement (RGPD art. 17) — voir data-erasure.ts.
 *
 * L'atomicité réelle (rollback) est couverte au niveau de chaque backend
 * (database-native.test.ts, database-web.test.ts) ; ici on vérifie que le
 * service délègue bien à `db.transaction()` dans le bon ordre et propage les
 * erreurs sans les avaler.
 */
import { deleteAllData } from "../data-erasure";
import { IDatabase, ITransaction, QueryResult } from "../database";

function createMockDb(
  transactionImpl: (fn: (tx: ITransaction) => Promise<void>) => Promise<void>,
): IDatabase {
  return {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn(),
    transaction: jest.fn(transactionImpl),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe("deleteAllData", () => {
  it("supprime les analyses puis les patients dans une seule transaction", async () => {
    const calls: string[] = [];
    const txExecute = jest.fn(async (sql: string): Promise<QueryResult> => {
      calls.push(sql);
      return { rows: [], rowsAffected: 0 };
    });
    const db = createMockDb(async (fn) => {
      await fn({ execute: txExecute });
    });

    await deleteAllData(db);

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      "DELETE FROM analyses",
      "DELETE FROM patients",
    ]);
  });

  it("propage l'erreur sans l'avaler quand la transaction échoue (rollback en amont)", async () => {
    const db = createMockDb(async () => {
      throw new Error("échec suppression analyses");
    });

    await expect(deleteAllData(db)).rejects.toThrow(
      "échec suppression analyses",
    );
  });
});
