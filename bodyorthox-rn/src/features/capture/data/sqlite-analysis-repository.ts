import { IDatabase } from "../../../core/database/database";
import {
  Analysis,
  CreateAnalysisInput,
  createAnalysis,
} from "../domain/analysis";
import { IAnalysisRepository } from "./analysis-repository";

interface AnalysisRow {
  id: string;
  patient_id: string;
  knee_angle: number;
  hip_angle: number;
  ankle_angle: number;
  confidence_score: number;
  ml_corrected: number;
  manual_correction_joint: string | null;
  created_at: string;
}

function rowToAnalysis(row: Record<string, unknown>): Analysis {
  const r = row as unknown as AnalysisRow;
  return {
    id: r.id,
    patientId: r.patient_id,
    createdAt: r.created_at,
    angles: {
      kneeAngle: r.knee_angle,
      hipAngle: r.hip_angle,
      ankleAngle: r.ankle_angle,
    },
    confidenceScore: r.confidence_score,
    manualCorrectionApplied: r.ml_corrected === 1,
    manualCorrectionJoint:
      (r.manual_correction_joint as Analysis["manualCorrectionJoint"]) ?? null,
  };
}

export class SqliteAnalysisRepository implements IAnalysisRepository {
  constructor(private readonly db: IDatabase) {}

  async getForPatient(patientId: string): Promise<Analysis[]> {
    const result = await this.db.execute(
      `SELECT * FROM analyses WHERE patient_id = ? ORDER BY created_at DESC`,
      [patientId],
    );
    return result.rows.map(rowToAnalysis);
  }

  async getById(id: string): Promise<Analysis | null> {
    const result = await this.db.execute(
      `SELECT * FROM analyses WHERE id = ?`,
      [id],
    );
    if (result.rows.length === 0) return null;
    return rowToAnalysis(result.rows[0]);
  }

  async create(input: CreateAnalysisInput): Promise<Analysis> {
    const analysis = createAnalysis(input);
    await this.db.execute(
      `INSERT INTO analyses
         (id, patient_id, knee_angle, hip_angle, ankle_angle,
          confidence_score, ml_corrected, manual_correction_joint, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysis.id,
        analysis.patientId,
        analysis.angles.kneeAngle,
        analysis.angles.hipAngle,
        analysis.angles.ankleAngle,
        analysis.confidenceScore,
        analysis.manualCorrectionApplied ? 1 : 0,
        analysis.manualCorrectionJoint,
        analysis.createdAt,
      ],
    );
    return analysis;
  }

  async update(
    id: string,
    partial: Partial<
      Pick<
        Analysis,
        "angles" | "manualCorrectionApplied" | "manualCorrectionJoint"
      >
    >,
  ): Promise<void> {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (partial.angles) {
      setClauses.push("knee_angle = ?", "hip_angle = ?", "ankle_angle = ?");
      params.push(
        partial.angles.kneeAngle,
        partial.angles.hipAngle,
        partial.angles.ankleAngle,
      );
    }
    if (partial.manualCorrectionApplied !== undefined) {
      setClauses.push("ml_corrected = ?");
      params.push(partial.manualCorrectionApplied ? 1 : 0);
    }
    if (partial.manualCorrectionJoint !== undefined) {
      setClauses.push("manual_correction_joint = ?");
      params.push(partial.manualCorrectionJoint);
    }

    if (setClauses.length === 0) return;

    params.push(id);
    await this.db.execute(
      `UPDATE analyses SET ${setClauses.join(", ")} WHERE id = ?`,
      params,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM analyses WHERE id = ?`, [id]);
  }
}
