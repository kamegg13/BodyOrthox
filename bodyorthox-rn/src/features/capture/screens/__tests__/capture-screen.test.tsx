import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { CaptureScreen } from "../capture-screen";

// ── Navigation ────────────────────────────────────────────────────────────────
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({ params: { patientId: "patient-1" } }),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
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
  platformLimitation: null,
  lowConfidenceWarning: null,
  restorableDraft: null,
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
  handleRestoreDraft: jest.fn(),
  handleDiscardDraft: jest.fn(),
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

describe("CaptureScreen — lien protocole", () => {
  beforeAll(() => {
    // @ts-ignore
    require("react-native").Platform.OS = "web";
  });

  afterAll(() => {
    // @ts-ignore
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCaptureLogic.mockReturnValue({
      ...defaultLogic,
      phase: { type: "ready" },
    });
  });

  it("ouvre le protocole de positionnement depuis l'écran de capture", () => {
    const { getByLabelText } = render(<CaptureScreen />);
    fireEvent.press(getByLabelText("Protocole de positionnement"));
    expect(mockNavigate).toHaveBeenCalledWith("MainTabs", {
      screen: "AnalysesTab",
      params: { screen: "Protocols" },
    });
  });
});

describe("CaptureScreen — bandeau de capture restaurée", () => {
  const mockHandleRestoreDraft = jest.fn();
  const mockHandleDiscardDraft = jest.fn();

  beforeAll(() => {
    // @ts-ignore
    require("react-native").Platform.OS = "web";
  });

  afterAll(() => {
    // @ts-ignore
    require("react-native").Platform.OS = "ios";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCaptureLogic.mockReturnValue({
      ...defaultLogic,
      phase: { type: "ready" },
      restorableDraft: "data:image/png;base64,restored",
      handleRestoreDraft: mockHandleRestoreDraft,
      handleDiscardDraft: mockHandleDiscardDraft,
    });
  });

  it("affiche le bandeau quand un brouillon de capture interrompue existe", () => {
    const { getByText } = render(<CaptureScreen />);
    expect(getByText("Capture en cours restaurée")).toBeTruthy();
  });

  it("appelle handleRestoreDraft au tap sur Reprendre", () => {
    const { getByText } = render(<CaptureScreen />);
    fireEvent.press(getByText("Reprendre"));
    expect(mockHandleRestoreDraft).toHaveBeenCalledTimes(1);
  });

  it("appelle handleDiscardDraft au tap sur Refaire", () => {
    const { getByText } = render(<CaptureScreen />);
    fireEvent.press(getByText("Refaire"));
    expect(mockHandleDiscardDraft).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas le bandeau quand il n'y a pas de brouillon", () => {
    mockUseCaptureLogic.mockReturnValue({
      ...defaultLogic,
      phase: { type: "ready" },
      restorableDraft: null,
    });
    const { queryByText } = render(<CaptureScreen />);
    expect(queryByText("Capture en cours restaurée")).toBeNull();
  });
});
