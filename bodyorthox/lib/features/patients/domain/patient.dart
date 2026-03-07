import 'morphological_profile.dart';

class Patient {
  const Patient({
    required this.id,
    required this.name,
    required this.dateOfBirth,
    required this.morphologicalProfile,
    required this.createdAt,
  });

  final String id;
  final String name;
  final DateTime dateOfBirth;
  final MorphologicalProfile morphologicalProfile;
  final DateTime createdAt;

  Patient copyWith({
    String? id,
    String? name,
    DateTime? dateOfBirth,
    MorphologicalProfile? morphologicalProfile,
    DateTime? createdAt,
  }) {
    return Patient(
      id: id ?? this.id,
      name: name ?? this.name,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      morphologicalProfile: morphologicalProfile ?? this.morphologicalProfile,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Entity equality: two Patients are the same entity if and only if
  /// their [id] values are identical (DDD identity rule).
  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Patient && other.id == id);

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'Patient(id: $id, name: $name, dateOfBirth: $dateOfBirth, '
      'morphologicalProfile: $morphologicalProfile, createdAt: $createdAt)';
}
