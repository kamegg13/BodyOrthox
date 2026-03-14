// Tests unitaires de HkaAngleCalculator — calcul géométrique pur sans ML Kit.
// [Source: docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md#Tâche 1]
import 'package:flutter_test/flutter_test.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

import 'package:bodyorthox/features/capture/data/hka_angle_calculator.dart';

/// Crée un PoseLandmark minimal pour les tests (pas de hardware ML Kit requis).
PoseLandmark _lm({
  required PoseLandmarkType type,
  required double x,
  required double y,
  double likelihood = 0.9,
}) =>
    PoseLandmark(type: type, x: x, y: y, z: 0, likelihood: likelihood);

void main() {
  group('HkaAngleCalculator.calculateHkaAngle', () {
    test('retourne 180.0 pour une jambe parfaitement droite', () {
      // hip=(0,-1) knee=(0,0) ankle=(0,1) → vecteurs antiparallèles → 180°
      final hip = _lm(type: PoseLandmarkType.leftHip, x: 0, y: -1);
      final knee = _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 0);
      final ankle = _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 1);

      expect(HkaAngleCalculator.calculateHkaAngle(hip, knee, ankle), 180.0);
    });

    test('retourne 90.0 pour un angle droit au genou', () {
      // hip=(0,0) knee=(1,0) ankle=(1,1) → vecteurs perpendiculaires → 90°
      final hip = _lm(type: PoseLandmarkType.leftHip, x: 0, y: 0);
      final knee = _lm(type: PoseLandmarkType.leftKnee, x: 1, y: 0);
      final ankle = _lm(type: PoseLandmarkType.leftAnkle, x: 1, y: 1);

      expect(HkaAngleCalculator.calculateHkaAngle(hip, knee, ankle), 90.0);
    });

    test('délègue à AngleCalculator.angleBetween (invariance mise à l\'échelle)', () {
      // Même angle, coordonnées doublées → résultat identique
      final hip1 = _lm(type: PoseLandmarkType.leftHip, x: 0, y: -1);
      final knee1 = _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 0);
      final ankle1 = _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 1);

      final hip2 = _lm(type: PoseLandmarkType.leftHip, x: 0, y: -200);
      final knee2 = _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 0);
      final ankle2 = _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 200);

      expect(
        HkaAngleCalculator.calculateHkaAngle(hip1, knee1, ankle1),
        HkaAngleCalculator.calculateHkaAngle(hip2, knee2, ankle2),
      );
    });
  });

  group('HkaAngleCalculator.averageLikelihood', () {
    test('retourne la moyenne des scores de confiance', () {
      final landmarks = [
        _lm(type: PoseLandmarkType.leftHip, x: 0, y: 0, likelihood: 0.8),
        _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 0, likelihood: 0.9),
        _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 0, likelihood: 0.7),
      ];

      expect(
        HkaAngleCalculator.averageLikelihood(landmarks),
        closeTo(0.8, 1e-9),
      );
    });

    test('retourne 0.0 pour une liste vide', () {
      expect(HkaAngleCalculator.averageLikelihood([]), 0.0);
    });

    test('retourne la valeur unique pour une liste à un élément', () {
      final landmarks = [
        _lm(type: PoseLandmarkType.leftHip, x: 0, y: 0, likelihood: 0.75),
      ];
      expect(HkaAngleCalculator.averageLikelihood(landmarks), 0.75);
    });
  });

  group('HkaAngleCalculator.minLikelihood', () {
    test('retourne le score le plus bas', () {
      final landmarks = [
        _lm(type: PoseLandmarkType.leftHip, x: 0, y: 0, likelihood: 0.8),
        _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 0, likelihood: 0.5),
        _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 0, likelihood: 0.9),
      ];

      expect(HkaAngleCalculator.minLikelihood(landmarks), 0.5);
    });

    test('retourne 0.0 pour une liste vide', () {
      expect(HkaAngleCalculator.minLikelihood([]), 0.0);
    });

    test('retourne la valeur unique pour une liste à un élément', () {
      final landmarks = [
        _lm(type: PoseLandmarkType.leftHip, x: 0, y: 0, likelihood: 0.6),
      ];
      expect(HkaAngleCalculator.minLikelihood(landmarks), 0.6);
    });

    test('retourne 0.0 quand tous les scores sont 0', () {
      final landmarks = [
        _lm(type: PoseLandmarkType.leftHip, x: 0, y: 0, likelihood: 0.0),
        _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 0, likelihood: 0.0),
      ];
      expect(HkaAngleCalculator.minLikelihood(landmarks), 0.0);
    });
  });
}
