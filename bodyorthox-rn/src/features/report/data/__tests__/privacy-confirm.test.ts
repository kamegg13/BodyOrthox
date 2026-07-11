describe("confirmPrivacyBeforeShare", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should resolve true when the user confirms via Alert (native)", async () => {
    let capturedButtons: Array<{ text: string; onPress?: () => void }> = [];
    jest.doMock("react-native", () => ({
      Platform: { OS: "ios" },
      Alert: {
        alert: jest.fn((_title: string, _message: string, buttons: any) => {
          capturedButtons = buttons;
        }),
      },
    }));

    const { confirmPrivacyBeforeShare } = require("../privacy-confirm");
    const pending = confirmPrivacyBeforeShare();
    const confirmButton = capturedButtons.find((b) => b.text !== "Annuler");
    confirmButton?.onPress?.();

    await expect(pending).resolves.toBe(true);
  });

  it("should resolve false when the user cancels via Alert (native)", async () => {
    let capturedButtons: Array<{ text: string; onPress?: () => void }> = [];
    jest.doMock("react-native", () => ({
      Platform: { OS: "android" },
      Alert: {
        alert: jest.fn((_title: string, _message: string, buttons: any) => {
          capturedButtons = buttons;
        }),
      },
    }));

    const { confirmPrivacyBeforeShare } = require("../privacy-confirm");
    const pending = confirmPrivacyBeforeShare();
    const cancelButton = capturedButtons.find((b) => b.text === "Annuler");
    cancelButton?.onPress?.();

    await expect(pending).resolves.toBe(false);
  });

  it("should mention health data and the recipient in the message shown to the user (native)", async () => {
    const alertMock = jest.fn((_title: string, _message: string, buttons: any) => {
      buttons.find((b: any) => b.text === "Annuler")?.onPress?.();
    });
    jest.doMock("react-native", () => ({
      Platform: { OS: "ios" },
      Alert: { alert: alertMock },
    }));

    const { confirmPrivacyBeforeShare } = require("../privacy-confirm");
    await confirmPrivacyBeforeShare();

    const [title, message] = alertMock.mock.calls[0];
    expect(`${title} ${message}`.toLowerCase()).toContain("santé");
    expect(`${title} ${message}`.toLowerCase()).toContain("destinataire");
  });

  it("should use window.confirm on web and resolve with its result", async () => {
    jest.doMock("react-native", () => ({
      Platform: { OS: "web" },
      Alert: { alert: jest.fn() },
    }));
    const confirmMock = jest.fn().mockReturnValue(true);
    (global as any).window = { confirm: confirmMock };

    const { confirmPrivacyBeforeShare } = require("../privacy-confirm");
    const result = await confirmPrivacyBeforeShare();

    expect(confirmMock).toHaveBeenCalled();
    expect(result).toBe(true);

    delete (global as any).window;
  });
});
