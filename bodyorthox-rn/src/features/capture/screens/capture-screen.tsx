import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../../navigation/types";
import { usePatientsStore } from "../../patients/store/patients-store";
import { patientDisplayName } from "../../patients/domain/patient";
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
  sizes,
  spacing,
} from "../../../theme/tokens";
import { WebCamera } from "../components/web-camera";
import { PhotoUpload } from "../components/photo-upload";

type Route = RouteProp<RootStackParamList, "Capture">;

export function CaptureScreen() {
  const { params } = useRoute<Route>();
  const { patientId } = params;
  const navigation = useNavigation();
  const patient = usePatientsStore((s) => s.patients.find((p) => p.id === patientId));
  const topTitle = patient ? `Capture — ${patientDisplayName(patient)}` : "Capture";

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

  // Preview state: photo taken or uploaded, waiting for analysis.
  // Testé AVANT permission_denied : sans caméra, l'import photo doit
  // quand même mener à la preview (sinon le bouton Importer est sans effet).
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

  if (phase.type === "permission_denied") {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="alert" size={40} color={colors.red} strokeWidth={1.4} />
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

  return (
    <View style={styles.container} testID="capture-screen">
      {/* Barre supérieure — retour + patient */}
      <SafeAreaView edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={6}
          >
            <Icon name="back" size={16} color={colors.white70} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {topTitle}
          </Text>
          <View style={styles.roundSpacer} />
        </View>
      </SafeAreaView>

      {/* Viseur contenu — caméra + overlay guidé */}
      <View style={styles.viewfinder}>
        {Platform.OS === "web" ? (
          <WebCamera
            ref={webCameraRef}
            onPermissionDenied={handleWebCameraPermissionDenied}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.nativePlaceholder]}>
            <Icon name="camera" size={40} color={colors.white40} strokeWidth={1.4} />
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
      </View>

      {(phase.type === "ready" || phase.type === "recording") &&
        Platform.OS === "web" && (
          <View style={styles.controls} testID="capture-controls">
            {phase.type === "ready" ? (
              <>
                <Text style={styles.captureHint}>
                  L'analyse HKA démarre automatiquement
                </Text>
                <View style={styles.controlsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.sideBtn, pressed && styles.pressed]}
                    onPress={() => webCameraRef.current?.switchCamera()}
                    testID="switch-camera-button"
                    accessibilityRole="button"
                    accessibilityLabel="Changer de caméra"
                  >
                    <View style={styles.sideBtnIcon}>
                      <Icon name="flip" size={17} color={colors.white70} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.sideBtnLabel}>Caméra</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.shutter, pressed && styles.pressed]}
                    onPress={handleStartCapture}
                    testID="start-capture-button"
                    accessibilityRole="button"
                    accessibilityLabel="Prendre une photo"
                  >
                    <View style={styles.shutterInner} />
                  </Pressable>
                  <PhotoUpload onPhotoSelected={handlePhotoUploaded} />
                </View>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s10,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s12,
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: fontSize.navTitle,
    fontWeight: fontWeight.medium,
    color: colors.textInverse,
  },
  roundBtn: {
    width: sizes.tap,
    height: sizes.tap,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: colors.white20,
    backgroundColor: colors.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  roundSpacer: {
    width: sizes.tap,
    height: sizes.tap,
  },
  viewfinder: {
    flex: 1,
    marginHorizontal: spacing.s16,
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: colors.white20,
    overflow: "hidden",
    backgroundColor: colors.captureViewfinderTo,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    alignSelf: "stretch",
  },
  sideBtn: {
    alignItems: "center",
    gap: 6,
    minWidth: sizes.tap,
  },
  sideBtnIcon: {
    width: sizes.tap,
    height: sizes.tap,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.white20,
    backgroundColor: colors.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.white60,
  },
  shutter: {
    width: radius.shutterOuter * 2,
    height: radius.shutterOuter * 2,
    borderRadius: radius.shutterOuter,
    borderWidth: 3,
    borderColor: colors.textInverse,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: radius.shutterInner * 2,
    height: radius.shutterInner * 2,
    borderRadius: radius.shutterInner,
    backgroundColor: colors.secondary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s24,
    gap: spacing.s16,
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
    alignItems: "center",
    paddingHorizontal: spacing.s20,
    paddingTop: spacing.s14,
    paddingBottom: spacing.s24,
    gap: spacing.s14,
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
    gap: spacing.s16,
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
