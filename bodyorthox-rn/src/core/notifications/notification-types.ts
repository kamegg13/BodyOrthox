/**
 * Abstract notification service interface.
 * Platform-specific implementations in .web.ts and .native.ts
 */
import { ArticularAngles } from "../../features/capture/domain/analysis";

export interface NotificationResult {
  readonly sent: boolean;
  readonly error?: string;
}

export interface INotificationService {
  /**
   * Request permission to send notifications.
   * On web: calls Notification.requestPermission()
   * On native: calls @notifee requestPermission()
   * Should only be called once (after first successful analysis).
   */
  requestPermission(): Promise<boolean>;

  /**
   * Check if notification permission has been granted.
   */
  isPermitted(): Promise<boolean>;

  /**
   * Send a local notification when analysis completes successfully.
   * @param patientName - Name of the patient
   * @param angles - Articular angles from the analysis
   */
  sendAnalysisReady(
    patientName: string,
    angles: ArticularAngles,
  ): Promise<NotificationResult>;
}
