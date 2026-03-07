// Angles articulaires — modèle de domaine immutable via Freezed.
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T1.3]
import 'package:freezed_annotation/freezed_annotation.dart';

part 'articular_angles.freezed.dart';

/// Angles articulaires en degrés — 1 décimale, immutables.
///
/// Valeurs représentatives calculées par médiane sur tous les frames analysés.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-format]
@freezed
abstract class ArticularAngles with _$ArticularAngles {
  const factory ArticularAngles({
    required double kneeAngle, // Ex: 42.3°
    required double hipAngle, // Ex: 67.1°
    required double ankleAngle, // Ex: 88.5°
  }) = _ArticularAngles;
}
