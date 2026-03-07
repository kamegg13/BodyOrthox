// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $PatientsTable extends Patients with TableInfo<$PatientsTable, Patient> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PatientsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _dateOfBirthMeta =
      const VerificationMeta('dateOfBirth');
  @override
  late final GeneratedColumn<String> dateOfBirth = GeneratedColumn<String>(
      'date_of_birth', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _morphologicalProfileMeta =
      const VerificationMeta('morphologicalProfile');
  @override
  late final GeneratedColumn<String> morphologicalProfile =
      GeneratedColumn<String>('morphological_profile', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<String> createdAt = GeneratedColumn<String>(
      'created_at', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [id, name, dateOfBirth, morphologicalProfile, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'patients';
  @override
  VerificationContext validateIntegrity(Insertable<Patient> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('date_of_birth')) {
      context.handle(
          _dateOfBirthMeta,
          dateOfBirth.isAcceptableOrUnknown(
              data['date_of_birth']!, _dateOfBirthMeta));
    } else if (isInserting) {
      context.missing(_dateOfBirthMeta);
    }
    if (data.containsKey('morphological_profile')) {
      context.handle(
          _morphologicalProfileMeta,
          morphologicalProfile.isAcceptableOrUnknown(
              data['morphological_profile']!, _morphologicalProfileMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Patient map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Patient(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      dateOfBirth: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}date_of_birth'])!,
      morphologicalProfile: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}morphological_profile']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $PatientsTable createAlias(String alias) {
    return $PatientsTable(attachedDatabase, alias);
  }
}

class Patient extends DataClass implements Insertable<Patient> {
  /// UUID v4 généré côté Dart — jamais auto-increment.
  final String id;

  /// Nom complet du patient.
  final String name;

  /// Date de naissance au format ISO 8601 date (`YYYY-MM-DD`).
  final String dateOfBirth;

  /// Profil morphologique sérialisé en JSON — nullable (renseigné lors de l'analyse).
  final String? morphologicalProfile;

  /// Horodatage de création UTC — format `DateTime.now().toUtc().toIso8601String()`.
  /// FR30 : obligatoire sur tous les enregistrements.
  final String createdAt;
  const Patient(
      {required this.id,
      required this.name,
      required this.dateOfBirth,
      this.morphologicalProfile,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['date_of_birth'] = Variable<String>(dateOfBirth);
    if (!nullToAbsent || morphologicalProfile != null) {
      map['morphological_profile'] = Variable<String>(morphologicalProfile);
    }
    map['created_at'] = Variable<String>(createdAt);
    return map;
  }

  PatientsCompanion toCompanion(bool nullToAbsent) {
    return PatientsCompanion(
      id: Value(id),
      name: Value(name),
      dateOfBirth: Value(dateOfBirth),
      morphologicalProfile: morphologicalProfile == null && nullToAbsent
          ? const Value.absent()
          : Value(morphologicalProfile),
      createdAt: Value(createdAt),
    );
  }

  factory Patient.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Patient(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      dateOfBirth: serializer.fromJson<String>(json['dateOfBirth']),
      morphologicalProfile:
          serializer.fromJson<String?>(json['morphologicalProfile']),
      createdAt: serializer.fromJson<String>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'dateOfBirth': serializer.toJson<String>(dateOfBirth),
      'morphologicalProfile': serializer.toJson<String?>(morphologicalProfile),
      'createdAt': serializer.toJson<String>(createdAt),
    };
  }

  Patient copyWith(
          {String? id,
          String? name,
          String? dateOfBirth,
          Value<String?> morphologicalProfile = const Value.absent(),
          String? createdAt}) =>
      Patient(
        id: id ?? this.id,
        name: name ?? this.name,
        dateOfBirth: dateOfBirth ?? this.dateOfBirth,
        morphologicalProfile: morphologicalProfile.present
            ? morphologicalProfile.value
            : this.morphologicalProfile,
        createdAt: createdAt ?? this.createdAt,
      );
  Patient copyWithCompanion(PatientsCompanion data) {
    return Patient(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      dateOfBirth:
          data.dateOfBirth.present ? data.dateOfBirth.value : this.dateOfBirth,
      morphologicalProfile: data.morphologicalProfile.present
          ? data.morphologicalProfile.value
          : this.morphologicalProfile,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Patient(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('dateOfBirth: $dateOfBirth, ')
          ..write('morphologicalProfile: $morphologicalProfile, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, name, dateOfBirth, morphologicalProfile, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Patient &&
          other.id == this.id &&
          other.name == this.name &&
          other.dateOfBirth == this.dateOfBirth &&
          other.morphologicalProfile == this.morphologicalProfile &&
          other.createdAt == this.createdAt);
}

class PatientsCompanion extends UpdateCompanion<Patient> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> dateOfBirth;
  final Value<String?> morphologicalProfile;
  final Value<String> createdAt;
  final Value<int> rowid;
  const PatientsCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.dateOfBirth = const Value.absent(),
    this.morphologicalProfile = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PatientsCompanion.insert({
    required String id,
    required String name,
    required String dateOfBirth,
    this.morphologicalProfile = const Value.absent(),
    required String createdAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        name = Value(name),
        dateOfBirth = Value(dateOfBirth),
        createdAt = Value(createdAt);
  static Insertable<Patient> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? dateOfBirth,
    Expression<String>? morphologicalProfile,
    Expression<String>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (dateOfBirth != null) 'date_of_birth': dateOfBirth,
      if (morphologicalProfile != null)
        'morphological_profile': morphologicalProfile,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PatientsCompanion copyWith(
      {Value<String>? id,
      Value<String>? name,
      Value<String>? dateOfBirth,
      Value<String?>? morphologicalProfile,
      Value<String>? createdAt,
      Value<int>? rowid}) {
    return PatientsCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      morphologicalProfile: morphologicalProfile ?? this.morphologicalProfile,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (dateOfBirth.present) {
      map['date_of_birth'] = Variable<String>(dateOfBirth.value);
    }
    if (morphologicalProfile.present) {
      map['morphological_profile'] =
          Variable<String>(morphologicalProfile.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<String>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PatientsCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('dateOfBirth: $dateOfBirth, ')
          ..write('morphologicalProfile: $morphologicalProfile, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $AnalysesTable extends Analyses with TableInfo<$AnalysesTable, Analyse> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AnalysesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _patientIdMeta =
      const VerificationMeta('patientId');
  @override
  late final GeneratedColumn<String> patientId = GeneratedColumn<String>(
      'patient_id', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES patients (id)'));
  static const VerificationMeta _kneeAngleMeta =
      const VerificationMeta('kneeAngle');
  @override
  late final GeneratedColumn<double> kneeAngle = GeneratedColumn<double>(
      'knee_angle', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _hipAngleMeta =
      const VerificationMeta('hipAngle');
  @override
  late final GeneratedColumn<double> hipAngle = GeneratedColumn<double>(
      'hip_angle', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _ankleAngleMeta =
      const VerificationMeta('ankleAngle');
  @override
  late final GeneratedColumn<double> ankleAngle = GeneratedColumn<double>(
      'ankle_angle', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _confidenceScoreMeta =
      const VerificationMeta('confidenceScore');
  @override
  late final GeneratedColumn<double> confidenceScore = GeneratedColumn<double>(
      'confidence_score', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _mlCorrectedMeta =
      const VerificationMeta('mlCorrected');
  @override
  late final GeneratedColumn<bool> mlCorrected = GeneratedColumn<bool>(
      'ml_corrected', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("ml_corrected" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _manualCorrectionJointMeta =
      const VerificationMeta('manualCorrectionJoint');
  @override
  late final GeneratedColumn<String> manualCorrectionJoint =
      GeneratedColumn<String>('manual_correction_joint', aliasedName, true,
          type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<String> createdAt = GeneratedColumn<String>(
      'created_at', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        patientId,
        kneeAngle,
        hipAngle,
        ankleAngle,
        confidenceScore,
        mlCorrected,
        manualCorrectionJoint,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'analyses';
  @override
  VerificationContext validateIntegrity(Insertable<Analyse> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('patient_id')) {
      context.handle(_patientIdMeta,
          patientId.isAcceptableOrUnknown(data['patient_id']!, _patientIdMeta));
    } else if (isInserting) {
      context.missing(_patientIdMeta);
    }
    if (data.containsKey('knee_angle')) {
      context.handle(_kneeAngleMeta,
          kneeAngle.isAcceptableOrUnknown(data['knee_angle']!, _kneeAngleMeta));
    } else if (isInserting) {
      context.missing(_kneeAngleMeta);
    }
    if (data.containsKey('hip_angle')) {
      context.handle(_hipAngleMeta,
          hipAngle.isAcceptableOrUnknown(data['hip_angle']!, _hipAngleMeta));
    } else if (isInserting) {
      context.missing(_hipAngleMeta);
    }
    if (data.containsKey('ankle_angle')) {
      context.handle(
          _ankleAngleMeta,
          ankleAngle.isAcceptableOrUnknown(
              data['ankle_angle']!, _ankleAngleMeta));
    } else if (isInserting) {
      context.missing(_ankleAngleMeta);
    }
    if (data.containsKey('confidence_score')) {
      context.handle(
          _confidenceScoreMeta,
          confidenceScore.isAcceptableOrUnknown(
              data['confidence_score']!, _confidenceScoreMeta));
    } else if (isInserting) {
      context.missing(_confidenceScoreMeta);
    }
    if (data.containsKey('ml_corrected')) {
      context.handle(
          _mlCorrectedMeta,
          mlCorrected.isAcceptableOrUnknown(
              data['ml_corrected']!, _mlCorrectedMeta));
    }
    if (data.containsKey('manual_correction_joint')) {
      context.handle(
          _manualCorrectionJointMeta,
          manualCorrectionJoint.isAcceptableOrUnknown(
              data['manual_correction_joint']!, _manualCorrectionJointMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Analyse map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Analyse(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      patientId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}patient_id'])!,
      kneeAngle: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}knee_angle'])!,
      hipAngle: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}hip_angle'])!,
      ankleAngle: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}ankle_angle'])!,
      confidenceScore: attachedDatabase.typeMapping.read(
          DriftSqlType.double, data['${effectivePrefix}confidence_score'])!,
      mlCorrected: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}ml_corrected'])!,
      manualCorrectionJoint: attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}manual_correction_joint']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $AnalysesTable createAlias(String alias) {
    return $AnalysesTable(attachedDatabase, alias);
  }
}

class Analyse extends DataClass implements Insertable<Analyse> {
  /// UUID v4.
  final String id;

  /// Clé étrangère vers [Patients.id].
  final String patientId;

  /// Angle du genou en degrés (1 décimale).
  final double kneeAngle;

  /// Angle de la hanche en degrés.
  final double hipAngle;

  /// Angle de la cheville en degrés.
  final double ankleAngle;

  /// Score de confiance ML global [0.0 – 1.0].
  final double confidenceScore;

  /// Vrai si l'expert a corrigé manuellement le résultat ML (Story 3.5).
  final bool mlCorrected;

  /// Articulation corrigée manuellement : 'knee', 'hip' ou 'ankle' (Story 3.5).
  final String? manualCorrectionJoint;

  /// Horodatage UTC — FR30.
  final String createdAt;
  const Analyse(
      {required this.id,
      required this.patientId,
      required this.kneeAngle,
      required this.hipAngle,
      required this.ankleAngle,
      required this.confidenceScore,
      required this.mlCorrected,
      this.manualCorrectionJoint,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['patient_id'] = Variable<String>(patientId);
    map['knee_angle'] = Variable<double>(kneeAngle);
    map['hip_angle'] = Variable<double>(hipAngle);
    map['ankle_angle'] = Variable<double>(ankleAngle);
    map['confidence_score'] = Variable<double>(confidenceScore);
    map['ml_corrected'] = Variable<bool>(mlCorrected);
    if (!nullToAbsent || manualCorrectionJoint != null) {
      map['manual_correction_joint'] = Variable<String>(manualCorrectionJoint);
    }
    map['created_at'] = Variable<String>(createdAt);
    return map;
  }

  AnalysesCompanion toCompanion(bool nullToAbsent) {
    return AnalysesCompanion(
      id: Value(id),
      patientId: Value(patientId),
      kneeAngle: Value(kneeAngle),
      hipAngle: Value(hipAngle),
      ankleAngle: Value(ankleAngle),
      confidenceScore: Value(confidenceScore),
      mlCorrected: Value(mlCorrected),
      manualCorrectionJoint: manualCorrectionJoint == null && nullToAbsent
          ? const Value.absent()
          : Value(manualCorrectionJoint),
      createdAt: Value(createdAt),
    );
  }

  factory Analyse.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Analyse(
      id: serializer.fromJson<String>(json['id']),
      patientId: serializer.fromJson<String>(json['patientId']),
      kneeAngle: serializer.fromJson<double>(json['kneeAngle']),
      hipAngle: serializer.fromJson<double>(json['hipAngle']),
      ankleAngle: serializer.fromJson<double>(json['ankleAngle']),
      confidenceScore: serializer.fromJson<double>(json['confidenceScore']),
      mlCorrected: serializer.fromJson<bool>(json['mlCorrected']),
      manualCorrectionJoint:
          serializer.fromJson<String?>(json['manualCorrectionJoint']),
      createdAt: serializer.fromJson<String>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'patientId': serializer.toJson<String>(patientId),
      'kneeAngle': serializer.toJson<double>(kneeAngle),
      'hipAngle': serializer.toJson<double>(hipAngle),
      'ankleAngle': serializer.toJson<double>(ankleAngle),
      'confidenceScore': serializer.toJson<double>(confidenceScore),
      'mlCorrected': serializer.toJson<bool>(mlCorrected),
      'manualCorrectionJoint':
          serializer.toJson<String?>(manualCorrectionJoint),
      'createdAt': serializer.toJson<String>(createdAt),
    };
  }

  Analyse copyWith(
          {String? id,
          String? patientId,
          double? kneeAngle,
          double? hipAngle,
          double? ankleAngle,
          double? confidenceScore,
          bool? mlCorrected,
          Value<String?> manualCorrectionJoint = const Value.absent(),
          String? createdAt}) =>
      Analyse(
        id: id ?? this.id,
        patientId: patientId ?? this.patientId,
        kneeAngle: kneeAngle ?? this.kneeAngle,
        hipAngle: hipAngle ?? this.hipAngle,
        ankleAngle: ankleAngle ?? this.ankleAngle,
        confidenceScore: confidenceScore ?? this.confidenceScore,
        mlCorrected: mlCorrected ?? this.mlCorrected,
        manualCorrectionJoint: manualCorrectionJoint.present
            ? manualCorrectionJoint.value
            : this.manualCorrectionJoint,
        createdAt: createdAt ?? this.createdAt,
      );
  Analyse copyWithCompanion(AnalysesCompanion data) {
    return Analyse(
      id: data.id.present ? data.id.value : this.id,
      patientId: data.patientId.present ? data.patientId.value : this.patientId,
      kneeAngle: data.kneeAngle.present ? data.kneeAngle.value : this.kneeAngle,
      hipAngle: data.hipAngle.present ? data.hipAngle.value : this.hipAngle,
      ankleAngle:
          data.ankleAngle.present ? data.ankleAngle.value : this.ankleAngle,
      confidenceScore: data.confidenceScore.present
          ? data.confidenceScore.value
          : this.confidenceScore,
      mlCorrected:
          data.mlCorrected.present ? data.mlCorrected.value : this.mlCorrected,
      manualCorrectionJoint: data.manualCorrectionJoint.present
          ? data.manualCorrectionJoint.value
          : this.manualCorrectionJoint,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Analyse(')
          ..write('id: $id, ')
          ..write('patientId: $patientId, ')
          ..write('kneeAngle: $kneeAngle, ')
          ..write('hipAngle: $hipAngle, ')
          ..write('ankleAngle: $ankleAngle, ')
          ..write('confidenceScore: $confidenceScore, ')
          ..write('mlCorrected: $mlCorrected, ')
          ..write('manualCorrectionJoint: $manualCorrectionJoint, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      patientId,
      kneeAngle,
      hipAngle,
      ankleAngle,
      confidenceScore,
      mlCorrected,
      manualCorrectionJoint,
      createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Analyse &&
          other.id == this.id &&
          other.patientId == this.patientId &&
          other.kneeAngle == this.kneeAngle &&
          other.hipAngle == this.hipAngle &&
          other.ankleAngle == this.ankleAngle &&
          other.confidenceScore == this.confidenceScore &&
          other.mlCorrected == this.mlCorrected &&
          other.manualCorrectionJoint == this.manualCorrectionJoint &&
          other.createdAt == this.createdAt);
}

class AnalysesCompanion extends UpdateCompanion<Analyse> {
  final Value<String> id;
  final Value<String> patientId;
  final Value<double> kneeAngle;
  final Value<double> hipAngle;
  final Value<double> ankleAngle;
  final Value<double> confidenceScore;
  final Value<bool> mlCorrected;
  final Value<String?> manualCorrectionJoint;
  final Value<String> createdAt;
  final Value<int> rowid;
  const AnalysesCompanion({
    this.id = const Value.absent(),
    this.patientId = const Value.absent(),
    this.kneeAngle = const Value.absent(),
    this.hipAngle = const Value.absent(),
    this.ankleAngle = const Value.absent(),
    this.confidenceScore = const Value.absent(),
    this.mlCorrected = const Value.absent(),
    this.manualCorrectionJoint = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  AnalysesCompanion.insert({
    required String id,
    required String patientId,
    required double kneeAngle,
    required double hipAngle,
    required double ankleAngle,
    required double confidenceScore,
    this.mlCorrected = const Value.absent(),
    this.manualCorrectionJoint = const Value.absent(),
    required String createdAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        patientId = Value(patientId),
        kneeAngle = Value(kneeAngle),
        hipAngle = Value(hipAngle),
        ankleAngle = Value(ankleAngle),
        confidenceScore = Value(confidenceScore),
        createdAt = Value(createdAt);
  static Insertable<Analyse> custom({
    Expression<String>? id,
    Expression<String>? patientId,
    Expression<double>? kneeAngle,
    Expression<double>? hipAngle,
    Expression<double>? ankleAngle,
    Expression<double>? confidenceScore,
    Expression<bool>? mlCorrected,
    Expression<String>? manualCorrectionJoint,
    Expression<String>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (patientId != null) 'patient_id': patientId,
      if (kneeAngle != null) 'knee_angle': kneeAngle,
      if (hipAngle != null) 'hip_angle': hipAngle,
      if (ankleAngle != null) 'ankle_angle': ankleAngle,
      if (confidenceScore != null) 'confidence_score': confidenceScore,
      if (mlCorrected != null) 'ml_corrected': mlCorrected,
      if (manualCorrectionJoint != null)
        'manual_correction_joint': manualCorrectionJoint,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  AnalysesCompanion copyWith(
      {Value<String>? id,
      Value<String>? patientId,
      Value<double>? kneeAngle,
      Value<double>? hipAngle,
      Value<double>? ankleAngle,
      Value<double>? confidenceScore,
      Value<bool>? mlCorrected,
      Value<String?>? manualCorrectionJoint,
      Value<String>? createdAt,
      Value<int>? rowid}) {
    return AnalysesCompanion(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      kneeAngle: kneeAngle ?? this.kneeAngle,
      hipAngle: hipAngle ?? this.hipAngle,
      ankleAngle: ankleAngle ?? this.ankleAngle,
      confidenceScore: confidenceScore ?? this.confidenceScore,
      mlCorrected: mlCorrected ?? this.mlCorrected,
      manualCorrectionJoint:
          manualCorrectionJoint ?? this.manualCorrectionJoint,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (patientId.present) {
      map['patient_id'] = Variable<String>(patientId.value);
    }
    if (kneeAngle.present) {
      map['knee_angle'] = Variable<double>(kneeAngle.value);
    }
    if (hipAngle.present) {
      map['hip_angle'] = Variable<double>(hipAngle.value);
    }
    if (ankleAngle.present) {
      map['ankle_angle'] = Variable<double>(ankleAngle.value);
    }
    if (confidenceScore.present) {
      map['confidence_score'] = Variable<double>(confidenceScore.value);
    }
    if (mlCorrected.present) {
      map['ml_corrected'] = Variable<bool>(mlCorrected.value);
    }
    if (manualCorrectionJoint.present) {
      map['manual_correction_joint'] =
          Variable<String>(manualCorrectionJoint.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<String>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AnalysesCompanion(')
          ..write('id: $id, ')
          ..write('patientId: $patientId, ')
          ..write('kneeAngle: $kneeAngle, ')
          ..write('hipAngle: $hipAngle, ')
          ..write('ankleAngle: $ankleAngle, ')
          ..write('confidenceScore: $confidenceScore, ')
          ..write('mlCorrected: $mlCorrected, ')
          ..write('manualCorrectionJoint: $manualCorrectionJoint, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $PatientsTable patients = $PatientsTable(this);
  late final $AnalysesTable analyses = $AnalysesTable(this);
  late final PatientsDao patientsDao = PatientsDao(this as AppDatabase);
  late final AnalysesDao analysesDao = AnalysesDao(this as AppDatabase);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [patients, analyses];
}

typedef $$PatientsTableCreateCompanionBuilder = PatientsCompanion Function({
  required String id,
  required String name,
  required String dateOfBirth,
  Value<String?> morphologicalProfile,
  required String createdAt,
  Value<int> rowid,
});
typedef $$PatientsTableUpdateCompanionBuilder = PatientsCompanion Function({
  Value<String> id,
  Value<String> name,
  Value<String> dateOfBirth,
  Value<String?> morphologicalProfile,
  Value<String> createdAt,
  Value<int> rowid,
});

final class $$PatientsTableReferences
    extends BaseReferences<_$AppDatabase, $PatientsTable, Patient> {
  $$PatientsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$AnalysesTable, List<Analyse>> _analysesRefsTable(
          _$AppDatabase db) =>
      MultiTypedResultKey.fromTable(db.analyses,
          aliasName:
              $_aliasNameGenerator(db.patients.id, db.analyses.patientId));

  $$AnalysesTableProcessedTableManager get analysesRefs {
    final manager = $$AnalysesTableTableManager($_db, $_db.analyses)
        .filter((f) => f.patientId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_analysesRefsTable($_db));
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: cache));
  }
}

class $$PatientsTableFilterComposer
    extends Composer<_$AppDatabase, $PatientsTable> {
  $$PatientsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get dateOfBirth => $composableBuilder(
      column: $table.dateOfBirth, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get morphologicalProfile => $composableBuilder(
      column: $table.morphologicalProfile,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  Expression<bool> analysesRefs(
      Expression<bool> Function($$AnalysesTableFilterComposer f) f) {
    final $$AnalysesTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.analyses,
        getReferencedColumn: (t) => t.patientId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$AnalysesTableFilterComposer(
              $db: $db,
              $table: $db.analyses,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }
}

class $$PatientsTableOrderingComposer
    extends Composer<_$AppDatabase, $PatientsTable> {
  $$PatientsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get name => $composableBuilder(
      column: $table.name, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get dateOfBirth => $composableBuilder(
      column: $table.dateOfBirth, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get morphologicalProfile => $composableBuilder(
      column: $table.morphologicalProfile,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$PatientsTableAnnotationComposer
    extends Composer<_$AppDatabase, $PatientsTable> {
  $$PatientsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get dateOfBirth => $composableBuilder(
      column: $table.dateOfBirth, builder: (column) => column);

  GeneratedColumn<String> get morphologicalProfile => $composableBuilder(
      column: $table.morphologicalProfile, builder: (column) => column);

  GeneratedColumn<String> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  Expression<T> analysesRefs<T extends Object>(
      Expression<T> Function($$AnalysesTableAnnotationComposer a) f) {
    final $$AnalysesTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.id,
        referencedTable: $db.analyses,
        getReferencedColumn: (t) => t.patientId,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$AnalysesTableAnnotationComposer(
              $db: $db,
              $table: $db.analyses,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return f(composer);
  }
}

class $$PatientsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $PatientsTable,
    Patient,
    $$PatientsTableFilterComposer,
    $$PatientsTableOrderingComposer,
    $$PatientsTableAnnotationComposer,
    $$PatientsTableCreateCompanionBuilder,
    $$PatientsTableUpdateCompanionBuilder,
    (Patient, $$PatientsTableReferences),
    Patient,
    PrefetchHooks Function({bool analysesRefs})> {
  $$PatientsTableTableManager(_$AppDatabase db, $PatientsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PatientsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PatientsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PatientsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String> dateOfBirth = const Value.absent(),
            Value<String?> morphologicalProfile = const Value.absent(),
            Value<String> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              PatientsCompanion(
            id: id,
            name: name,
            dateOfBirth: dateOfBirth,
            morphologicalProfile: morphologicalProfile,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String name,
            required String dateOfBirth,
            Value<String?> morphologicalProfile = const Value.absent(),
            required String createdAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              PatientsCompanion.insert(
            id: id,
            name: name,
            dateOfBirth: dateOfBirth,
            morphologicalProfile: morphologicalProfile,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) =>
                  (e.readTable(table), $$PatientsTableReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: ({analysesRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [if (analysesRefs) db.analyses],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (analysesRefs)
                    await $_getPrefetchedData<Patient, $PatientsTable, Analyse>(
                        currentTable: table,
                        referencedTable:
                            $$PatientsTableReferences._analysesRefsTable(db),
                        managerFromTypedResult: (p0) =>
                            $$PatientsTableReferences(db, table, p0)
                                .analysesRefs,
                        referencedItemsForCurrentItem:
                            (item, referencedItems) => referencedItems
                                .where((e) => e.patientId == item.id),
                        typedResults: items)
                ];
              },
            );
          },
        ));
}

typedef $$PatientsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $PatientsTable,
    Patient,
    $$PatientsTableFilterComposer,
    $$PatientsTableOrderingComposer,
    $$PatientsTableAnnotationComposer,
    $$PatientsTableCreateCompanionBuilder,
    $$PatientsTableUpdateCompanionBuilder,
    (Patient, $$PatientsTableReferences),
    Patient,
    PrefetchHooks Function({bool analysesRefs})>;
typedef $$AnalysesTableCreateCompanionBuilder = AnalysesCompanion Function({
  required String id,
  required String patientId,
  required double kneeAngle,
  required double hipAngle,
  required double ankleAngle,
  required double confidenceScore,
  Value<bool> mlCorrected,
  Value<String?> manualCorrectionJoint,
  required String createdAt,
  Value<int> rowid,
});
typedef $$AnalysesTableUpdateCompanionBuilder = AnalysesCompanion Function({
  Value<String> id,
  Value<String> patientId,
  Value<double> kneeAngle,
  Value<double> hipAngle,
  Value<double> ankleAngle,
  Value<double> confidenceScore,
  Value<bool> mlCorrected,
  Value<String?> manualCorrectionJoint,
  Value<String> createdAt,
  Value<int> rowid,
});

final class $$AnalysesTableReferences
    extends BaseReferences<_$AppDatabase, $AnalysesTable, Analyse> {
  $$AnalysesTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $PatientsTable _patientIdTable(_$AppDatabase db) => db.patients
      .createAlias($_aliasNameGenerator(db.analyses.patientId, db.patients.id));

  $$PatientsTableProcessedTableManager get patientId {
    final $_column = $_itemColumn<String>('patient_id')!;

    final manager = $$PatientsTableTableManager($_db, $_db.patients)
        .filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_patientIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
        manager.$state.copyWith(prefetchedData: [item]));
  }
}

class $$AnalysesTableFilterComposer
    extends Composer<_$AppDatabase, $AnalysesTable> {
  $$AnalysesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get kneeAngle => $composableBuilder(
      column: $table.kneeAngle, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get hipAngle => $composableBuilder(
      column: $table.hipAngle, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get ankleAngle => $composableBuilder(
      column: $table.ankleAngle, builder: (column) => ColumnFilters(column));

  ColumnFilters<double> get confidenceScore => $composableBuilder(
      column: $table.confidenceScore,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get mlCorrected => $composableBuilder(
      column: $table.mlCorrected, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get manualCorrectionJoint => $composableBuilder(
      column: $table.manualCorrectionJoint,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  $$PatientsTableFilterComposer get patientId {
    final $$PatientsTableFilterComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.patientId,
        referencedTable: $db.patients,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$PatientsTableFilterComposer(
              $db: $db,
              $table: $db.patients,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$AnalysesTableOrderingComposer
    extends Composer<_$AppDatabase, $AnalysesTable> {
  $$AnalysesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get kneeAngle => $composableBuilder(
      column: $table.kneeAngle, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get hipAngle => $composableBuilder(
      column: $table.hipAngle, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get ankleAngle => $composableBuilder(
      column: $table.ankleAngle, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<double> get confidenceScore => $composableBuilder(
      column: $table.confidenceScore,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get mlCorrected => $composableBuilder(
      column: $table.mlCorrected, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get manualCorrectionJoint => $composableBuilder(
      column: $table.manualCorrectionJoint,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  $$PatientsTableOrderingComposer get patientId {
    final $$PatientsTableOrderingComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.patientId,
        referencedTable: $db.patients,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$PatientsTableOrderingComposer(
              $db: $db,
              $table: $db.patients,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$AnalysesTableAnnotationComposer
    extends Composer<_$AppDatabase, $AnalysesTable> {
  $$AnalysesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<double> get kneeAngle =>
      $composableBuilder(column: $table.kneeAngle, builder: (column) => column);

  GeneratedColumn<double> get hipAngle =>
      $composableBuilder(column: $table.hipAngle, builder: (column) => column);

  GeneratedColumn<double> get ankleAngle => $composableBuilder(
      column: $table.ankleAngle, builder: (column) => column);

  GeneratedColumn<double> get confidenceScore => $composableBuilder(
      column: $table.confidenceScore, builder: (column) => column);

  GeneratedColumn<bool> get mlCorrected => $composableBuilder(
      column: $table.mlCorrected, builder: (column) => column);

  GeneratedColumn<String> get manualCorrectionJoint => $composableBuilder(
      column: $table.manualCorrectionJoint, builder: (column) => column);

  GeneratedColumn<String> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  $$PatientsTableAnnotationComposer get patientId {
    final $$PatientsTableAnnotationComposer composer = $composerBuilder(
        composer: this,
        getCurrentColumn: (t) => t.patientId,
        referencedTable: $db.patients,
        getReferencedColumn: (t) => t.id,
        builder: (joinBuilder,
                {$addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer}) =>
            $$PatientsTableAnnotationComposer(
              $db: $db,
              $table: $db.patients,
              $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
              joinBuilder: joinBuilder,
              $removeJoinBuilderFromRootComposer:
                  $removeJoinBuilderFromRootComposer,
            ));
    return composer;
  }
}

class $$AnalysesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $AnalysesTable,
    Analyse,
    $$AnalysesTableFilterComposer,
    $$AnalysesTableOrderingComposer,
    $$AnalysesTableAnnotationComposer,
    $$AnalysesTableCreateCompanionBuilder,
    $$AnalysesTableUpdateCompanionBuilder,
    (Analyse, $$AnalysesTableReferences),
    Analyse,
    PrefetchHooks Function({bool patientId})> {
  $$AnalysesTableTableManager(_$AppDatabase db, $AnalysesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AnalysesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AnalysesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AnalysesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> patientId = const Value.absent(),
            Value<double> kneeAngle = const Value.absent(),
            Value<double> hipAngle = const Value.absent(),
            Value<double> ankleAngle = const Value.absent(),
            Value<double> confidenceScore = const Value.absent(),
            Value<bool> mlCorrected = const Value.absent(),
            Value<String?> manualCorrectionJoint = const Value.absent(),
            Value<String> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              AnalysesCompanion(
            id: id,
            patientId: patientId,
            kneeAngle: kneeAngle,
            hipAngle: hipAngle,
            ankleAngle: ankleAngle,
            confidenceScore: confidenceScore,
            mlCorrected: mlCorrected,
            manualCorrectionJoint: manualCorrectionJoint,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String patientId,
            required double kneeAngle,
            required double hipAngle,
            required double ankleAngle,
            required double confidenceScore,
            Value<bool> mlCorrected = const Value.absent(),
            Value<String?> manualCorrectionJoint = const Value.absent(),
            required String createdAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              AnalysesCompanion.insert(
            id: id,
            patientId: patientId,
            kneeAngle: kneeAngle,
            hipAngle: hipAngle,
            ankleAngle: ankleAngle,
            confidenceScore: confidenceScore,
            mlCorrected: mlCorrected,
            manualCorrectionJoint: manualCorrectionJoint,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) =>
                  (e.readTable(table), $$AnalysesTableReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: ({patientId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins: <
                  T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic>>(state) {
                if (patientId) {
                  state = state.withJoin(
                    currentTable: table,
                    currentColumn: table.patientId,
                    referencedTable:
                        $$AnalysesTableReferences._patientIdTable(db),
                    referencedColumn:
                        $$AnalysesTableReferences._patientIdTable(db).id,
                  ) as T;
                }

                return state;
              },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ));
}

typedef $$AnalysesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $AnalysesTable,
    Analyse,
    $$AnalysesTableFilterComposer,
    $$AnalysesTableOrderingComposer,
    $$AnalysesTableAnnotationComposer,
    $$AnalysesTableCreateCompanionBuilder,
    $$AnalysesTableUpdateCompanionBuilder,
    (Analyse, $$AnalysesTableReferences),
    Analyse,
    PrefetchHooks Function({bool patientId})>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$PatientsTableTableManager get patients =>
      $$PatientsTableTableManager(_db, _db.patients);
  $$AnalysesTableTableManager get analyses =>
      $$AnalysesTableTableManager(_db, _db.analyses);
}

mixin _$PatientsDaoMixin on DatabaseAccessor<AppDatabase> {
  $PatientsTable get patients => attachedDatabase.patients;
  PatientsDaoManager get managers => PatientsDaoManager(this);
}

class PatientsDaoManager {
  final _$PatientsDaoMixin _db;
  PatientsDaoManager(this._db);
  $$PatientsTableTableManager get patients =>
      $$PatientsTableTableManager(_db.attachedDatabase, _db.patients);
}

mixin _$AnalysesDaoMixin on DatabaseAccessor<AppDatabase> {
  $PatientsTable get patients => attachedDatabase.patients;
  $AnalysesTable get analyses => attachedDatabase.analyses;
  AnalysesDaoManager get managers => AnalysesDaoManager(this);
}

class AnalysesDaoManager {
  final _$AnalysesDaoMixin _db;
  AnalysesDaoManager(this._db);
  $$PatientsTableTableManager get patients =>
      $$PatientsTableTableManager(_db.attachedDatabase, _db.patients);
  $$AnalysesTableTableManager get analyses =>
      $$AnalysesTableTableManager(_db.attachedDatabase, _db.analyses);
}
