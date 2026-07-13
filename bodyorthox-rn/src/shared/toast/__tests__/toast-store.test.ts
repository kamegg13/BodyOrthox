import { act } from "@testing-library/react-native";
import {
  showToast,
  TOAST_AUTO_DISMISS_MS,
  useToastStore,
} from "../toast-store";

describe("toast-store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => useToastStore.getState().hide());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("affiche le message avec sa tonalité", () => {
    act(() => showToast("Analyse sauvegardée", "success"));
    expect(useToastStore.getState().message).toBe("Analyse sauvegardée");
    expect(useToastStore.getState().tone).toBe("success");
  });

  it("se ferme automatiquement après la durée d'affichage", () => {
    act(() => showToast("Patient archivé", "success"));
    act(() => jest.advanceTimersByTime(TOAST_AUTO_DISMISS_MS));
    expect(useToastStore.getState().message).toBeNull();
  });

  it("un nouveau message remplace le précédent et repart pour la durée complète", () => {
    act(() => showToast("Premier"));
    act(() => jest.advanceTimersByTime(TOAST_AUTO_DISMISS_MS - 500));
    act(() => showToast("Second"));
    // L'ancien timer ne doit pas fermer le nouveau message.
    act(() => jest.advanceTimersByTime(600));
    expect(useToastStore.getState().message).toBe("Second");
    act(() => jest.advanceTimersByTime(TOAST_AUTO_DISMISS_MS));
    expect(useToastStore.getState().message).toBeNull();
  });

  it("hide() ferme immédiatement", () => {
    act(() => showToast("Message"));
    act(() => useToastStore.getState().hide());
    expect(useToastStore.getState().message).toBeNull();
  });
});
