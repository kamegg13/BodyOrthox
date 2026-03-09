// Tests unitaires de HKAModule — aucun hardware ML Kit requis.
// MockPoseDetector via mocktail sur PoseDetectorInterface.
// [Source: docs/implementation-artifacts/arch-2-hka-module-premier-module-concret.md#Tâche 3]
import 'package:cross_file/cross_file.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:mocktail/mocktail.dart';

import 'package:bodyorthox/core/analysis/analysis_result.dart';
import 'package:bodyorthox/features/capture/data/hka_module.dart';

// --- Mocks et Fakes -----------------------------------------------------------

class _MockPoseDetector extends Mock implements PoseDetectorInterface {}

/// Fake pour InputImage — requis par mocktail.any() sur les types non-nullable.
/// InputImage est passé à processImage() mais jamais inspecté par le mock.
class _FakeInputImage extends Fake implements InputImage {}

// --- Helpers ------------------------------------------------------------------

/// Crée un PoseLandmark avec les valeurs spécifiées.
PoseLandmark _lm({
  required PoseLandmarkType type,
  required double x,
  required double y,
  double likelihood = 0.9,
}) =>
    PoseLandmark(type: type, x: x, y: y, z: 0, likelihood: likelihood);

/// Crée une Pose complète avec 6 landmarks HKA gauche+droit.
///
/// Coordonnées : jambe gauche sur x=0, droite sur x=200 → angle HKA = 180° (ligne droite).
/// [leftHipLikelihood] permet de surcharger le likelihood d'un landmark individuel
/// pour les tests de bas score de confiance.
Pose _makePose({
  double likelihood = 0.9,
  double? leftHipLikelihood,
}) {
  return Pose(
    landmarks: {
      PoseLandmarkType.leftHip: _lm(
        type: PoseLandmarkType.leftHip,
        x: 0,
        y: 0,
        likelihood: leftHipLikelihood ?? likelihood,
      ),
      PoseLandmarkType.leftKnee:
          _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 100, likelihood: likelihood),
      PoseLandmarkType.leftAnkle:
          _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 200, likelihood: likelihood),
      PoseLandmarkType.rightHip:
          _lm(type: PoseLandmarkType.rightHip, x: 200, y: 0, likelihood: likelihood),
      PoseLandmarkType.rightKnee:
          _lm(type: PoseLandmarkType.rightKnee, x: 200, y: 100, likelihood: likelihood),
      PoseLandmarkType.rightAnkle:
          _lm(type: PoseLandmarkType.rightAnkle, x: 200, y: 200, likelihood: likelihood),
    },
  );
}

/// Crée une Pose avec un landmark manquant (pour tester la gestion des null — AC#2).
Pose _makePoseWithMissingLandmark() {
  return Pose(
    landmarks: {
      // leftHip intentionnellement absent
      PoseLandmarkType.leftKnee:
          _lm(type: PoseLandmarkType.leftKnee, x: 0, y: 100),
      PoseLandmarkType.leftAnkle:
          _lm(type: PoseLandmarkType.leftAnkle, x: 0, y: 200),
      PoseLandmarkType.rightHip:
          _lm(type: PoseLandmarkType.rightHip, x: 200, y: 0),
      PoseLandmarkType.rightKnee:
          _lm(type: PoseLandmarkType.rightKnee, x: 200, y: 100),
      PoseLandmarkType.rightAnkle:
          _lm(type: PoseLandmarkType.rightAnkle, x: 200, y: 200),
    },
  );
}

void main() {
  setUpAll(() {
    // mocktail requiert registerFallbackValue pour tout type utilisé avec any().
    // InputImage est passé à processImage() — on enregistre un Fake.
    registerFallbackValue(_FakeInputImage());
  });

  late _MockPoseDetector mockDetector;
  late HKAModule module;
  final testPhoto = XFile('/test/photo.jpg');

  setUp(() {
    mockDetector = _MockPoseDetector();
    module = HKAModule(detectorFactory: () => mockDetector);

    // close() est toujours stubbé — appelé dans le finally de chaque chemin.
    when(() => mockDetector.close()).thenAnswer((_) async {});
  });

  group('HKAModule — happy path (AC#2, #3)', () {
    test('retourne AnalysisSuccess avec les 4 clés quand likelihood ≥ 0.7', () async {
      final pose = _makePose(likelihood: 0.9);
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => [pose]);

      final result = await module.analyze(testPhoto);

      expect(result, isA<AnalysisSuccess>());
      final success = result as AnalysisSuccess;
      expect(success.measurements.keys,
          containsAll(['hka_left', 'hka_right', 'confidence_left', 'confidence_right']));
      // Ligne droite → angle = 180°
      expect(success.measurements['hka_left'], 180.0);
      expect(success.measurements['hka_right'], 180.0);
      expect(success.measurements['confidence_left'], closeTo(0.9, 1e-9));
      expect(success.measurements['confidence_right'], closeTo(0.9, 1e-9));
    });

    test('close() est appelé après succès (AC#7)', () async {
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => [_makePose()]);

      await module.analyze(testPhoto);

      verify(() => mockDetector.close()).called(1);
    });

    test('appels successifs créent un nouveau détecteur à chaque fois (cycle de vie)', () async {
      // Deux MockDetectors distincts — un par appel analyze().
      final mockDetector2 = _MockPoseDetector();
      when(() => mockDetector2.close()).thenAnswer((_) async {});
      when(() => mockDetector2.processImage(any()))
          .thenAnswer((_) async => [_makePose()]);

      var callCount = 0;
      final multiCallModule = HKAModule(
        detectorFactory: () => callCount++ == 0 ? mockDetector : mockDetector2,
      );

      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => [_makePose()]);

      await multiCallModule.analyze(testPhoto);
      await multiCallModule.analyze(testPhoto);

      // Chaque détecteur est créé et fermé exactement une fois.
      verify(() => mockDetector.close()).called(1);
      verify(() => mockDetector2.close()).called(1);
    });
  });

  group('HKAModule — MLLowConfidence (AC#4)', () {
    test('retourne AnalysisFailure(MLLowConfidence) quand min likelihood < 0.7', () async {
      final pose = _makePose(likelihood: 0.9, leftHipLikelihood: 0.5);
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => [pose]);

      final result = await module.analyze(testPhoto);

      expect(result, isA<AnalysisFailure>());
      final failure = result as AnalysisFailure;
      expect(failure.error, isA<MLLowConfidence>());
      expect((failure.error as MLLowConfidence).score, 0.5);
    });

    test('close() est appelé après MLLowConfidence (AC#7)', () async {
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => [_makePose(likelihood: 0.9, leftHipLikelihood: 0.5)]);

      await module.analyze(testPhoto);

      verify(() => mockDetector.close()).called(1);
    });
  });

  group('HKAModule — MLDetectionFailed (AC#5)', () {
    test('retourne AnalysisFailure(MLDetectionFailed) quand processImage retourne []', () async {
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => []);

      final result = await module.analyze(testPhoto);

      expect(result, isA<AnalysisFailure>());
      expect((result as AnalysisFailure).error, isA<MLDetectionFailed>());
    });

    test('retourne MLDetectionFailed quand un landmark est absent de la Pose (AC#2)', () async {
      // Pose détectée mais leftHip manquant dans landmarks map
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => [_makePoseWithMissingLandmark()]);

      final result = await module.analyze(testPhoto);

      expect(result, isA<AnalysisFailure>());
      expect((result as AnalysisFailure).error, isA<MLDetectionFailed>());
    });

    test('close() est appelé après MLDetectionFailed (AC#7)', () async {
      when(() => mockDetector.processImage(any()))
          .thenAnswer((_) async => []);

      await module.analyze(testPhoto);

      verify(() => mockDetector.close()).called(1);
    });
  });

  group('HKAModule — PhotoProcessingError (AC#6)', () {
    test('retourne AnalysisFailure(PhotoProcessingError) quand processImage throw Exception', () async {
      when(() => mockDetector.processImage(any()))
          .thenThrow(Exception('io error'));

      final result = await module.analyze(testPhoto);

      expect(result, isA<AnalysisFailure>());
      final failure = result as AnalysisFailure;
      expect(failure.error, isA<PhotoProcessingError>());
      expect((failure.error as PhotoProcessingError).cause, contains('io error'));
    });

    test('retourne AnalysisFailure(PhotoProcessingError) quand processImage throw Error', () async {
      // Error (pas Exception) doit aussi être encapsulé — AC#6
      when(() => mockDetector.processImage(any()))
          .thenThrow(StateError('unexpected state'));

      final result = await module.analyze(testPhoto);

      expect(result, isA<AnalysisFailure>());
      expect((result as AnalysisFailure).error, isA<PhotoProcessingError>());
    });

    test('close() est appelé même quand processImage throw (AC#7 — finally)', () async {
      when(() => mockDetector.processImage(any()))
          .thenThrow(Exception('io error'));

      await module.analyze(testPhoto);

      verify(() => mockDetector.close()).called(1);
    });

    test('analyze() ne propage jamais d\'exception vers le caller (AC#6)', () async {
      when(() => mockDetector.processImage(any()))
          .thenThrow(Exception('fatal'));

      // Ne doit pas throw — doit retourner AnalysisFailure
      expect(() => module.analyze(testPhoto), returnsNormally);
    });
  });

  group('HKAModule — propriétés (AC#1)', () {
    test('moduleId == "hka"', () {
      expect(module.moduleId, 'hka');
    });

    test('displayName == "Analyse HKA"', () {
      expect(module.displayName, 'Analyse HKA');
    });
  });
}
