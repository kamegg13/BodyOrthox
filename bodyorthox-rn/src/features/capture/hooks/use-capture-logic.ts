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
import {
  saveCaptureDraft,
  loadCaptureDraft,
  clearCaptureDraft,
} from "../data/capture-draft-storage";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Low confidence threshold — warn the user below this */
const LOW_CONFIDENCE_THRESHOLD = 0.6;

/** Erreur réelle : le modèle ML n'a pas pu être chargé. */
const ML_UNAVAILABLE_MESSAGE =
  "Le modèle d'analyse n'a pas pu être chargé. Réessayez ou rechargez la page.";

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
    setLuminosity,
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
  // Preview d'une capture interrompue (appel entrant, arrière-plan prolongé)
  // retrouvée en stockage pour CE patient au remontage de l'écran — jamais
  // appliquée automatiquement, l'utilisateur choisit via le bandeau
  // (Reprendre / Refaire, cf. handleRestoreDraft / handleDiscardDraft).
  const [restorableDraft, setRestorableDraft] = useState<string | null>(
    () => loadCaptureDraft(patientId)?.previewUrl ?? null,
  );

  useEffect(() => {
    // Clear any state left over from a previous patient/session before starting.
    // This also bumps the session token, invalidating any in-flight callback.
    reset();

    // Lazy-load pose detector: MediaPipe WASM on web, TurboModule on native
    const detector = getPoseDetector();
    poseDetectorRef.current = detector;
    setMlLoading(true);
    detector
      .initialize()
      .catch(() => {
        // Non-blocking — detection will fail later with a clear message
      })
      .finally(() => setMlLoading(false));

    requestPermission();
    // Grant immediately on every platform: the web uses getUserMedia via
    // WebCamera (browser prompt), native delegates to the system camera and
    // gallery via react-native-image-picker (system-level permission).
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
      saveCaptureDraft(patientId, dataUrl);
    }
  }, [phase, setCapturedImageUrl, patientId]);

  const handlePhotoUploaded = useCallback(
    (dataUrl: string) => {
      setPreviewUrl(dataUrl);
      setCapturedImageUrl(dataUrl);
      saveCaptureDraft(patientId, dataUrl);
    },
    [setCapturedImageUrl, patientId],
  );

  const handleAnalyze = useCallback(async () => {
    if (!previewUrl) return;
    setDetectionError(null);
    setLowConfidenceWarning(null);

    const detector = poseDetectorRef.current;

    // Le modèle ML n'a pas pu être chargé : vraie erreur — on ne fabrique
    // jamais de landmarks simulés pour la masquer.
    if (!detector || !detector.isReady()) {
      setDetectionError(ML_UNAVAILABLE_MESSAGE);
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
  }, [previewUrl, startRecording, processFrames]);

  const handleRetake = useCallback(() => {
    setPreviewUrl(null);
    setCapturedImageUrl(null);
    setDetectionError(null);
    setLowConfidenceWarning(null);
    clearCaptureDraft(patientId);
  }, [setCapturedImageUrl, patientId]);

  /** Applique la preview d'une capture interrompue restaurée depuis le stockage. */
  const handleRestoreDraft = useCallback(() => {
    if (restorableDraft) {
      setPreviewUrl(restorableDraft);
      setCapturedImageUrl(restorableDraft);
    }
    setRestorableDraft(null);
  }, [restorableDraft, setCapturedImageUrl]);

  /** Refus explicite de la restauration : purge le brouillon, repart de zéro. */
  const handleDiscardDraft = useCallback(() => {
    clearCaptureDraft(patientId);
    setRestorableDraft(null);
  }, [patientId]);

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

    // Natif : la capture passe par la caméra système (image-picker)
    await handleNativeCamera();
  }, [phase, handleTakeWebPhoto, handleNativeCamera]);

  const handleSave = useCallback(
    async (correctedLandmarks?: PoseLandmarks) => {
      if (phase.type !== "success") return;
      const analysis = await saveAnalysis(patientId, correctedLandmarks);
      if (analysis) {
        clearCaptureDraft(patientId);
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
          clearCaptureDraft(patientId);
          navigation.goBack();
        },
      },
    ]);
  }, [reset, navigation, patientId]);

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
    restorableDraft,
    webCameraRef,
    handleLuminositySample: setLuminosity,
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
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
