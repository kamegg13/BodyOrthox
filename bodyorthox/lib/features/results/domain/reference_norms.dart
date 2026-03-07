// Normes de référence articulaires par âge et profil morphologique.
// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task1]
import '../../../features/patients/domain/morphological_profile.dart';

/// Articulation biomécanique analysée.
enum ArticulationName { knee, hip, ankle }

/// Plage normative pour une articulation : [min, max] en degrés.
///
/// [evaluate] retourne le [NormStatus] par rapport à cette plage.
/// Borderline = ±15% au-delà des bornes.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task1]
class NormRange {
  const NormRange({required this.min, required this.max});

  final double min;
  final double max;

  /// Évalue [angle] par rapport à cette plage.
  ///
  /// - `[min, max]` → [NormNormal]
  /// - `±15%` au-delà des bornes → [NormBorderline]
  /// - Au-delà du borderline → [NormAbnormal]
  NormStatus evaluate(double angle) {
    if (angle >= min && angle <= max) return const NormNormal();
    final margin = (max - min) * 0.15;
    if (angle >= min - margin && angle <= max + margin) {
      return const NormBorderline();
    }
    return const NormAbnormal();
  }
}

/// Statut normatif d'un angle articulaire par rapport à la plage de référence.
sealed class NormStatus {
  const NormStatus();
}

final class NormNormal extends NormStatus {
  const NormNormal();
}

final class NormBorderline extends NormStatus {
  const NormBorderline();
}

final class NormAbnormal extends NormStatus {
  const NormAbnormal();
}

/// Plages normatives de référence par articulation, tranche d'âge et profil.
///
/// Source : Perry & Burnfield, "Gait Analysis: Normal and Pathological Function" (2nd ed.).
/// AVERTISSEMENT : valeurs à valider cliniquement avant intégration en production.
/// [Source: docs/implementation-artifacts/3-4-affichage-des-resultats-avec-normes-de-reference.md#Task1]
abstract class ReferenceNorms {
  static NormRange getNorm(
    ArticulationName articulation,
    int ageYears,
    MorphologicalProfile profile,
  ) {
    final group = _ageGroup(ageYears);
    return switch ((articulation, group, profile)) {
      // ─── Genou (flexion en marche) ────────────────────────────────────────
      (ArticulationName.knee, _AgeGroup.under40, MorphologicalProfile.standard) =>
        const NormRange(min: 55.0, max: 70.0),
      (ArticulationName.knee, _AgeGroup.fortyToSixty, MorphologicalProfile.standard) =>
        const NormRange(min: 52.0, max: 68.0),
      (ArticulationName.knee, _AgeGroup.over60, MorphologicalProfile.standard) =>
        const NormRange(min: 48.0, max: 65.0),
      // ─── Hanche (extension en marche) ────────────────────────────────────
      (ArticulationName.hip, _AgeGroup.under40, MorphologicalProfile.standard) =>
        const NormRange(min: 20.0, max: 30.0),
      (ArticulationName.hip, _AgeGroup.fortyToSixty, MorphologicalProfile.standard) =>
        const NormRange(min: 15.0, max: 28.0),
      (ArticulationName.hip, _AgeGroup.over60, MorphologicalProfile.standard) =>
        const NormRange(min: 10.0, max: 25.0),
      // ─── Cheville (dorsiflexion en phase d'appui) ────────────────────────
      (ArticulationName.ankle, _AgeGroup.under40, MorphologicalProfile.standard) =>
        const NormRange(min: 8.0, max: 15.0),
      (ArticulationName.ankle, _AgeGroup.fortyToSixty, MorphologicalProfile.standard) =>
        const NormRange(min: 6.0, max: 13.0),
      (ArticulationName.ankle, _AgeGroup.over60, MorphologicalProfile.standard) =>
        const NormRange(min: 5.0, max: 12.0),
      // ─── Profils non-standard : fallback sur standard (MVP) ──────────────
      _ => getNorm(articulation, ageYears, MorphologicalProfile.standard),
    };
  }
}

enum _AgeGroup { under40, fortyToSixty, over60 }

_AgeGroup _ageGroup(int age) {
  if (age < 40) return _AgeGroup.under40;
  if (age <= 60) return _AgeGroup.fortyToSixty;
  return _AgeGroup.over60;
}
