// Tests unitaires — AnalysisResult sealed class.
// [Source: docs/implementation-artifacts/arch-1-interface-analysis-module.md#Tâche 1]

import 'package:flutter_test/flutter_test.dart';

import 'package:bodyorthox/core/analysis/analysis_result.dart';

void main() {
  group('AnalysisResult', () {
    // -----------------------------------------------------------------------
    // AnalysisSuccess
    // -----------------------------------------------------------------------

    group('AnalysisSuccess', () {
      test('contient les mesures fournies', () {
        const result =
            AnalysisSuccess({'hka_angle': 174.2, 'confidence': 0.91});

        expect(result.measurements['hka_angle'], equals(174.2));
        expect(result.measurements['confidence'], equals(0.91));
      });

      test('measurements est une Map<String, double>', () {
        const result = AnalysisSuccess({'test': 1.0});

        expect(result.measurements, isA<Map<String, double>>());
      });
    });

    // -----------------------------------------------------------------------
    // AnalysisFailure
    // -----------------------------------------------------------------------

    group('AnalysisFailure', () {
      test('contient une erreur MLDetectionFailed', () {
        const result = AnalysisFailure(MLDetectionFailed());

        expect(result.error, isA<MLDetectionFailed>());
      });

      test('contient une erreur MLLowConfidence avec score', () {
        const result = AnalysisFailure(MLLowConfidence(0.45));

        expect(result.error, isA<MLLowConfidence>());
        expect((result.error as MLLowConfidence).score, equals(0.45));
      });

      test('contient une erreur PhotoProcessingError avec cause', () {
        const result = AnalysisFailure(PhotoProcessingError('timeout'));

        expect(result.error, isA<PhotoProcessingError>());
        expect((result.error as PhotoProcessingError).cause, equals('timeout'));
      });
    });

    // -----------------------------------------------------------------------
    // Switch exhaustif — AC1 (compilation garantit l'exhaustivité)
    // -----------------------------------------------------------------------

    group('Pattern matching exhaustif', () {
      test('switch sur AnalysisResult est exhaustif', () {
        final AnalysisResult result =
            const AnalysisSuccess({'angle': 174.2});

        final String output = switch (result) {
          AnalysisSuccess(:final measurements) =>
            'success:${measurements['angle']}',
          AnalysisFailure(:final error) => 'failure:$error',
        };

        expect(output, contains('success'));
      });

      test('switch sur AnalysisError est exhaustif', () {
        final List<AnalysisError> errors = [
          const MLLowConfidence(0.3),
          const MLDetectionFailed(),
          const PhotoProcessingError('io'),
        ];

        for (final error in errors) {
          final String label = switch (error) {
            MLLowConfidence(:final score) => 'low:$score',
            MLDetectionFailed() => 'no_detection',
            PhotoProcessingError(:final cause) => 'error:$cause',
          };
          expect(label, isNotEmpty);
        }
      });
    });

    // -----------------------------------------------------------------------
    // AnalysisError — sous-classes
    // -----------------------------------------------------------------------

    group('MLLowConfidence', () {
      test('stocke le score de confiance', () {
        const error = MLLowConfidence(0.45);

        expect(error.score, equals(0.45));
      });

      test('score 0.0 est valide', () {
        const error = MLLowConfidence(0.0);

        expect(error.score, equals(0.0));
      });
    });

    group('MLDetectionFailed', () {
      test('est instanciable', () {
        expect(() => const MLDetectionFailed(), returnsNormally);
      });
    });

    group('PhotoProcessingError', () {
      test('stocke la cause', () {
        const error = PhotoProcessingError('mémoire insuffisante');

        expect(error.cause, equals('mémoire insuffisante'));
      });
    });
  });
}
