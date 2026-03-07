// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'confidence_score.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ConfidenceScore {
  double get kneeScore;
  double get hipScore;
  double get ankleScore;

  /// Create a copy of ConfidenceScore
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $ConfidenceScoreCopyWith<ConfidenceScore> get copyWith =>
      _$ConfidenceScoreCopyWithImpl<ConfidenceScore>(
          this as ConfidenceScore, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is ConfidenceScore &&
            (identical(other.kneeScore, kneeScore) ||
                other.kneeScore == kneeScore) &&
            (identical(other.hipScore, hipScore) ||
                other.hipScore == hipScore) &&
            (identical(other.ankleScore, ankleScore) ||
                other.ankleScore == ankleScore));
  }

  @override
  int get hashCode => Object.hash(runtimeType, kneeScore, hipScore, ankleScore);

  @override
  String toString() {
    return 'ConfidenceScore(kneeScore: $kneeScore, hipScore: $hipScore, ankleScore: $ankleScore)';
  }
}

/// @nodoc
abstract mixin class $ConfidenceScoreCopyWith<$Res> {
  factory $ConfidenceScoreCopyWith(
          ConfidenceScore value, $Res Function(ConfidenceScore) _then) =
      _$ConfidenceScoreCopyWithImpl;
  @useResult
  $Res call({double kneeScore, double hipScore, double ankleScore});
}

/// @nodoc
class _$ConfidenceScoreCopyWithImpl<$Res>
    implements $ConfidenceScoreCopyWith<$Res> {
  _$ConfidenceScoreCopyWithImpl(this._self, this._then);

  final ConfidenceScore _self;
  final $Res Function(ConfidenceScore) _then;

  /// Create a copy of ConfidenceScore
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? kneeScore = null,
    Object? hipScore = null,
    Object? ankleScore = null,
  }) {
    return _then(_self.copyWith(
      kneeScore: null == kneeScore
          ? _self.kneeScore
          : kneeScore // ignore: cast_nullable_to_non_nullable
              as double,
      hipScore: null == hipScore
          ? _self.hipScore
          : hipScore // ignore: cast_nullable_to_non_nullable
              as double,
      ankleScore: null == ankleScore
          ? _self.ankleScore
          : ankleScore // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// Adds pattern-matching-related methods to [ConfidenceScore].
extension ConfidenceScorePatterns on ConfidenceScore {
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
    TResult Function(_ConfidenceScore value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _ConfidenceScore() when $default != null:
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
    TResult Function(_ConfidenceScore value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ConfidenceScore():
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
    TResult? Function(_ConfidenceScore value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ConfidenceScore() when $default != null:
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
    TResult Function(double kneeScore, double hipScore, double ankleScore)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _ConfidenceScore() when $default != null:
        return $default(_that.kneeScore, _that.hipScore, _that.ankleScore);
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
    TResult Function(double kneeScore, double hipScore, double ankleScore)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ConfidenceScore():
        return $default(_that.kneeScore, _that.hipScore, _that.ankleScore);
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
    TResult? Function(double kneeScore, double hipScore, double ankleScore)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ConfidenceScore() when $default != null:
        return $default(_that.kneeScore, _that.hipScore, _that.ankleScore);
      case _:
        return null;
    }
  }
}

/// @nodoc

class _ConfidenceScore implements ConfidenceScore {
  const _ConfidenceScore(
      {required this.kneeScore,
      required this.hipScore,
      required this.ankleScore});

  @override
  final double kneeScore;
  @override
  final double hipScore;
  @override
  final double ankleScore;

  /// Create a copy of ConfidenceScore
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$ConfidenceScoreCopyWith<_ConfidenceScore> get copyWith =>
      __$ConfidenceScoreCopyWithImpl<_ConfidenceScore>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _ConfidenceScore &&
            (identical(other.kneeScore, kneeScore) ||
                other.kneeScore == kneeScore) &&
            (identical(other.hipScore, hipScore) ||
                other.hipScore == hipScore) &&
            (identical(other.ankleScore, ankleScore) ||
                other.ankleScore == ankleScore));
  }

  @override
  int get hashCode => Object.hash(runtimeType, kneeScore, hipScore, ankleScore);

  @override
  String toString() {
    return 'ConfidenceScore(kneeScore: $kneeScore, hipScore: $hipScore, ankleScore: $ankleScore)';
  }
}

/// @nodoc
abstract mixin class _$ConfidenceScoreCopyWith<$Res>
    implements $ConfidenceScoreCopyWith<$Res> {
  factory _$ConfidenceScoreCopyWith(
          _ConfidenceScore value, $Res Function(_ConfidenceScore) _then) =
      __$ConfidenceScoreCopyWithImpl;
  @override
  @useResult
  $Res call({double kneeScore, double hipScore, double ankleScore});
}

/// @nodoc
class __$ConfidenceScoreCopyWithImpl<$Res>
    implements _$ConfidenceScoreCopyWith<$Res> {
  __$ConfidenceScoreCopyWithImpl(this._self, this._then);

  final _ConfidenceScore _self;
  final $Res Function(_ConfidenceScore) _then;

  /// Create a copy of ConfidenceScore
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? kneeScore = null,
    Object? hipScore = null,
    Object? ankleScore = null,
  }) {
    return _then(_ConfidenceScore(
      kneeScore: null == kneeScore
          ? _self.kneeScore
          : kneeScore // ignore: cast_nullable_to_non_nullable
              as double,
      hipScore: null == hipScore
          ? _self.hipScore
          : hipScore // ignore: cast_nullable_to_non_nullable
              as double,
      ankleScore: null == ankleScore
          ? _self.ankleScore
          : ankleScore // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

// dart format on
