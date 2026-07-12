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

const mockDetectFromImage = jest.fn();
jest.mock("../../../../specs/NativePoseLandmarker", () => ({
  __esModule: true,
  default: {
    detectFromImage: (...args: unknown[]) => mockDetectFromImage(...args),
    dispose: jest.fn(),
  },
}));

const mockOpenNativeCamera = jest.fn();
jest.mock("../../services/native-image-picker", () => ({
  openNativeCamera: (...args: unknown[]) => mockOpenNativeCamera(...args),
  openNativeGallery: jest.fn(),
  imagePickerResultToDataUrl: (r: { dataUrl: string }) => r.dataUrl,
}));

/** 33 landmarks d'une pose debout plausible, très visibles */
function standingPoseLandmarks() {
  const base = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: Math.min(0.1 + i * 0.025, 0.95),
    z: 0,
    visibility: 0.95,
  }));
  const place = (i: number, x: number, y: number) => {
    base[i] = { x, y, z: 0, visibility: 0.95 };
  };
  place(11, 0.42, 0.2); // épaule G
  place(12, 0.58, 0.2); // épaule D
  place(23, 0.44, 0.45); // hanche G
  place(24, 0.56, 0.45); // hanche D
  place(25, 0.44, 0.65); // genou G
  place(26, 0.56, 0.65); // genou D
  place(27, 0.44, 0.85); // cheville G
  place(28, 0.56, 0.85); // cheville D
  place(29, 0.43, 0.9); // talon G
  place(30, 0.57, 0.9); // talon D
  return base;
}

describe("useCaptureLogic — analyse native via TurboModule (mobile)", () => {
  beforeAll(() => {
    // @ts-ignore
    Platform.OS = "ios";
  });

  beforeEach(() => {
    mockDetectFromImage.mockReset();
    mockOpenNativeCamera.mockReset();
    useCaptureStore.getState().reset();
  });

  it("l'analyse aboutit sur mobile natif (le détecteur natif est branché)", async () => {
    mockDetectFromImage.mockResolvedValue({
      landmarks: standingPoseLandmarks(),
      width: 1080,
      height: 1920,
    });

    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(mockDetectFromImage).toHaveBeenCalled();
    expect(result.current.detectionError).toBeNull();
    expect(useCaptureStore.getState().phase.type).toBe("success");
  });

  it("n'expose plus de limite plateforme : un échec ML natif est une erreur de détection", async () => {
    mockDetectFromImage.mockRejectedValue(
      new Error("E_INIT_FAILED: modèle introuvable"),
    );

    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    act(() => {
      result.current.handlePhotoUploaded("data:image/png;base64,xxx");
    });

    await act(async () => {
      await result.current.handleAnalyze();
    });

    expect(result.current.detectionError).toContain("E_INIT_FAILED");
    expect(result.current).not.toHaveProperty("platformLimitation");
  });

  it("handleStartCapture sur natif ouvre la caméra native au lieu de bloquer", async () => {
    mockOpenNativeCamera.mockResolvedValue({
      dataUrl: "data:image/jpeg;base64,photo",
    });

    const { result } = renderHook(() => useCaptureLogic("patient-1"));

    await act(async () => {
      await result.current.handleStartCapture();
    });

    expect(mockOpenNativeCamera).toHaveBeenCalledTimes(1);
    expect(result.current.previewUrl).toBe("data:image/jpeg;base64,photo");
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
