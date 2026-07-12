import { Platform } from "react-native";
import { renderHook, act } from "@testing-library/react-native";
import { useCaptureLogic } from "../use-capture-logic";
import { useCaptureStore } from "../../store/capture-store";
import {
  setKeyValueStorage,
  __resetKeyValueStorage,
  type KeyValueStorage,
} from "../../../../core/storage/key-value-storage";
import {
  saveCaptureDraft,
  loadCaptureDraft,
} from "../../data/capture-draft-storage";

function createMemoryStorage(): KeyValueStorage {
  const backing = new Map<string, string>();
  return {
    getItem: (key) => backing.get(key) ?? null,
    setItem: (key, value) => backing.set(key, value),
    removeItem: (key) => backing.delete(key),
  };
}

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

describe("useCaptureLogic — résilience à l'interruption pendant la capture", () => {
  const sampleLandmarks = {
    24: { x: 0.5, y: 0.3, visibility: 0.95 },
    26: { x: 0.5, y: 0.6, visibility: 0.9 },
    28: { x: 0.5, y: 0.9, visibility: 0.88 },
    12: { x: 0.6, y: 0.2, visibility: 0.95 },
    11: { x: 0.4, y: 0.2, visibility: 0.95 },
    30: { x: 0.52, y: 0.93, visibility: 0.8 },
  };

  beforeEach(() => {
    __resetKeyValueStorage();
    setKeyValueStorage(createMemoryStorage());
    useCaptureStore.getState().reset();
  });

  it("persiste la preview en cours après une prise/import de photo", () => {
    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });

    expect(loadCaptureDraft("patient-1")?.previewUrl).toBe(
      "data:image/png;base64,xxx",
    );
  });

  it("n'expose aucun brouillon restaurable par défaut", () => {
    const { result } = renderHook(() => useCaptureLogic("patient-1"));
    expect(result.current.restorableDraft).toBeNull();
  });

  it("expose un brouillon restaurable au remontage pour le même patient, sans l'appliquer", () => {
    saveCaptureDraft("patient-1", "data:image/png;base64,restored");

    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    expect(result.current.restorableDraft).toBe(
      "data:image/png;base64,restored",
    );
    expect(result.current.previewUrl).toBeNull();
  });

  it("n'expose pas de brouillon appartenant à un autre patient", () => {
    saveCaptureDraft("patient-2", "data:image/png;base64,other");

    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    expect(result.current.restorableDraft).toBeNull();
  });

  it("handleRestoreDraft applique la preview restaurée et efface le bandeau", () => {
    saveCaptureDraft("patient-1", "data:image/png;base64,restored");
    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handleRestoreDraft();
    });

    expect(result.current.previewUrl).toBe("data:image/png;base64,restored");
    expect(result.current.restorableDraft).toBeNull();
    // Le brouillon persisté reste en place tant que l'analyse n'est pas
    // sauvegardée (purgé seulement à la sauvegarde ou au refus explicite).
    expect(loadCaptureDraft("patient-1")?.previewUrl).toBe(
      "data:image/png;base64,restored",
    );
  });

  it("handleDiscardDraft purge le stockage sans appliquer de preview", () => {
    saveCaptureDraft("patient-1", "data:image/png;base64,restored");
    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handleDiscardDraft();
    });

    expect(result.current.previewUrl).toBeNull();
    expect(result.current.restorableDraft).toBeNull();
    expect(loadCaptureDraft("patient-1")).toBeNull();
  });

  it("purge le brouillon quand l'utilisateur reprend la capture (handleRetake)", () => {
    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });
    expect(loadCaptureDraft("patient-1")).not.toBeNull();

    act(() => {
      result.current.handleRetake();
    });

    expect(loadCaptureDraft("patient-1")).toBeNull();
  });

  it("purge le brouillon après une sauvegarde réussie", async () => {
    const mockAnalysis = {
      id: "analysis-1",
      patientId: "patient-1",
      createdAt: "2024-01-01T00:00:00Z",
      angles: { kneeAngle: 175.0, hipAngle: 178.0, ankleAngle: 90.0 },
      confidenceScore: 0.92,
      manualCorrectionApplied: false,
      manualCorrectionJoint: null,
    };
    const mockRepo = { create: jest.fn().mockResolvedValue(mockAnalysis) };
    // @ts-ignore — repo partiel suffisant pour ce test
    useCaptureStore.getState().setRepository(mockRepo);

    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });
    expect(loadCaptureDraft("patient-1")).not.toBeNull();

    act(() => {
      useCaptureStore.getState().startRecording();
    });
    const token = useCaptureStore.getState().sessionToken();
    act(() => {
      // @ts-ignore — landmarks partiels suffisants pour ce test
      useCaptureStore.getState().processFrames(sampleLandmarks, undefined, undefined, token);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(loadCaptureDraft("patient-1")).toBeNull();
  });
});
