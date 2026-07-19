import { Alert, Platform } from "react-native";
import { showAlert, showConfirm } from "../alerts";

describe("showAlert — alerte informative cross-platform", () => {
  afterEach(() => {
    Platform.OS = "ios";
    jest.restoreAllMocks();
  });

  it("natif : délègue à Alert.alert", () => {
    Platform.OS = "ios";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    showAlert("Titre", "Message");

    expect(alertSpy).toHaveBeenCalledWith("Titre", "Message");
  });

  it("web : Alert.alert ne fonctionnant pas sur react-native-web, retombe sur window.alert", () => {
    Platform.OS = "web";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const windowAlertSpy = jest.fn();
    (global as unknown as { alert: jest.Mock }).alert = windowAlertSpy;

    showAlert("Titre", "Message");

    expect(windowAlertSpy).toHaveBeenCalledWith("Titre\n\nMessage");
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe("showConfirm — confirmation cross-platform", () => {
  afterEach(() => {
    Platform.OS = "ios";
    jest.restoreAllMocks();
  });

  it("natif : affiche Annuler + le bouton de confirmation, n'appelle rien avant le choix", () => {
    Platform.OS = "ios";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const onConfirm = jest.fn();

    showConfirm("Archiver", "Voulez-vous archiver ?", onConfirm, {
      confirmLabel: "Archiver",
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = alertSpy.mock.calls[0];
    expect(title).toBe("Archiver");
    expect(message).toBe("Voulez-vous archiver ?");
    expect(buttons?.find((b) => b.style === "cancel")?.text).toBe("Annuler");
    expect(buttons?.find((b) => b.text === "Archiver")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("natif : n'appelle onConfirm que si le bouton de confirmation est pressé", () => {
    Platform.OS = "ios";
    const onConfirm = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const confirmBtn = buttons?.find((b) => b.text === "Supprimer");
      confirmBtn?.onPress?.();
    });

    showConfirm("Supprimer", "Voulez-vous supprimer ?", onConfirm, {
      confirmLabel: "Supprimer",
      destructive: true,
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("natif : n'appelle pas onConfirm quand Annuler est pressé", () => {
    const onConfirm = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const cancelBtn = buttons?.find((b) => b.style === "cancel");
      cancelBtn?.onPress?.();
    });

    showConfirm("Supprimer", "Voulez-vous supprimer ?", onConfirm);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("natif : marque le bouton de confirmation destructive quand demandé", () => {
    Platform.OS = "ios";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    showConfirm("Supprimer", "Voulez-vous supprimer ?", jest.fn(), {
      confirmLabel: "Supprimer",
      destructive: true,
    });

    const [, , buttons] = alertSpy.mock.calls[0];
    expect(buttons?.find((b) => b.text === "Supprimer")?.style).toBe("destructive");
  });

  it("web : Alert.alert ne fonctionnant pas sur react-native-web, retombe sur window.confirm", () => {
    Platform.OS = "web";
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const onConfirm = jest.fn();
    const windowConfirmSpy = jest.fn().mockReturnValue(true);
    (global as unknown as { confirm: jest.Mock }).confirm = windowConfirmSpy;

    showConfirm("Archiver", "Voulez-vous archiver ?", onConfirm);

    expect(windowConfirmSpy).toHaveBeenCalledWith("Archiver\n\nVoulez-vous archiver ?");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("web : n'appelle pas onConfirm quand window.confirm est refusé", () => {
    Platform.OS = "web";
    const onConfirm = jest.fn();
    (global as unknown as { confirm: jest.Mock }).confirm = jest.fn().mockReturnValue(false);

    showConfirm("Archiver", "Voulez-vous archiver ?", onConfirm);

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
