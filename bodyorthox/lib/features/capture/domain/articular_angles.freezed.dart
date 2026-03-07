// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'articular_angles.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ArticularAngles {
  double get kneeAngle; // Ex: 42.3°
  double get hipAngle; // Ex: 67.1°
  double get ankleAngle;

  /// Create a copy of ArticularAngles
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $ArticularAnglesCopyWith<ArticularAngles> get copyWith =>
      _$ArticularAnglesCopyWithImpl<ArticularAngles>(
          this as ArticularAngles, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is ArticularAngles &&
            (identical(other.kneeAngle, kneeAngle) ||
                other.kneeAngle == kneeAngle) &&
            (identical(other.hipAngle, hipAngle) ||
                other.hipAngle == hipAngle) &&
            (identical(other.ankleAngle, ankleAngle) ||
                other.ankleAngle == ankleAngle));
  }

  @override
  int get hashCode => Object.hash(runtimeType, kneeAngle, hipAngle, ankleAngle);

  @override
  String toString() {
    return 'ArticularAngles(kneeAngle: $kneeAngle, hipAngle: $hipAngle, ankleAngle: $ankleAngle)';
  }
}

/// @nodoc
abstract mixin class $ArticularAnglesCopyWith<$Res> {
  factory $ArticularAnglesCopyWith(
          ArticularAngles value, $Res Function(ArticularAngles) _then) =
      _$ArticularAnglesCopyWithImpl;
  @useResult
  $Res call({double kneeAngle, double hipAngle, double ankleAngle});
}

/// @nodoc
class _$ArticularAnglesCopyWithImpl<$Res>
    implements $ArticularAnglesCopyWith<$Res> {
  _$ArticularAnglesCopyWithImpl(this._self, this._then);

  final ArticularAngles _self;
  final $Res Function(ArticularAngles) _then;

  /// Create a copy of ArticularAngles
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? kneeAngle = null,
    Object? hipAngle = null,
    Object? ankleAngle = null,
  }) {
    return _then(_self.copyWith(
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
    ));
  }
}

/// Adds pattern-matching-related methods to [ArticularAngles].
extension ArticularAnglesPatterns on ArticularAngles {
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
    TResult Function(_ArticularAngles value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _ArticularAngles() when $default != null:
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
    TResult Function(_ArticularAngles value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ArticularAngles():
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
    TResult? Function(_ArticularAngles value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ArticularAngles() when $default != null:
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
    TResult Function(double kneeAngle, double hipAngle, double ankleAngle)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _ArticularAngles() when $default != null:
        return $default(_that.kneeAngle, _that.hipAngle, _that.ankleAngle);
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
    TResult Function(double kneeAngle, double hipAngle, double ankleAngle)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ArticularAngles():
        return $default(_that.kneeAngle, _that.hipAngle, _that.ankleAngle);
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
    TResult? Function(double kneeAngle, double hipAngle, double ankleAngle)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _ArticularAngles() when $default != null:
        return $default(_that.kneeAngle, _that.hipAngle, _that.ankleAngle);
      case _:
        return null;
    }
  }
}

/// @nodoc

class _ArticularAngles implements ArticularAngles {
  const _ArticularAngles(
      {required this.kneeAngle,
      required this.hipAngle,
      required this.ankleAngle});

  @override
  final double kneeAngle;
// Ex: 42.3°
  @override
  final double hipAngle;
// Ex: 67.1°
  @override
  final double ankleAngle;

  /// Create a copy of ArticularAngles
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$ArticularAnglesCopyWith<_ArticularAngles> get copyWith =>
      __$ArticularAnglesCopyWithImpl<_ArticularAngles>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _ArticularAngles &&
            (identical(other.kneeAngle, kneeAngle) ||
                other.kneeAngle == kneeAngle) &&
            (identical(other.hipAngle, hipAngle) ||
                other.hipAngle == hipAngle) &&
            (identical(other.ankleAngle, ankleAngle) ||
                other.ankleAngle == ankleAngle));
  }

  @override
  int get hashCode => Object.hash(runtimeType, kneeAngle, hipAngle, ankleAngle);

  @override
  String toString() {
    return 'ArticularAngles(kneeAngle: $kneeAngle, hipAngle: $hipAngle, ankleAngle: $ankleAngle)';
  }
}

/// @nodoc
abstract mixin class _$ArticularAnglesCopyWith<$Res>
    implements $ArticularAnglesCopyWith<$Res> {
  factory _$ArticularAnglesCopyWith(
          _ArticularAngles value, $Res Function(_ArticularAngles) _then) =
      __$ArticularAnglesCopyWithImpl;
  @override
  @useResult
  $Res call({double kneeAngle, double hipAngle, double ankleAngle});
}

/// @nodoc
class __$ArticularAnglesCopyWithImpl<$Res>
    implements _$ArticularAnglesCopyWith<$Res> {
  __$ArticularAnglesCopyWithImpl(this._self, this._then);

  final _ArticularAngles _self;
  final $Res Function(_ArticularAngles) _then;

  /// Create a copy of ArticularAngles
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? kneeAngle = null,
    Object? hipAngle = null,
    Object? ankleAngle = null,
  }) {
    return _then(_ArticularAngles(
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
    ));
  }
}

// dart format on
