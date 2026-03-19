/**
 * Native implementation of notification service.
 * Uses @notifee/react-native for local notifications.
 */
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { ArticularAngles } from "../../features/capture/domain/analysis";
import { INotificationService, NotificationResult } from "./notification-types";
import {
  formatAnalysisNotificationBody,
  NOTIFICATION_TITLE,
} from "./notification-utils";

export class NativeNotificationService implements INotificationService {
  private _permissionRequested = false;

  async requestPermission(): Promise<boolean> {
    if (this._permissionRequested) {
      return this.isPermitted();
    }

    this._permissionRequested = true;

    try {
      const settings = await notifee.requestPermission();
      return (
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      );
    } catch {
      return false;
    }
  }

  async isPermitted(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return (
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      );
    } catch {
      return false;
    }
  }

  async sendAnalysisReady(
    patientName: string,
    angles: ArticularAngles,
  ): Promise<NotificationResult> {
    const permitted = await this.isPermitted();
    if (!permitted) {
      return { sent: false, error: "Permission notifications non accordée" };
    }

    try {
      const body = formatAnalysisNotificationBody(patientName, angles);
      await notifee.displayNotification({
        title: NOTIFICATION_TITLE,
        body,
      });
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
  return new NativeNotificationService();
}
