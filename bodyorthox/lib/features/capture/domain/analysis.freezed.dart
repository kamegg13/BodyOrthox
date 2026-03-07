// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'analysis.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Analysis {
  String get id;
  String get patientId;
  DateTime get createdAt;
  double get kneeAngle;
  double get hipAngle;
  double get ankleAngle;
  double get confidenceScore;

  /// Vrai si le praticien a corrigé manuellement un point articulaire (Story 3.5).
  bool get manualCorrectionApplied;

  /// Articulation corrigée manuellement : 'knee', 'hip' ou 'ankle'.
  String? get manualCorrectionJoint;

  /// Create a copy of Analysis
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AnalysisCopyWith<Analysis> get copyWith =>
      _$AnalysisCopyWithImpl<Analysis>(this as Analysis, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Analysis &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.patientId, patientId) ||
                other.patientId == patientId) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.kneeAngle, kneeAngle) ||
                other.kneeAngle == kneeAngle) &&
            (identical(other.hipAngle, hipAngle) ||
                other.hipAngle == hipAngle) &&
            (identical(other.ankleAngle, ankleAngle) ||
                other.ankleAngle == ankleAngle) &&
            (identical(other.confidenceScore, confidenceScore) ||
                other.confidenceScore == confidenceScore) &&
            (identical(
                    other.manualCorrectionApplied, manualCorrectionApplied) ||
                other.manualCorrectionApplied == manualCorrectionApplied) &&
            (identical(other.manualCorrectionJoint, manualCorrectionJoint) ||
                other.manualCorrectionJoint == manualCorrectionJoint));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      patientId,
      createdAt,
      kneeAngle,
      hipAngle,
      ankleAngle,
      confidenceScore,
      manualCorrectionApplied,
      manualCorrectionJoint);

  @override
  String toString() {
    return 'Analysis(id: $id, patientId: $patientId, createdAt: $createdAt, kneeAngle: $kneeAngle, hipAngle: $hipAngle, ankleAngle: $ankleAngle, confidenceScore: $confidenceScore, manualCorrectionApplied: $manualCorrectionApplied, manualCorrectionJoint: $manualCorrectionJoint)';
  }
}

/// @nodoc
abstract mixin class $AnalysisCopyWith<$Res> {
  factory $AnalysisCopyWith(Analysis value, $Res Function(Analysis) _then) =
      _$AnalysisCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String patientId,
      DateTime createdAt,
      double kneeAngle,
      double hipAngle,
      double ankleAngle,
      double confidenceScore,
      bool manualCorrectionApplied,
      String? manualCorrectionJoint});
}

/// @nodoc
class _$AnalysisCopyWithImpl<$Res> implements $AnalysisCopyWith<$Res> {
  _$AnalysisCopyWithImpl(this._self, this._then);

  final Analysis _self;
  final $Res Function(Analysis) _then;

  /// Create a copy of Analysis
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? patientId = null,
    Object? createdAt = null,
    Object? kneeAngle = null,
    Object? hipAngle = null,
    Object? ankleAngle = null,
    Object? confidenceScore = null,
    Object? manualCorrectionApplied = null,
    Object? manualCorrectionJoint = freezed,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      patientId: null == patientId
          ? _self.patientId
          : patientId // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      kneeAngle: null == kneeAngle
          ? _self.kneeAngle
          : kneeAngle // ignore: cast_nullable_to_non_nullable
              as double,
      hipAngle: null == hipAngle
          ? _self.hipAngle
          : hipAngle // ignore: cast_nullable_to_non_nullable
              as double,
      ankleAngle: null == ankleAngle
          ? _self.ankleAngle
          : ankleAngle // ignore: cast_nullable_to_non_nullable
              as double,
      confidenceScore: null == confidenceScore
          ? _self.confidenceScore
          : confidenceScore // ignore: cast_nullable_to_non_nullable
              as double,
      manualCorrectionApplied: null == manualCorrectionApplied
          ? _self.manualCorrectionApplied
          : manualCorrectionApplied // ignore: cast_nullable_to_non_nullable
              as bool,
      manualCorrectionJoint: freezed == manualCorrectionJoint
          ? _self.manualCorrectionJoint
          : manualCorrectionJoint // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// Adds pattern-matching-related methods to [Analysis].
extension AnalysisPatterns on Analysis {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_Analysis value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Analysis() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_Analysis value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Analysis():
        return $default(_that);
      case _:
        throw StateError('Unexpected subclass');
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_Analysis value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Analysis() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            String id,
            String patientId,
            DateTime createdAt,
            double kneeAngle,
            double hipAngle,
            double ankleAngle,
            double confidenceScore,
            bool manualCorrectionApplied,
            String? manualCorrectionJoint)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Analysis() when $default != null:
        return $default(
            _that.id,
            _that.patientId,
            _that.createdAt,
            _that.kneeAngle,
            _that.hipAngle,
            _that.ankleAngle,
            _that.confidenceScore,
            _that.manualCorrectionApplied,
            _that.manualCorrectionJoint);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            String id,
            String patientId,
            DateTime createdAt,
            double kneeAngle,
            double hipAngle,
            double ankleAngle,
            double confidenceScore,
            bool manualCorrectionApplied,
            String? manualCorrectionJoint)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Analysis():
        return $default(
            _that.id,
            _that.patientId,
            _that.createdAt,
            _that.kneeAngle,
            _that.hipAngle,
            _that.ankleAngle,
            _that.confidenceScore,
            _that.manualCorrectionApplied,
            _that.manualCorrectionJoint);
      case _:
        throw StateError('Unexpected subclass');
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            String id,
            String patientId,
            DateTime createdAt,
            double kneeAngle,
            double hipAngle,
            double ankleAngle,
            double confidenceScore,
            bool manualCorrectionApplied,
            String? manualCorrectionJoint)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Analysis() when $default != null:
        return $default(
            _that.id,
            _that.patientId,
            _that.createdAt,
            _that.kneeAngle,
            _that.hipAngle,
            _that.ankleAngle,
            _that.confidenceScore,
            _that.manualCorrectionApplied,
            _that.manualCorrectionJoint);
      case _:
        return null;
    }
  }
}

/// @nodoc

class _Analysis implements Analysis {
  const _Analysis(
      {required this.id,
      required this.patientId,
      required this.createdAt,
      required this.kneeAngle,
      required this.hipAngle,
      required this.ankleAngle,
      required this.confidenceScore,
      this.manualCorrectionApplied = false,
      this.manualCorrectionJoint});

  @override
  final String id;
  @override
  final String patientId;
  @override
  final DateTime createdAt;
  @override
  final double kneeAngle;
  @override
  final double hipAngle;
  @override
  final double ankleAngle;
  @override
  final double confidenceScore;

  /// Vrai si le praticien a corrigé manuellement un point articulaire (Story 3.5).
  @override
  @JsonKey()
  final bool manualCorrectionApplied;

  /// Articulation corrigée manuellement : 'knee', 'hip' ou 'ankle'.
  @override
  final String? manualCorrectionJoint;

  /// Create a copy of Analysis
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AnalysisCopyWith<_Analysis> get copyWith =>
      __$AnalysisCopyWithImpl<_Analysis>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Analysis &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.patientId, patientId) ||
                other.patientId == patientId) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.kneeAngle, kneeAngle) ||
                other.kneeAngle == kneeAngle) &&
            (identical(other.hipAngle, hipAngle) ||
                other.hipAngle == hipAngle) &&
            (identical(other.ankleAngle, ankleAngle) ||
                other.ankleAngle == ankleAngle) &&
            (identical(other.confidenceScore, confidenceScore) ||
                other.confidenceScore == confidenceScore) &&
            (identical(
                    other.manualCorrectionApplied, manualCorrectionApplied) ||
                other.manualCorrectionApplied == manualCorrectionApplied) &&
            (identical(other.manualCorrectionJoint, manualCorrectionJoint) ||
                other.manualCorrectionJoint == manualCorrectionJoint));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      patientId,
      createdAt,
      kneeAngle,
      hipAngle,
      ankleAngle,
      confidenceScore,
      manualCorrectionApplied,
      manualCorrectionJoint);

  @override
  String toString() {
    return 'Analysis(id: $id, patientId: $patientId, createdAt: $createdAt, kneeAngle: $kneeAngle, hipAngle: $hipAngle, ankleAngle: $ankleAngle, confidenceScore: $confidenceScore, manualCorrectionApplied: $manualCorrectionApplied, manualCorrectionJoint: $manualCorrectionJoint)';
  }
}

/// @nodoc
abstract mixin class _$AnalysisCopyWith<$Res>
    implements $AnalysisCopyWith<$Res> {
  factory _$AnalysisCopyWith(_Analysis value, $Res Function(_Analysis) _then) =
      __$AnalysisCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String patientId,
      DateTime createdAt,
      double kneeAngle,
      double hipAngle,
      double ankleAngle,
      double confidenceScore,
      bool manualCorrectionApplied,
      String? manualCorrectionJoint});
}

/// @nodoc
class __$AnalysisCopyWithImpl<$Res> implements _$AnalysisCopyWith<$Res> {
  __$AnalysisCopyWithImpl(this._self, this._then);

  final _Analysis _self;
  final $Res Function(_Analysis) _then;

  /// Create a copy of Analysis
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? patientId = null,
    Object? createdAt = null,
    Object? kneeAngle = null,
    Object? hipAngle = null,
    Object? ankleAngle = null,
    Object? confidenceScore = null,
    Object? manualCorrectionApplied = null,
    Object? manualCorrectionJoint = freezed,
  }) {
    return _then(_Analysis(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      patientId: null == patientId
          ? _self.patientId
          : patientId // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: null == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      kneeAngle: null == kneeAngle
          ? _self.kneeAngle
          : kneeAngle // ignore: cast_nullable_to_non_nullable
              as double,
      hipAngle: null == hipAngle
          ? _self.hipAngle
          : hipAngle // ignore: cast_nullable_to_non_nullable
              as double,
      ankleAngle: null == ankleAngle
          ? _self.ankleAngle
          : ankleAngle // ignore: cast_nullable_to_non_nullable
              as double,
      confidenceScore: null == confidenceScore
          ? _self.confidenceScore
          : confidenceScore // ignore: cast_nullable_to_non_nullable
              as double,
      manualCorrectionApplied: null == manualCorrectionApplied
          ? _self.manualCorrectionApplied
          : manualCorrectionApplied // ignore: cast_nullable_to_non_nullable
              as bool,
      manualCorrectionJoint: freezed == manualCorrectionJoint
          ? _self.manualCorrectionJoint
          : manualCorrectionJoint // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

// dart format on
