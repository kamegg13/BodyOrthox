import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
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
import { Btn } from "../../../components/Btn";
import { Icon } from "../../../components/icons";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../../theme/tokens";
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
                <Btn
                  label="Prendre une photo"
                  icon="camera"
                  onPress={handleStartCapture}
                  full
                  testID="start-capture-button"
                />
                <Text style={styles.captureHint}>
                  L'analyse HKA démarre automatiquement
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.translucentButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => webCameraRef.current?.switchCamera()}
                  testID="switch-camera-button"
                  accessibilityRole="button"
                  accessibilityLabel="Changer de caméra"
                >
                  <View style={styles.translucentButtonRow}>
                    <Icon name="flip" size={15} color={colors.white} strokeWidth={1.6} />
                    <Text style={styles.translucentButtonText}>Changer de caméra</Text>
                  </View>
                </Pressable>
                <PhotoUpload onPhotoSelected={handlePhotoUploaded} />
              </>
            ) : (
              <LoadingSpinner message="Capture en cours..." />
            )}
          </View>
        )}
      {phase.type === "ready" && Platform.OS !== "web" && (
        <View style={styles.controls}>
          <Btn
            label="Prendre une photo"
            icon="camera"
            onPress={handleNativeCamera}
            full
            testID="native-camera-button"
          />
          <Pressable
            style={({ pressed }) => [
              styles.translucentButton,
              pressed && styles.pressed,
            ]}
            onPress={handleNativeGallery}
            testID="native-gallery-button"
            accessibilityRole="button"
            accessibilityLabel="Choisir depuis la galerie"
          >
            <View style={styles.translucentButtonRow}>
              <Icon name="image" size={15} color={colors.white} strokeWidth={1.6} />
              <Text style={styles.translucentButtonText}>Choisir depuis la galerie</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.captureBg },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s24,
    gap: spacing.s16,
  },
  permissionIcon: {
    fontSize: 48,
  },
  permissionTitle: {
    color: colors.red,
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    textAlign: "center",
  },
  permissionText: {
    color: colors.white70,
    textAlign: "center",
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
  },
  permissionActions: {
    width: "100%",
    marginTop: spacing.s20,
  },
  controls: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.s20,
    gap: spacing.s10,
  },
  captureHint: {
    color: colors.white60,
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    textAlign: "center",
  },
  nativePlaceholder: {
    backgroundColor: colors.captureViewfinderFrom,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s24,
  },
  nativeInstructionTitle: {
    fontSize: 48,
    marginBottom: spacing.s16,
  },
  nativeInstructionText: {
    color: colors.white60,
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    textAlign: "center",
  },
  translucentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white12,
    borderColor: colors.white20,
    borderWidth: 1,
    borderRadius: radius.button,
    minHeight: 44,
    width: "100%",
    paddingHorizontal: spacing.s16,
  },
  translucentButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s8,
  },
  translucentButtonText: {
    color: colors.textInverse,
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  pressed: {
    opacity: 0.85,
  },
});
