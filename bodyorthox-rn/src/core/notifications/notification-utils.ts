/**
 * Shared notification utilities.
 * No platform-specific code — safe to import from any file.
 */
import { ArticularAngles } from "../../features/capture/domain/analysis";

/**
 * Format the notification body text for a completed analysis.
 */
export function formatAnalysisNotificationBody(
  patientName: string,
  angles: ArticularAngles,
): string {
  const knee = angles.kneeAngle.toFixed(1);
  const hip = angles.hipAngle.toFixed(1);
  const ankle = angles.ankleAngle.toFixed(1);
  return `L'analyse de ${patientName} est prête — Genou ${knee}°/ Hanche ${hip}°/ Cheville ${ankle}°`;
}

export const NOTIFICATION_TITLE = "Analyse prête";
