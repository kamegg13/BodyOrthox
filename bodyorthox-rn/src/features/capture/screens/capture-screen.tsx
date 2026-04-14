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
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";
import { WebCamera } from "../components/web-camera";
import { PhotoUpload } from "../components/photo-upload";

type Route = RouteProp<RootStackParamList, "Capture">;

export function CaptureScreen() {
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const {
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
    handlePhotoUploaded,
    handleNativeCamera,
    handleNativeGallery,
    handleAnalyze,
    handleRetake,
    handleStartCapture,
    handleSave,
    handleDiscard,
  } = useCaptureLogic(patientId);

  if (phase.type === "permission_denied") {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>🚫</Text>
          <Text style={styles.permissionTitle}>Accès caméra refusé</Text>
          <Text style={styles.permissionText}>{phase.message}</Text>
          <View style={styles.permissionActions}>
            <PhotoUpload onPhotoSelected={handlePhotoUploaded} />
          </View>
        </View>
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
        bilateralAngles={phase.bilateralAngles}
        landmarks={detectedLandmarks}
        allLandmarks={allDetectedLandmarks}
        anatomicalValidation={phase.anatomicalValidation}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    );
  }

  // Preview state: photo taken or uploaded, waiting for analysis
  if (previewUrl) {
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
      {Platform.OS === "web" ? (
        <WebCamera
          ref={webCameraRef}
          onPermissionDenied={handleWebCameraPermissionDenied}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.nativePlaceholder]}>
          <Text style={styles.nativeInstructionTitle}>📷</Text>
          <Text style={styles.nativeInstructionText}>
            Prenez une photo du patient ou importez depuis votre galerie
          </Text>
        </View>
      )}
      <GuidedCameraOverlay
        phase={phase}
        frameCount={frameCount}
        luminosity={luminosity}
        isCorrectPosition={isCorrectPosition}
      />
      {(phase.type === "ready" || phase.type === "recording") &&
        Platform.OS === "web" && (
          <View style={styles.controls} testID="capture-controls">
            {phase.type === "ready" ? (
              <>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleStartCapture}
                  testID="start-capture-button"
                  accessibilityRole="button"
                  accessibilityLabel="Prendre une photo"
                  activeOpacity={0.8}
                >
                  <Text style={styles.captureButtonIcon}>📷</Text>
                  <Text style={styles.captureButtonText}>
                    Prendre une photo
                  </Text>
                </TouchableOpacity>
                <Text style={styles.captureHint}>
                  L'analyse HKA démarre automatiquement
                </Text>
                <PhotoUpload onPhotoSelected={handlePhotoUploaded} />
              </>
            ) : (
              <LoadingSpinner message="Capture en cours..." />
            )}
          </View>
        )}
      {phase.type === "ready" && Platform.OS !== "web" && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleNativeCamera}
            testID="native-camera-button"
          >
            <Text style={styles.captureButtonIcon}>📷</Text>
            <Text style={styles.captureButtonText}>Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleNativeGallery}
            testID="native-gallery-button"
          >
            <Text style={styles.galleryButtonText}>
              📁 Choisir depuis la galerie
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permissionIcon: {
    fontSize: 48,
  },
  permissionTitle: {
    color: Colors.error,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    textAlign: "center",
  },
  permissionText: {
    color: Colors.textOnPrimary,
    textAlign: "center",
    fontSize: FontSize.sm,
    opacity: 0.75,
  },
  permissionActions: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  controls: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    height: 56,
    width: "100%",
    gap: Spacing.sm,
  },
  captureButtonIcon: {
    fontSize: 20,
  },
  captureButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
  },
  captureHint: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: "center",
  },
  nativePlaceholder: {
    backgroundColor: Colors.darkGrey,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  nativeInstructionTitle: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  nativeInstructionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: "center",
  },
  galleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.darkGrey,
    borderRadius: BorderRadius.button,
    height: 48,
    width: "100%",
  },
  galleryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
