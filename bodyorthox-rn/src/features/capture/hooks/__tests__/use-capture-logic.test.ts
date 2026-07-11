import { Platform } from "react-native";
import { renderHook, act } from "@testing-library/react-native";
import { useCaptureLogic } from "../use-capture-logic";
import { useCaptureStore } from "../../store/capture-store";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ reset: jest.fn() }),
}));

describe("useCaptureLogic — distinction limite plateforme vs erreur ML (mobile natif)", () => {
  beforeAll(() => {
    // @ts-ignore
    Platform.OS = "ios";
  });

  afterAll(() => {
    // @ts-ignore
    Platform.OS = "ios";
  });

  beforeEach(() => {
    useCaptureStore.getState().reset();
  });

  it("expose un message de limite plateforme (pas une erreur ML) quand on tente d'analyser sur mobile natif", () => {
    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });

    act(() => {
      result.current.handleAnalyze();
    });

    expect(result.current.platformLimitation).toBe(
      "L'analyse automatique n'est pas disponible sur mobile pour le moment. Utilisez BodyOrthox sur navigateur pour analyser cette capture.",
    );
    expect(result.current.detectionError).toBeNull();
  });

  it("efface la limite plateforme quand l'utilisateur recommence la capture", () => {
    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });
    act(() => {
      result.current.handleAnalyze();
    });
    expect(result.current.platformLimitation).not.toBeNull();

    act(() => {
      result.current.handleRetake();
    });

    expect(result.current.platformLimitation).toBeNull();
  });
});
