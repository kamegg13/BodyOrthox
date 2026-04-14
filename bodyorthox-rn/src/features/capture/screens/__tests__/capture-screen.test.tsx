import React from "react";
import { render } from "@testing-library/react-native";
import { CaptureScreen } from "../capture-screen";

// ── Navigation ────────────────────────────────────────────────────────────────
jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({ params: { patientId: "patient-1" } }),
}));

// ── useCaptureLogic ───────────────────────────────────────────────────────────
const mockHandlePhotoUploaded = jest.fn();

const defaultLogic = {
  phase: { type: "idle" },
  frameCount: 0,
  luminosity: 128,
  isCorrectPosition: false,
  capturedImageUrl: undefined,
  detectedLandmarks: undefined,
  allDetectedLandmarks: undefined,
  previewUrl: undefined,
  mlLoading: false,
  detectionError: null,
  lowConfidenceWarning: null,
  webCameraRef: { current: null },
  handleWebCameraPermissionDenied: jest.fn(),
  handleTakeWebPhoto: jest.fn(),
  handlePhotoUploaded: mockHandlePhotoUploaded,
  handleNativeCamera: jest.fn(),
  handleNativeGallery: jest.fn(),
  handleAnalyze: jest.fn(),
  handleRetake: jest.fn(),
  handleStartCapture: jest.fn(),
  handleSave: jest.fn(),
  handleDiscard: jest.fn(),
};

const mockUseCaptureLogic = jest.fn(() => defaultLogic);

jest.mock("../../hooks/use-capture-logic", () => ({
  useCaptureLogic: (...args: unknown[]) => mockUseCaptureLogic(...args),
}));

// ── Composants DOM-dépendants ─────────────────────────────────────────────────
jest.mock("../../components/web-camera", () => ({
  WebCamera: require("react").forwardRef(() => null),
}));

jest.mock("../../components/photo-upload", () => ({
  PhotoUpload: () => {
    const { View } = require("react-native");
    return <View testID="photo-upload-button" />;
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("CaptureScreen — permission_denied", () => {
  beforeAll(() => {
    // PhotoUpload et WebCamera sont web-only — simuler la plateforme web
    // @ts-ignore
    require("react-native").Platform.OS = "web";
  });

  afterAll(() => {
    // @ts-ignore
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le bouton import photo quand la permission caméra est refusée", () => {
    mockUseCaptureLogic.mockReturnValue({
      ...defaultLogic,
      phase: { type: "permission_denied", message: "Accès à la caméra refusé par l'utilisateur." },
    });

    const { getByTestId } = render(<CaptureScreen />);
    expect(getByTestId("photo-upload-button")).toBeTruthy();
  });

  it("affiche le titre et le message d'erreur quand la permission est refusée", () => {
    mockUseCaptureLogic.mockReturnValue({
      ...defaultLogic,
      phase: { type: "permission_denied", message: "Accès refusé." },
    });

    const { getByText } = render(<CaptureScreen />);
    expect(getByText("Accès caméra refusé")).toBeTruthy();
    expect(getByText("Accès refusé.")).toBeTruthy();
  });
});
