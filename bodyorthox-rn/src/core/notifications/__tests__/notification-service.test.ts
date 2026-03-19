import { INotificationService } from "../notification-types";
import {
  formatAnalysisNotificationBody,
  NOTIFICATION_TITLE,
} from "../notification-utils";
import { WebNotificationService } from "../notification-service.web";
import { ArticularAngles } from "../../../features/capture/domain/analysis";

// Mock @notifee/react-native before importing native service
const mockRequestPermission = jest.fn();
const mockGetNotificationSettings = jest.fn();
const mockDisplayNotification = jest.fn();

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    requestPermission: (...args: unknown[]) => mockRequestPermission(...args),
    getNotificationSettings: (...args: unknown[]) =>
      mockGetNotificationSettings(...args),
    displayNotification: (...args: unknown[]) =>
      mockDisplayNotification(...args),
  },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 3,
    DENIED: 0,
    NOT_DETERMINED: -1,
  },
}));

import { NativeNotificationService } from "../notification-service.native";

const sampleAngles: ArticularAngles = {
  kneeAngle: 23.4,
  hipAngle: 67.8,
  ankleAngle: 41.2,
};

describe("formatAnalysisNotificationBody", () => {
  it("formats patient name and angles with 1 decimal", () => {
    const body = formatAnalysisNotificationBody("Martin", sampleAngles);
    expect(body).toBe(
      "L'analyse de Martin est prête — Genou 23.4°/ Hanche 67.8°/ Cheville 41.2°",
    );
  });

  it("formats integer angles with .0 decimal", () => {
    const angles: ArticularAngles = {
      kneeAngle: 23,
      hipAngle: 67,
      ankleAngle: 41,
    };
    const body = formatAnalysisNotificationBody("Fatima", angles);
    expect(body).toBe(
      "L'analyse de Fatima est prête — Genou 23.0°/ Hanche 67.0°/ Cheville 41.0°",
    );
  });

  it("handles long patient names", () => {
    const body = formatAnalysisNotificationBody(
      "Jean-Pierre Dupont",
      sampleAngles,
    );
    expect(body).toContain("Jean-Pierre Dupont");
  });
});

describe("NOTIFICATION_TITLE", () => {
  it("has the correct value", () => {
    expect(NOTIFICATION_TITLE).toBe("Analyse prête");
  });
});

describe("WebNotificationService", () => {
  let service: WebNotificationService;
  let originalNotification: typeof globalThis.Notification;

  beforeEach(() => {
    service = new WebNotificationService();
    originalNotification = globalThis.Notification;

    // Set up browser Notification mock
    const MockNotification = jest.fn() as jest.Mock & {
      requestPermission: jest.Mock;
      permission: NotificationPermission;
    };
    MockNotification.requestPermission = jest.fn().mockResolvedValue("granted");
    MockNotification.permission = "granted";

    globalThis.Notification =
      MockNotification as unknown as typeof Notification;
  });

  afterEach(() => {
    globalThis.Notification = originalNotification;
  });

  describe("requestPermission", () => {
    it("calls Notification.requestPermission", async () => {
      const result = await service.requestPermission();
      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it("returns false when permission is denied", async () => {
      (Notification.requestPermission as jest.Mock).mockResolvedValue("denied");
      const result = await service.requestPermission();
      expect(result).toBe(false);
    });

    it("only requests permission once", async () => {
      await service.requestPermission();
      await service.requestPermission();
      expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    });

    it("returns false when Notification API is undefined", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).Notification = undefined;
      const freshService = new WebNotificationService();
      const result = await freshService.requestPermission();
      expect(result).toBe(false);
    });
  });

  describe("isPermitted", () => {
    it("returns true when permission is granted", async () => {
      const result = await service.isPermitted();
      expect(result).toBe(true);
    });

    it("returns false when permission is denied", async () => {
      Object.defineProperty(Notification, "permission", {
        value: "denied",
        configurable: true,
      });
      const result = await service.isPermitted();
      expect(result).toBe(false);
    });

    it("returns false when Notification API is undefined", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).Notification = undefined;
      const freshService = new WebNotificationService();
      const result = await freshService.isPermitted();
      expect(result).toBe(false);
    });
  });

  describe("sendAnalysisReady", () => {
    it("creates notification with correct title and body", async () => {
      const result = await service.sendAnalysisReady("Martin", sampleAngles);
      expect(result.sent).toBe(true);
      expect(Notification).toHaveBeenCalledWith("Analyse prête", {
        body: "L'analyse de Martin est prête — Genou 23.4°/ Hanche 67.8°/ Cheville 41.2°",
      });
    });

    it("returns error when permission not granted", async () => {
      Object.defineProperty(Notification, "permission", {
        value: "denied",
        configurable: true,
      });
      const result = await service.sendAnalysisReady("Martin", sampleAngles);
      expect(result.sent).toBe(false);
      expect(result.error).toBe("Permission notifications non accordée");
    });

    it("returns error when Notification API is undefined", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).Notification = undefined;
      const freshService = new WebNotificationService();
      const result = await freshService.sendAnalysisReady(
        "Martin",
        sampleAngles,
      );
      expect(result.sent).toBe(false);
      expect(result.error).toContain("non supportées");
    });

    it("handles constructor error gracefully", async () => {
      (globalThis.Notification as unknown as jest.Mock).mockImplementation(
        () => {
          throw new Error("Notification blocked");
        },
      );
      const result = await service.sendAnalysisReady("Martin", sampleAngles);
      expect(result.sent).toBe(false);
      expect(result.error).toBe("Notification blocked");
    });
  });
});

describe("NativeNotificationService", () => {
  let service: NativeNotificationService;

  beforeEach(() => {
    service = new NativeNotificationService();
    jest.clearAllMocks();
  });

  describe("requestPermission", () => {
    it("returns true when authorized", async () => {
      mockRequestPermission.mockResolvedValue({ authorizationStatus: 1 }); // AUTHORIZED
      const result = await service.requestPermission();
      expect(result).toBe(true);
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it("returns true when provisional", async () => {
      mockRequestPermission.mockResolvedValue({ authorizationStatus: 3 }); // PROVISIONAL
      const result = await service.requestPermission();
      expect(result).toBe(true);
    });

    it("returns false when denied", async () => {
      mockRequestPermission.mockResolvedValue({ authorizationStatus: 0 }); // DENIED
      const result = await service.requestPermission();
      expect(result).toBe(false);
    });

    it("only requests permission once", async () => {
      mockRequestPermission.mockResolvedValue({ authorizationStatus: 1 });
      mockGetNotificationSettings.mockResolvedValue({ authorizationStatus: 1 });
      await service.requestPermission();
      await service.requestPermission();
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });

    it("handles error gracefully", async () => {
      mockRequestPermission.mockRejectedValue(new Error("Native error"));
      const result = await service.requestPermission();
      expect(result).toBe(false);
    });
  });

  describe("isPermitted", () => {
    it("returns true when authorized", async () => {
      mockGetNotificationSettings.mockResolvedValue({ authorizationStatus: 1 });
      const result = await service.isPermitted();
      expect(result).toBe(true);
    });

    it("returns false when denied", async () => {
      mockGetNotificationSettings.mockResolvedValue({ authorizationStatus: 0 });
      const result = await service.isPermitted();
      expect(result).toBe(false);
    });

    it("handles error gracefully", async () => {
      mockGetNotificationSettings.mockRejectedValue(new Error("Native error"));
      const result = await service.isPermitted();
      expect(result).toBe(false);
    });
  });

  describe("sendAnalysisReady", () => {
    it("displays notification with correct title and body", async () => {
      mockGetNotificationSettings.mockResolvedValue({ authorizationStatus: 1 });
      mockDisplayNotification.mockResolvedValue("notif-id");

      const result = await service.sendAnalysisReady("Martin", sampleAngles);
      expect(result.sent).toBe(true);
      expect(mockDisplayNotification).toHaveBeenCalledWith({
        title: "Analyse prête",
        body: "L'analyse de Martin est prête — Genou 23.4°/ Hanche 67.8°/ Cheville 41.2°",
      });
    });

    it("returns error when not permitted", async () => {
      mockGetNotificationSettings.mockResolvedValue({ authorizationStatus: 0 });
      const result = await service.sendAnalysisReady("Martin", sampleAngles);
      expect(result.sent).toBe(false);
      expect(result.error).toBe("Permission notifications non accordée");
    });

    it("handles display error gracefully", async () => {
      mockGetNotificationSettings.mockResolvedValue({ authorizationStatus: 1 });
      mockDisplayNotification.mockRejectedValue(new Error("Display failed"));
      const result = await service.sendAnalysisReady("Martin", sampleAngles);
      expect(result.sent).toBe(false);
      expect(result.error).toBe("Display failed");
    });
  });
});

describe("INotificationService contract", () => {
  it("WebNotificationService implements the interface", () => {
    const service: INotificationService = new WebNotificationService();
    expect(typeof service.requestPermission).toBe("function");
    expect(typeof service.isPermitted).toBe("function");
    expect(typeof service.sendAnalysisReady).toBe("function");
  });

  it("NativeNotificationService implements the interface", () => {
    const service: INotificationService = new NativeNotificationService();
    expect(typeof service.requestPermission).toBe("function");
    expect(typeof service.isPermitted).toBe("function");
    expect(typeof service.sendAnalysisReady).toBe("function");
  });
});
