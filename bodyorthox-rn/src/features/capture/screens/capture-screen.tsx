import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { useCaptureStore } from "../store/capture-store";
import { GuidedCameraOverlay } from "../components/guided-camera-overlay";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { WebCamera, WebCameraRef } from "../components/web-camera";
import { PhotoUpload } from "../components/photo-upload";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Capture">;

// Dynamic camera import – avoids crashes on web
let CameraComponent: React.ComponentType<Record<string, unknown>> | null = null;
if (Platform.OS !== "web") {
  try {
    const { Camera } = require("react-native-vision-camera");
    CameraComponent = Camera;
  } catch {
    /* unavailable */
  }
}

const SIMULATED_LANDMARKS = {
  11: { x: 0.4, y: 0.2, visibility: 0.95 },
  12: { x: 0.6, y: 0.2, visibility: 0.95 },
  23: { x: 0.42, y: 0.5, visibility: 0.9 },
  24: { x: 0.58, y: 0.5, visibility: 0.9 },
  25: { x: 0.42, y: 0.72, visibility: 0.88 },
  26: { x: 0.58, y: 0.72, visibility: 0.88 },
  27: { x: 0.42, y: 0.92, visibility: 0.85 },
  28: { x: 0.58, y: 0.92, visibility: 0.85 },
  30: { x: 0.6, y: 0.96, visibility: 0.8 },
};

export function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const {
    phase,
    frameCount,
    luminosity,
    isCorrectPosition,
    capturedImageUrl,
    requestPermission,
    permissionGranted,
    permissionDenied,
    startRecording,
    addFrame,
    saveAnalysis,
    reset,
    setError,
    processFrames,
    setCapturedImageUrl,
  } = useCaptureStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webCameraRef = useRef<WebCameraRef>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    requestPermission();
    if (Platform.OS === "web") {
      // Permission is handled by the WebCamera component via getUserMedia
      permissionGranted();
    } else {
      (async () => {
        try {
          const { Camera } = require("react-native-vision-camera");
          const status = await Camera.requestCameraPermission();
          if (status === "granted") permissionGranted();
          else
            permissionDenied(
              "Acces camera refuse. Activez-le dans les reglages.",
            );
        } catch {
          permissionDenied("Impossible d'acceder a la camera.");
        }
      })();
    }
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
    startRecording();

    // Simulate frame capture
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 30));
      addFrame();
    }

    // Simulate ML analysis (replace with real ML Kit later)
    processFrames(SIMULATED_LANDMARKS);
  }, [previewUrl, startRecording, addFrame, processFrames]);

  const handleRetake = useCallback(() => {
    setPreviewUrl(null);
    setCapturedImageUrl(null);
  }, [setCapturedImageUrl]);

  const handleStartCapture = useCallback(async () => {
    if (phase.type !== "ready") return;

    if (Platform.OS === "web") {
      handleTakeWebPhoto();
      return;
    }

    startRecording();
    timerRef.current = setTimeout(() => {}, 100);

    // Simulate ML analysis (replace with real ML Kit / Vision Camera frame processor)
    processFrames(SIMULATED_LANDMARKS);
  }, [phase, startRecording, processFrames, handleTakeWebPhoto]);

  const handleSave = useCallback(async () => {
    if (phase.type !== "success") return;
    const analysis = await saveAnalysis(patientId);
    if (analysis) {
      navigation.replace("Results", { analysisId: analysis.id, patientId });
    } else {
      setError("Impossible de sauvegarder l'analyse.");
    }
  }, [phase, patientId, saveAnalysis, navigation, setError]);

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

  if (phase.type === "permission_denied") {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{phase.message}</Text>
      </View>
    );
  }

  if (phase.type === "idle" || phase.type === "requesting_permission") {
    return (
      <LoadingSpinner fullScreen message="Initialisation de la camera..." />
    );
  }

  if (phase.type === "success") {
    return (
      <View
        style={[styles.container, styles.successContainer]}
        testID="capture-success"
      >
        {capturedImageUrl && (
          <Image
            source={{ uri: capturedImageUrl }}
            style={styles.previewThumbnail}
            resizeMode="contain"
            testID="captured-image-thumbnail"
          />
        )}
        <Text style={styles.successTitle}>Analyse complete</Text>
        <Text style={styles.successScore}>
          Confiance : {Math.round(phase.confidenceScore * 100)}%
        </Text>
        <Text style={styles.angleLabel}>
          Genou : {phase.angles.kneeAngle.toFixed(1)}
        </Text>
        <Text style={styles.angleLabel}>
          Hanche : {phase.angles.hipAngle.toFixed(1)}
        </Text>
        <Text style={styles.angleLabel}>
          Cheville : {phase.angles.ankleAngle.toFixed(1)}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          testID="save-analysis-button"
        >
          <Text style={styles.saveButtonText}>Sauvegarder l'analyse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardButtonText}>Recommencer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview state: photo taken or uploaded, waiting for analysis
  if (previewUrl && Platform.OS === "web") {
    return (
      <View style={styles.container} testID="capture-preview">
        <Image
          source={{ uri: previewUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          testID="preview-image"
        />
        <View style={styles.previewOverlay}>
          <Text style={styles.previewTitle}>Photo prise</Text>
        </View>
        <View style={styles.controls}>
          {phase.type === "recording" ? (
            <LoadingSpinner message="Analyse en cours..." />
          ) : (
            <>
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                testID="analyze-button"
                accessibilityRole="button"
              >
                <Text style={styles.analyzeButtonText}>Analyser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleRetake}
                testID="retake-button"
              >
                <Text style={styles.retakeButtonText}>Recommencer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="capture-screen">
      {CameraComponent && Platform.OS !== "web" ? (
        <CameraComponent
          style={StyleSheet.absoluteFill}
          device={{ id: "back" }}
          isActive
        />
      ) : Platform.OS === "web" ? (
        <WebCamera
          ref={webCameraRef}
          onPermissionDenied={handleWebCameraPermissionDenied}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
          <Text style={styles.webText}>Camera indisponible</Text>
        </View>
      )}
      <GuidedCameraOverlay
        phase={phase}
        frameCount={frameCount}
        luminosity={luminosity}
        isCorrectPosition={isCorrectPosition}
      />
      {(phase.type === "ready" || phase.type === "recording") && (
        <View style={styles.controls}>
          {phase.type === "ready" ? (
            <>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleStartCapture}
                testID="start-capture-button"
                accessibilityRole="button"
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              {Platform.OS === "web" && (
                <PhotoUpload onPhotoSelected={handlePhotoUploaded} />
              )}
            </>
          ) : (
            <LoadingSpinner message="Capture en cours..." />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  successContainer: {
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successTitle: { color: Colors.success, fontSize: 24, fontWeight: "700" },
  successScore: { color: Colors.textSecondary, fontSize: 16 },
  angleLabel: { color: Colors.textPrimary, fontSize: 18, fontWeight: "500" },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    width: "100%",
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  discardButton: { paddingVertical: Spacing.md },
  discardButtonText: { color: Colors.textSecondary, fontSize: 15 },
  permissionText: {
    color: Colors.error,
    textAlign: "center",
    padding: Spacing.xl,
    fontSize: 16,
  },
  controls: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  webPlaceholder: {
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  webText: { color: Colors.textSecondary, fontSize: 18 },
  previewThumbnail: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.xl + 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: Spacing.md,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: "center",
  },
  analyzeButtonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  retakeButton: { marginTop: Spacing.md, paddingVertical: Spacing.sm },
  retakeButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
