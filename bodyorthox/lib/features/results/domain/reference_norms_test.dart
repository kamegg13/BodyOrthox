// Tests unitaires pour reference_norms.dart — Story 3.4 Task 1.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task7]
import 'package:flutter_test/flutter_test.dart';

import '../../../features/patients/domain/morphological_profile.dart';
import 'reference_norms.dart';

void main() {
  group('NormRange.evaluate', () {
    const norm = NormRange(min: 55.0, max: 70.0);

    test('valeur dans la plage → NormNormal', () {
      expect(norm.evaluate(62.5), isA<NormNormal>());
    });

    test('valeur exactement sur min → NormNormal', () {
      expect(norm.evaluate(55.0), isA<NormNormal>());
    });

    test('valeur exactement sur max → NormNormal', () {
      expect(norm.evaluate(70.0), isA<NormNormal>());
    });

    test('valeur borderline en dessous (−15%) → NormBorderline', () {
      // margin = (70 - 55) * 0.15 = 2.25 → borderline zone: [52.75, 55.0[
      expect(norm.evaluate(53.0), isA<NormBorderline>());
    });

    test('valeur borderline au dessus (+15%) → NormBorderline', () {
      // borderline zone: ]70.0, 72.25]
      expect(norm.evaluate(72.0), isA<NormBorderline>());
    });

    test('valeur anormale bien en dessous → NormAbnormal', () {
      expect(norm.evaluate(40.0), isA<NormAbnormal>());
    });

    test('valeur anormale bien au dessus → NormAbnormal', () {
      expect(norm.evaluate(85.0), isA<NormAbnormal>());
    });
  });

  group('ReferenceNorms.getNorm — genou standard', () {
    test('< 40 ans → NormRange(55.0, 70.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.knee,
        30,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 55.0);
      expect(norm.max, 70.0);
    });

    test('40–60 ans → NormRange(52.0, 68.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.knee,
        50,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 52.0);
      expect(norm.max, 68.0);
    });

    test('> 60 ans → NormRange(48.0, 65.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.knee,
        67,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 48.0);
      expect(norm.max, 65.0);
    });

    test('exactement 40 ans → tranche 40–60', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.knee,
        40,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 52.0);
      expect(norm.max, 68.0);
    });

    test('exactement 60 ans → tranche 40–60', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.knee,
        60,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 52.0);
      expect(norm.max, 68.0);
    });

    test('exactement 61 ans → tranche > 60', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.knee,
        61,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 48.0);
      expect(norm.max, 65.0);
    });
  });

  group('ReferenceNorms.getNorm — hanche standard', () {
    test('< 40 ans → NormRange(20.0, 30.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.hip,
        25,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 20.0);
      expect(norm.max, 30.0);
    });

    test('40–60 ans → NormRange(15.0, 28.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.hip,
        55,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 15.0);
      expect(norm.max, 28.0);
    });

    test('> 60 ans → NormRange(10.0, 25.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.hip,
        70,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 10.0);
      expect(norm.max, 25.0);
    });
  });

  group('ReferenceNorms.getNorm — cheville standard', () {
    test('< 40 ans → NormRange(8.0, 15.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.ankle,
        35,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 8.0);
      expect(norm.max, 15.0);
    });

    test('40–60 ans → NormRange(6.0, 13.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.ankle,
        50,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 6.0);
      expect(norm.max, 13.0);
    });

    test('> 60 ans → NormRange(5.0, 12.0)', () {
      final norm = ReferenceNorms.getNorm(
        ArticulationName.ankle,
        65,
        MorphologicalProfile.standard,
      );
      expect(norm.min, 5.0);
      expect(norm.max, 12.0);
    });
  });

  group('ReferenceNorms.getNorm — profils non-standard (fallback standard)', () {
    test('obese → fallback standard', () {
      final normObese = ReferenceNorms.getNorm(
        ArticulationName.knee,
        30,
        MorphologicalProfile.obese,
      );
      final normStd = ReferenceNorms.getNorm(
        ArticulationName.knee,
        30,
        MorphologicalProfile.standard,
      );
      expect(normObese.min, normStd.min);
      expect(normObese.max, normStd.max);
    });

    test('pediatric → fallback standard', () {
      final normPed = ReferenceNorms.getNorm(
        ArticulationName.hip,
        50,
        MorphologicalProfile.pediatric,
      );
      final normStd = ReferenceNorms.getNorm(
        ArticulationName.hip,
        50,
        MorphologicalProfile.standard,
      );
      expect(normPed.min, normStd.min);
      expect(normPed.max, normStd.max);
    });

    test('elderly → fallback standard', () {
      final normElderly = ReferenceNorms.getNorm(
        ArticulationName.ankle,
        65,
        MorphologicalProfile.elderly,
      );
      final normStd = ReferenceNorms.getNorm(
        ArticulationName.ankle,
        65,
        MorphologicalProfile.standard,
      );
      expect(normElderly.min, normStd.min);
      expect(normElderly.max, normStd.max);
    });
  });

  group('NormStatus — sealed class exhaustivité', () {
    test('NormNormal == NormNormal', () {
      expect(const NormNormal(), isA<NormStatus>());
      expect(const NormNormal(), isA<NormNormal>());
    });

    test('NormBorderline == NormBorderline', () {
      expect(const NormBorderline(), isA<NormStatus>());
      expect(const NormBorderline(), isA<NormBorderline>());
    });

    test('NormAbnormal == NormAbnormal', () {
      expect(const NormAbnormal(), isA<NormStatus>());
      expect(const NormAbnormal(), isA<NormAbnormal>());
    });

    test('switch exhaustif sur NormStatus compile', () {
      NormStatus status = const NormNormal();
      final label = switch (status) {
        NormNormal() => 'normal',
        NormBorderline() => 'borderline',
        NormAbnormal() => 'abnormal',
      };
      expect(label, 'normal');
    });
  });
}
