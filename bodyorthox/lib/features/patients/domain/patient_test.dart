import 'package:flutter_test/flutter_test.dart'; // ignore: depend_on_referenced_packages

import 'morphological_profile.dart';
import 'patient.dart';

void main() {
  group('MorphologicalProfile', () {
    test('has exactly 4 values: standard, obese, pediatric, elderly', () {
      expect(MorphologicalProfile.values, hasLength(4));
      expect(MorphologicalProfile.values, contains(MorphologicalProfile.standard));
      expect(MorphologicalProfile.values, contains(MorphologicalProfile.obese));
      expect(MorphologicalProfile.values, contains(MorphologicalProfile.pediatric));
      expect(MorphologicalProfile.values, contains(MorphologicalProfile.elderly));
    });
  });

  group('Patient', () {
    final now = DateTime(2026, 3, 5);
    final dob = DateTime(1968, 4, 12);

    Patient buildPatient({
      String id = 'patient-001',
      String name = 'Dr. Marc',
      DateTime? dateOfBirth,
      MorphologicalProfile morphologicalProfile = MorphologicalProfile.standard,
      DateTime? createdAt,
    }) {
      return Patient(
        id: id,
        name: name,
        dateOfBirth: dateOfBirth ?? dob,
        morphologicalProfile: morphologicalProfile,
        createdAt: createdAt ?? now,
      );
    }

    test('can be instantiated with all required fields', () {
      final patient = buildPatient();

      expect(patient.id, 'patient-001');
      expect(patient.name, 'Dr. Marc');
      expect(patient.dateOfBirth, dob);
      expect(patient.morphologicalProfile, MorphologicalProfile.standard);
      expect(patient.createdAt, now);
    });

    test('copyWith() updates only the specified fields', () {
      final original = buildPatient();
      final updated = original.copyWith(name: 'Fatima', morphologicalProfile: MorphologicalProfile.elderly);

      expect(updated.id, original.id);
      expect(updated.name, 'Fatima');
      expect(updated.dateOfBirth, original.dateOfBirth);
      expect(updated.morphologicalProfile, MorphologicalProfile.elderly);
      expect(updated.createdAt, original.createdAt);
    });

    test('copyWith() returns identical object when no fields changed', () {
      final original = buildPatient();
      final copy = original.copyWith();

      expect(copy, equals(original));
    });

    test('two patients with the same id are equal (==)', () {
      final a = buildPatient(id: 'same-id');
      final b = buildPatient(id: 'same-id', name: 'Different Name');

      expect(a, equals(b));
    });

    test('two patients with different ids are not equal', () {
      final a = buildPatient(id: 'id-001');
      final b = buildPatient(id: 'id-002');

      expect(a, isNot(equals(b)));
    });

    test('supports all MorphologicalProfile values', () {
      for (final profile in MorphologicalProfile.values) {
        final patient = buildPatient(morphologicalProfile: profile);
        expect(patient.morphologicalProfile, profile);
      }
    });
  });
}
