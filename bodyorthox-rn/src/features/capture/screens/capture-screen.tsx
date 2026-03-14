import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCaptureStore } from '../store/capture-store';
import { GuidedCameraOverlay } from '../components/guided-camera-overlay';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';

// Dynamic import to avoid web crash on camera
let CameraView: React.ComponentType<Record<string, unknown>> | null = null;
if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView ?? cam.Camera;
  } catch {
    // camera unavailable
  }
}

export function CaptureScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const {
    phase,
    frameCount,
    luminosity,
    isCorrectPosition,
    requestPermission,
    permissionGranted,
    permissionDenied,
    startRecording,
    addFrame,
    saveAnalysis,
    setLuminosity,
    setCorrectPosition,
    reset,
    setError,
  } = useCaptureStore();

  const cameraRef = useRef<unknown>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestPermission();
    if (Platform.OS === 'web') {
      // Web: skip camera permission
      permissionGranted();
    } else {
      (async () => {
        try {
          const { Camera } = require('expo-camera');
          const { status } = await Camera.requestCameraPermissionsAsync();
          if (status === 'granted') {
            permissionGranted();
          } else {
            permissionDenied('Accès caméra refusé. Activez-le dans les réglages.');
          }
        } catch {
          permissionDenied('Impossible d\'accéder à la caméra.');
        }
      })();
    }

    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      reset();
    };
  }, []);

  const handleStartCapture = useCallback(async () => {
    if (phase.type !== 'ready') return;

    if (Platform.OS === 'web') {
      // Web: simulate ML analysis
      startRecording();
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 50));
        addFrame();
      }
      // Simulated landmarks
      useCaptureStore.getState().processFrames({
        11: { x: 0.4, y: 0.2, visibility: 0.95 },
        12: { x: 0.6, y: 0.2, visibility: 0.95 },
        23: { x: 0.4, y: 0.5, visibility: 0.9 },
        24: { x: 0.6, y: 0.5, visibility: 0.9 },
        25: { x: 0.4, y: 0.7, visibility: 0.88 },
        26: { x: 0.6, y: 0.7, visibility: 0.88 },
        27: { x: 0.4, y: 0.9, visibility: 0.85 },
        28: { x: 0.6, y: 0.9, visibility: 0.85 },
        29: { x: 0.38, y: 0.95, visibility: 0.8 },
        30: { x: 0.62, y: 0.95, visibility: 0.8 },
      });
      return;
    }

    startRecording();
    // Stop after 5 seconds of recording
    recordingTimerRef.current = setTimeout(async () => {
      // In a real implementation, collect frames from camera and run ML Kit
      useCaptureStore.getState().processFrames({
        24: { x: 0.5, y: 0.4, visibility: 0.9 },
        26: { x: 0.52, y: 0.65, visibility: 0.88 },
        28: { x: 0.51, y: 0.88, visibility: 0.85 },
        12: { x: 0.58, y: 0.25, visibility: 0.95 },
        11: { x: 0.42, y: 0.25, visibility: 0.95 },
        30: { x: 0.52, y: 0.93, visibility: 0.8 },
      });
    }, 5000);
  }, [phase, startRecording, addFrame]);

  const handleSave = useCallback(async () => {
    if (!patientId || phase.type !== 'success') return;
    const analysis = await saveAnalysis(patientId);
    if (analysis) {
      router.replace(`/patients/${patientId}/analyses/${analysis.id}`);
    } else {
      setError('Impossible de sauvegarder l\'analyse.');
    }
  }, [patientId, phase, saveAnalysis, setError]);

  const handleDiscard = useCallback(() => {
    Alert.alert(
      'Annuler l\'analyse',
      'Voulez-vous vraiment annuler cette analyse ?',
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', style: 'destructive', onPress: () => { reset(); router.back(); } },
      ]
    );
  }, [reset]);

  // Permission denied
  if (phase.type === 'permission_denied') {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>🚫 {phase.message}</Text>
      </View>
    );
  }

  // Loading / initialising
  if (phase.type === 'idle' || phase.type === 'requesting_permission') {
    return <LoadingSpinner fullScreen message="Initialisation de la caméra..." />;
  }

  // Success – show save/discard actions
  if (phase.type === 'success') {
    return (
      <View style={[styles.container, styles.successContainer]} testID="capture-success">
        <Text style={styles.successTitle}>✅ Analyse complète</Text>
        <Text style={styles.successScore}>
          Confiance : {Math.round(phase.confidenceScore * 100)}%
        </Text>
        <Text style={styles.angleLabel}>
          Genou : {phase.angles.kneeAngle.toFixed(1)}°
        </Text>
        <Text style={styles.angleLabel}>
          Hanche : {phase.angles.hipAngle.toFixed(1)}°
        </Text>
        <Text style={styles.angleLabel}>
          Cheville : {phase.angles.ankleAngle.toFixed(1)}°
        </Text>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} testID="save-analysis-button">
          <Text style={styles.saveButtonText}>Sauvegarder l'analyse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardButtonText}>Recommencer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container} testID="capture-screen">
      {CameraView && Platform.OS !== 'web' ? (
        <CameraView
          ref={cameraRef as React.Ref<unknown>}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webCameraPlaceholder]}>
          <Text style={styles.webCameraText}>📷 Caméra (simulation web)</Text>
        </View>
      )}

      <GuidedCameraOverlay
        phase={phase}
        frameCount={frameCount}
        luminosity={luminosity}
        isCorrectPosition={isCorrectPosition}
      />

      {/* Capture button */}
      {(phase.type === 'ready' || phase.type === 'recording') && (
        <View style={styles.controls}>
          {phase.type === 'ready' ? (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleStartCapture}
              testID="start-capture-button"
              accessibilityRole="button"
              accessibilityLabel="Démarrer l'analyse"
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          ) : (
            <LoadingSpinner message="Capture en cours..." />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  successContainer: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successTitle: {
    color: Colors.success,
    fontSize: 24,
    fontWeight: '700',
  },
  successScore: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  angleLabel: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  discardButton: {
    paddingVertical: Spacing.md,
  },
  discardButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  permissionText: {
    color: Colors.error,
    textAlign: 'center',
    padding: Spacing.xl,
    fontSize: 16,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  webCameraPlaceholder: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCameraText: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
});
