// Calcul géométrique HKA — wrapper HKA-spécifique autour de AngleCalculator.
//
// Séparation intentionnelle : AngleCalculator est couplé au pipeline vidéo
// legacy (ArticularAngles, médiane multi-frames). HkaAngleCalculator est
// un wrapper minimal HKA-spécifique sans dépendance aux vieux types.
//
// [Source: docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md#Tâche 1]
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import 'angle_calculator.dart';

/// Calculs géométriques spécifiques à l'analyse HKA (Hip-Knee-Ankle).
///
/// Toutes les méthodes sont statiques — aucun état, aucun effet de bord.
/// Délègue le calcul d'angle à [AngleCalculator.angleBetween] (loi des cosinus).
class HkaAngleCalculator {
  /// Calcule l'angle HKA : angle au genou entre les segments hip→knee et ankle→knee.
  ///
  /// Délègue à [AngleCalculator.angleBetween] pour éviter la duplication.
  /// Retourne l'angle en degrés arrondi à 1 décimale (≈180° jambe droite).
  ///
  /// [hip] : landmark hanche (H), [knee] : landmark genou (K), [ankle] : landmark cheville (A).
  static double calculateHkaAngle(
    PoseLandmark hip,
    PoseLandmark knee,
    PoseLandmark ankle,
  ) =>
      AngleCalculator.angleBetween(hip, knee, ankle);

  /// Moyenne des scores de confiance (likelihood) d'une liste de landmarks.
  ///
  /// Retourne 0.0 si la liste est vide.
  static double averageLikelihood(List<PoseLandmark> landmarks) {
    if (landmarks.isEmpty) return 0.0;
    return landmarks.map((l) => l.likelihood).reduce((a, b) => a + b) /
        landmarks.length;
  }

  /// Score de confiance minimum parmi une liste de landmarks.
  ///
  /// Utilisé pour déclencher [MLLowConfidence] si min < seuil du module.
  /// Retourne 0.0 si la liste est vide.
  static double minLikelihood(List<PoseLandmark> landmarks) {
    if (landmarks.isEmpty) return 0.0;
    return landmarks.map((l) => l.likelihood).reduce((a, b) => a < b ? a : b);
  }
}
