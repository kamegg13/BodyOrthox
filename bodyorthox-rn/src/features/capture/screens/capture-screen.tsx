import React, { useCallback, useEffect, useRef } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/types';
import { useCaptureStore } from '../store/capture-store';
import { GuidedCameraOverlay } from '../components/guided-camera-overlay';
import { LoadingSpinner } from '../../../shared/components/loading-spinner';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing, BorderRadius } from '../../../shared/design-system/spacing';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Capture'>;

// Dynamic camera import – avoids crashes on web
let CameraComponent: React.ComponentType<Record<string, unknown>> | null = null;
if (Platform.OS !== 'web') {
  try {
    const { Camera } = require('react-native-vision-camera');
    CameraComponent = Camera;
  } catch { /* unavailable */ }
}

export function CaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { patientId } = params;

  const {
    phase, frameCount, luminosity, isCorrectPosition,
    requestPermission, permissionGranted, permissionDenied,
    startRecording, addFrame, saveAnalysis,
    reset, setError, processFrames,
  } = useCaptureStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestPermission();
    if (Platform.OS === 'web') {
      permissionGranted();
    } else {
      (async () => {
        try {
          const { Camera } = require('react-native-vision-camera');
          const status = await Camera.requestCameraPermission();
          if (status === 'granted') permissionGranted();
          else permissionDenied('Accès caméra refusé. Activez-le dans les réglages.');
        } catch {
          permissionDenied("Impossible d'accéder à la caméra.");
        }
      })();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      reset();
    };
  }, []);

  const handleStartCapture = useCallback(async () => {
    if (phase.type !== 'ready') return;
    startRecording();

    if (Platform.OS === 'web') {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 50));
        addFrame();
      }
    } else {
      timerRef.current = setTimeout(() => {}, 100);
    }

    // Simulate ML analysis (replace with real ML Kit / Vision Camera frame processor)
    processFrames({
      11: { x: 0.4, y: 0.2, visibility: 0.95 },
      12: { x: 0.6, y: 0.2, visibility: 0.95 },
      23: { x: 0.42, y: 0.5, visibility: 0.9 },
      24: { x: 0.58, y: 0.5, visibility: 0.9 },
      25: { x: 0.42, y: 0.72, visibility: 0.88 },
      26: { x: 0.58, y: 0.72, visibility: 0.88 },
      27: { x: 0.42, y: 0.92, visibility: 0.85 },
      28: { x: 0.58, y: 0.92, visibility: 0.85 },
      30: { x: 0.60, y: 0.96, visibility: 0.8 },
    });
  }, [phase, startRecording, addFrame, processFrames]);

  const handleSave = useCallback(async () => {
    if (phase.type !== 'success') return;
    const analysis = await saveAnalysis(patientId);
    if (analysis) {
      navigation.replace('Results', { analysisId: analysis.id, patientId });
    } else {
      setError("Impossible de sauvegarder l'analyse.");
    }
  }, [phase, patientId, saveAnalysis, navigation, setError]);

  const handleDiscard = useCallback(() => {
    Alert.alert('Annuler', 'Voulez-vous vraiment annuler cette analyse ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => { reset(); navigation.goBack(); } },
    ]);
  }, [reset, navigation]);

  if (phase.type === 'permission_denied') {
    return <View style={styles.container}><Text style={styles.permissionText}>🚫 {phase.message}</Text></View>;
  }

  if (phase.type === 'idle' || phase.type === 'requesting_permission') {
    return <LoadingSpinner fullScreen message="Initialisation de la caméra..." />;
  }

  if (phase.type === 'success') {
    return (
      <View style={[styles.container, styles.successContainer]} testID="capture-success">
        <Text style={styles.successTitle}>✅ Analyse complète</Text>
        <Text style={styles.successScore}>Confiance : {Math.round(phase.confidenceScore * 100)}%</Text>
        <Text style={styles.angleLabel}>Genou : {phase.angles.kneeAngle.toFixed(1)}°</Text>
        <Text style={styles.angleLabel}>Hanche : {phase.angles.hipAngle.toFixed(1)}°</Text>
        <Text style={styles.angleLabel}>Cheville : {phase.angles.ankleAngle.toFixed(1)}°</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} testID="save-analysis-button">
          <Text style={styles.saveButtonText}>Sauvegarder l'analyse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardButtonText}>Recommencer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="capture-screen">
      {CameraComponent && Platform.OS !== 'web' ? (
        <CameraComponent style={StyleSheet.absoluteFill} device={{ id: 'back' }} isActive />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
          <Text style={styles.webText}>📷 Caméra (simulation web)</Text>
        </View>
      )}
      <GuidedCameraOverlay phase={phase} frameCount={frameCount} luminosity={luminosity} isCorrectPosition={isCorrectPosition} />
      {(phase.type === 'ready' || phase.type === 'recording') && (
        <View style={styles.controls}>
          {phase.type === 'ready' ? (
            <TouchableOpacity style={styles.captureButton} onPress={handleStartCapture} testID="start-capture-button" accessibilityRole="button">
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
  container: { flex: 1, backgroundColor: '#000' },
  successContainer: { backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  successTitle: { color: Colors.success, fontSize: 24, fontWeight: '700' },
  successScore: { color: Colors.textSecondary, fontSize: 16 },
  angleLabel: { color: Colors.textPrimary, fontSize: 18, fontWeight: '500' },
  saveButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg, width: '100%', alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  discardButton: { paddingVertical: Spacing.md },
  discardButtonText: { color: Colors.textSecondary, fontSize: 15 },
  permissionText: { color: Colors.error, textAlign: 'center', padding: Spacing.xl, fontSize: 16 },
  controls: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureButtonInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  webPlaceholder: { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  webText: { color: Colors.textSecondary, fontSize: 18 },
});
