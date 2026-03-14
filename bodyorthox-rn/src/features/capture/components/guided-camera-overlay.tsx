import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CapturePhase } from '../domain/capture-state';
import { LuminosityIndicator } from './luminosity-indicator';
import { Colors } from '../../../shared/design-system/colors';
import { Spacing } from '../../../shared/design-system/spacing';

interface GuidedCameraOverlayProps {
  phase: CapturePhase;
  frameCount: number;
  luminosity: number;
  isCorrectPosition: boolean;
}

export function GuidedCameraOverlay({
  phase,
  frameCount,
  luminosity,
  isCorrectPosition,
}: GuidedCameraOverlayProps) {
  return (
    <View style={styles.overlay} testID="guided-camera-overlay">
      {/* Top status bar */}
      <View style={styles.topBar}>
        <LuminosityIndicator value={luminosity} />
        {phase.type === 'recording' && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{frameCount} frames</Text>
          </View>
        )}
      </View>

      {/* Centre guide */}
      <View style={styles.centre}>
        <View style={[styles.silhouetteBorder, !isCorrectPosition && styles.silhouetteBorderWarn]} />

        {!isCorrectPosition && (
          <View style={styles.positionHint}>
            <Text style={styles.positionHintText}>
              Placez le patient entier dans le cadre
            </Text>
          </View>
        )}
      </View>

      {/* Bottom GDPR */}
      <View style={styles.bottomBar}>
        <Text style={styles.gdprText}>
          BodyOrthox utilise votre caméra uniquement pendant l'analyse.{'\n'}
          La vidéo reste sur votre appareil.
        </Text>

        {phase.type === 'processing' && (
          <Text style={styles.processingText}>⚙️ Analyse en cours...</Text>
        )}

        {phase.type === 'error' && (
          <Text style={styles.errorText}>⚠️ {phase.message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteBorder: {
    width: '55%',
    aspectRatio: 0.4,
    borderWidth: 2,
    borderColor: Colors.success,
    borderRadius: 40,
    opacity: 0.8,
  },
  silhouetteBorderWarn: {
    borderColor: Colors.warning,
    borderStyle: 'dashed',
  },
  positionHint: {
    position: 'absolute',
    bottom: Spacing.sm,
    backgroundColor: `${Colors.warning}CC`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  positionHintText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    padding: Spacing.md,
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gdprText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  processingText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
});
