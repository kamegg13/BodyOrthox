import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../../navigation/types";
import { useCaptureLogic } from "../hooks/use-capture-logic";
import { CapturePreview } from "../components/capture-preview";
import { CaptureSuccess } from "../components/capture-success";
import { GuidedCameraOverlay } from "../components/guided-camera-overlay";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { WebCamera } from "../components/web-camera";
import { PhotoUpload } from "../components/photo-upload";

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

export function CaptureScreen() {
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const {
    phase,
    frameCount,
    luminosity,
    isCorrectPosition,
    capturedImageUrl,
    previewUrl,
    mlLoading,
    detectionError,
    lowConfidenceWarning,
    webCameraRef,
    handleWebCameraPermissionDenied,
    handlePhotoUploaded,
    handleAnalyze,
    handleRetake,
    handleStartCapture,
    handleSave,
    handleDiscard,
  } = useCaptureLogic(patientId);

  if (phase.type === "permission_denied") {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{phase.message}</Text>
      </View>
    );
  }

  if (phase.type === "idle" || phase.type === "requesting_permission") {
    return (
      <LoadingSpinner fullScreen message="Initialisation de la caméra..." />
    );
  }

  if (phase.type === "success") {
    return (
      <CaptureSuccess
        capturedImageUrl={capturedImageUrl}
        confidenceScore={phase.confidenceScore}
        angles={phase.angles}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    );
  }

  // Preview state: photo taken or uploaded, waiting for analysis
  if (previewUrl && Platform.OS === "web") {
    return (
      <CapturePreview
        previewUrl={previewUrl}
        isRecording={phase.type === "recording"}
        mlLoading={mlLoading}
        detectionError={detectionError}
        lowConfidenceWarning={lowConfidenceWarning}
        onAnalyze={handleAnalyze}
        onRetake={handleRetake}
      />
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
                accessibilityLabel="Prendre une photo"
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
  container: { flex: 1, backgroundColor: Colors.black },
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
    borderColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  webPlaceholder: {
    backgroundColor: Colors.darkGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  webText: { color: Colors.textSecondary, fontSize: 18 },
});
