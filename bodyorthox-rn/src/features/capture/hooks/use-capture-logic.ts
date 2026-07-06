import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../navigation/types";
import { useCaptureStore } from "../store/capture-store";
import { WebCameraRef } from "../components/web-camera";
import { getPoseDetector } from "../data/pose-detector";
import {
  openNativeCamera,
  openNativeGallery,
  imagePickerResultToDataUrl,
} from "../services/native-image-picker";
import type { IPoseDetector } from "../data/pose-detector";
import type { PoseLandmarks } from "../data/angle-calculator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Low confidence threshold — warn the user below this */
const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Honest message shown when no real pose detector is available (native). */
const NO_DETECTOR_MESSAGE =
  "L'analyse automatique n'est pas encore disponible sur cette plateforme.";

export function useCaptureLogic(patientId: string) {
  const navigation = useNavigation<Nav>();

  const {
    phase,
    frameCount,
    luminosity,
    isCorrectPosition,
    capturedImageUrl,
    detectedLandmarks,
    allDetectedLandmarks,
    requestPermission,
    permissionGranted,
    permissionDenied,
    startRecording,
    saveAnalysis,
    reset,
    setError,
    processFrames,
    setCapturedImageUrl,
  } = useCaptureStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webCameraRef = useRef<WebCameraRef>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const poseDetectorRef = useRef<IPoseDetector | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [lowConfidenceWarning, setLowConfidenceWarning] = useState<{
    message: string;
    onContinue: () => void;
  } | null>(null);

  useEffect(() => {
    // Clear any state left over from a previous patient/session before starting.
    // This also bumps the session token, invalidating any in-flight callback.
    reset();

    // Lazy-load pose detector on web
    if (Platform.OS === "web") {
      const detector = getPoseDetector();
      poseDetectorRef.current = detector;
      setMlLoading(true);
      detector
        .initialize()
        .catch(() => {
          // Non-blocking — detection will fail later with a clear message
        })
        .finally(() => setMlLoading(false));
    }

    requestPermission();
    // On web and Android (without native camera module), grant permission immediately.
    // The web uses getUserMedia via WebCamera; Android uses simulated capture.
    // Native camera via react-native-vision-camera is disabled for now.
    permissionGranted();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      reset();
    };
  }, []);

  const handleWebCameraPermissionDenied = useCallback(
    (message: string) => {
      permissionDenied(message);
    },
    [permissionDenied],
  );

  const handleTakeWebPhoto = useCallback(() => {
    if (phase.type !== "ready") return;
    const dataUrl = webCameraRef.current?.takePhoto();
    if (dataUrl) {
      setPreviewUrl(dataUrl);
      setCapturedImageUrl(dataUrl);
    }
  }, [phase, setCapturedImageUrl]);

  const handlePhotoUploaded = useCallback(
    (dataUrl: string) => {
      setPreviewUrl(dataUrl);
      setCapturedImageUrl(dataUrl);
    },
    [setCapturedImageUrl],
  );

  const handleAnalyze = useCallback(async () => {
    if (!previewUrl) return;
    setDetectionError(null);
    setLowConfidenceWarning(null);

    const detector = poseDetectorRef.current;

    // No real pose detector (native without frame processor, or web ML failed
    // to load): block honestly instead of fabricating landmarks. We must never
    // present or persist a simulated analysis as a real measurement.
    if (Platform.OS !== "web" || !detector || !detector.isReady()) {
      setDetectionError(NO_DETECTOR_MESSAGE);
      return;
    }

    startRecording();
    const token = useCaptureStore.getState().sessionToken();

    try {
      const result = await detector.detect(previewUrl);

      if (result.confidenceScore < LOW_CONFIDENCE_THRESHOLD) {
        // Set phase back to 'ready' so UI shows warning instead of spinner
        permissionGranted();
        setLowConfidenceWarning({
          message:
            "Confiance faible — la photo pourrait ne pas être optimale. Vous pouvez réessayer ou continuer.",
          onContinue: () => {
            setLowConfidenceWarning(null);
            processFrames(
              result.landmarks,
              result.allLandmarks,
              result.anatomicalValidation,
              token,
            );
          },
        });
        return;
      }

      processFrames(
        result.landmarks,
        result.allLandmarks,
        result.anatomicalValidation,
        token,
      );
    } catch (error) {
      // Set phase back to 'ready' so UI shows error instead of spinner
      permissionGranted();
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'analyse de la photo.";
      setDetectionError(message);
    }
  }, [previewUrl, startRecording, processFrames, setError]);

  const handleRetake = useCallback(() => {
    setPreviewUrl(null);
    setCapturedImageUrl(null);
    setDetectionError(null);
    setLowConfidenceWarning(null);
  }, [setCapturedImageUrl]);

  const handleNativeCamera = useCallback(async () => {
    try {
      const result = await openNativeCamera();
      const dataUrl = imagePickerResultToDataUrl(result);
      handlePhotoUploaded(dataUrl);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "cancelled") return;
      setError(error instanceof Error ? error.message : "Erreur caméra");
    }
  }, [handlePhotoUploaded, setError]);

  const handleNativeGallery = useCallback(async () => {
    try {
      const result = await openNativeGallery();
      const dataUrl = imagePickerResultToDataUrl(result);
      handlePhotoUploaded(dataUrl);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "cancelled") return;
      setError(error instanceof Error ? error.message : "Erreur galerie");
    }
  }, [handlePhotoUploaded, setError]);

  const handleStartCapture = useCallback(async () => {
    if (phase.type !== "ready") return;

    if (Platform.OS === "web") {
      handleTakeWebPhoto();
      return;
    }

    // Native has no real pose detector yet — block honestly rather than
    // fabricating a "straight legs" analysis from simulated landmarks.
    setDetectionError(NO_DETECTOR_MESSAGE);
  }, [phase, handleTakeWebPhoto]);

  const handleSave = useCallback(
    async (correctedLandmarks?: PoseLandmarks) => {
      if (phase.type !== "success") return;
      const analysis = await saveAnalysis(patientId, correctedLandmarks);
      if (analysis) {
        const { capturedImageUrl: imgUrl, allDetectedLandmarks: allLm } =
          useCaptureStore.getState();
        // On passe par l'écran Processing v2 qui auto-advance vers Results.
        navigation.reset({
          index: 0,
          routes: [
            { name: "MainTabs" },
            {
              name: "Processing",
              params: {
                analysisId: analysis.id,
                patientId,
                ...(imgUrl ? { capturedImageUrl: imgUrl } : {}),
                ...(correctedLandmarks ?? allLm
                  ? { allLandmarks: correctedLandmarks ?? allLm ?? undefined }
                  : {}),
              },
            },
          ],
        });
      } else {
        // saveAnalysis may already have set a cause-aware error phase
        // (network/auth). Only fall back to a generic message otherwise.
        if (useCaptureStore.getState().phase.type !== "error") {
          setError("Impossible de sauvegarder l'analyse.");
        }
      }
    },
    [phase, patientId, saveAnalysis, navigation, setError],
  );

  const handleDiscard = useCallback(() => {
    Alert.alert("Annuler", "Voulez-vous vraiment annuler cette analyse ?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        style: "destructive",
        onPress: () => {
          reset();
          setPreviewUrl(null);
          navigation.goBack();
        },
      },
    ]);
  }, [reset, navigation]);

  return {
    phase,
    frameCount,
    luminosity,
    isCorrectPosition,
    capturedImageUrl,
    detectedLandmarks,
    allDetectedLandmarks,
    previewUrl,
    mlLoading,
    detectionError,
    lowConfidenceWarning,
    webCameraRef,
    handleWebCameraPermissionDenied,
    handleTakeWebPhoto,
    handlePhotoUploaded,
    handleNativeCamera,
    handleNativeGallery,
    handleAnalyze,
    handleRetake,
    handleStartCapture,
    handleSave,
    handleDiscard,
  };
}
