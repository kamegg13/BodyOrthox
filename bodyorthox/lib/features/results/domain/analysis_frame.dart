// Modèle de données pour chaque frame du replay expert (Story 3.5).
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#DevNotes]
import 'package:flutter/rendering.dart';

import '../../capture/domain/articular_angles.dart';
import '../../capture/domain/confidence_score.dart';

/// Position normalisée d'un point articulaire (0.0–1.0) dans le viewport du replay.
class JointPosition {
  final String joint; // 'head', 'shoulder', 'hip', 'knee', 'ankle'
  Offset normalizedPosition;

  JointPosition({required this.joint, required this.normalizedPosition});
}

/// Un frame du replay expert — angles + positions articulaires + confiances.
///
/// Ne stocke PAS de données vidéo réelles (ui.Image) pour le MVP :
/// le replay utilise l'overlay squelette. Les frames réels seront intégrés
/// en Phase 2 quand le pipeline ML persistera les keyframes.
///
/// Les [jointPositions] sont mutables pour permettre la correction drag/tap.
/// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Architecture-ReplayViewer]
class AnalysisFrame {
  final int frameIndex;
  final ArticularAngles angles;
  final ConfidenceScore confidence;

  /// Positions normalisées des articulations — mutables pour la correction.
  final Map<String, JointPosition> jointPositions;

  AnalysisFrame({
    required this.frameIndex,
    required this.angles,
    required this.confidence,
    required this.jointPositions,
  });

  /// Crée un frame avec positions squelettiques par défaut (vue de profil).
  factory AnalysisFrame.withDefaultPositions({
    required int frameIndex,
    required ArticularAngles angles,
    required ConfidenceScore confidence,
  }) {
    return AnalysisFrame(
      frameIndex: frameIndex,
      angles: angles,
      confidence: confidence,
      jointPositions: {
        'head': JointPosition(joint: 'head', normalizedPosition: const Offset(0.5, 0.08)),
        'shoulder': JointPosition(joint: 'shoulder', normalizedPosition: const Offset(0.5, 0.22)),
        'hip': JointPosition(joint: 'hip', normalizedPosition: const Offset(0.5, 0.45)),
        'knee': JointPosition(joint: 'knee', normalizedPosition: const Offset(0.5, 0.65)),
        'ankle': JointPosition(joint: 'ankle', normalizedPosition: const Offset(0.5, 0.85)),
      },
    );
  }

  /// Crée une copie du frame avec la position d'un joint mise à jour.
  AnalysisFrame withJointAt(String joint, Offset newPosition) {
    final updated = Map<String, JointPosition>.from(jointPositions);
    updated[joint] = JointPosition(joint: joint, normalizedPosition: newPosition);
    return AnalysisFrame(
      frameIndex: frameIndex,
      angles: angles,
      confidence: confidence,
      jointPositions: updated,
    );
  }
}
