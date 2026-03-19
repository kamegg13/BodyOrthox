/**
 * Web implementation of notification service.
 * Uses the browser Notification API.
 */
import { ArticularAngles } from "../../features/capture/domain/analysis";
import { INotificationService, NotificationResult } from "./notification-types";
import {
  formatAnalysisNotificationBody,
  NOTIFICATION_TITLE,
} from "./notification-utils";

export class WebNotificationService implements INotificationService {
  private _permissionRequested = false;

  async requestPermission(): Promise<boolean> {
    if (this._permissionRequested) {
      return this.isPermitted();
    }

    if (typeof Notification === "undefined") {
      return false;
    }

    this._permissionRequested = true;

    try {
      const result = await Notification.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }

  async isPermitted(): Promise<boolean> {
    if (typeof Notification === "undefined") {
      return false;
    }
    return Notification.permission === "granted";
  }

  async sendAnalysisReady(
    patientName: string,
    angles: ArticularAngles,
  ): Promise<NotificationResult> {
    if (typeof Notification === "undefined") {
      return {
        sent: false,
        error: "Notifications non supportées dans ce navigateur",
      };
    }

    const permitted = await this.isPermitted();
    if (!permitted) {
      return { sent: false, error: "Permission notifications non accordée" };
    }

    try {
      const body = formatAnalysisNotificationBody(patientName, angles);
      new Notification(NOTIFICATION_TITLE, { body });
      return { sent: true };
    } catch (err) {
      return {
        sent: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      };
    }
  }
}

export function createNotificationService(): INotificationService {
  return new WebNotificationService();
}
