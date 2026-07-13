jest.mock("../../../../core/database/init", () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from "../../../../core/database/init";
import { countAnalysesToday } from "../analysis-metrics";

const mockGetDatabase = getDatabase as jest.Mock;

describe("countAnalysesToday", () => {
  it("compte les analyses créées depuis minuit (heure locale)", async () => {
    const execute = jest.fn().mockResolvedValue({ rows: [{ count: 3 }] });
    mockGetDatabase.mockReturnValue({ execute });

    const now = new Date("2026-07-13T15:30:00");
    await expect(countAnalysesToday(now)).resolves.toBe(3);

    const [sql, params] = execute.mock.calls[0];
    expect(sql).toMatch(/SELECT COUNT\(\*\)/i);
    expect(sql).toMatch(/created_at >= \?/);
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    expect(params).toEqual([midnight.toISOString()]);
  });

  it("retourne 0 quand la base n'est pas prête (boot, preview web)", async () => {
    mockGetDatabase.mockImplementation(() => {
      throw new Error("Database not initialized");
    });
    await expect(countAnalysesToday()).resolves.toBe(0);
  });

  it("retourne 0 quand la requête échoue", async () => {
    mockGetDatabase.mockReturnValue({
      execute: jest.fn().mockRejectedValue(new Error("SQL error")),
    });
    await expect(countAnalysesToday()).resolves.toBe(0);
  });
});
