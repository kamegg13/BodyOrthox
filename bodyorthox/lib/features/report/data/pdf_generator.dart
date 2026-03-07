// PdfGenerator — génération du rapport PDF structuré (Story 4.1).
// Disclaimer de correction manuelle câblé dès Story 3.5 (AC5).
// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task5]
import '../../capture/domain/analysis.dart';
import '../../../core/legal/legal_constants.dart';

/// Générateur de rapport PDF BodyOrthox.
///
/// Story 3.5 : expose [manualCorrectionDisclaimerText] utilisé dans la section
/// métadonnées du rapport.
/// Story 4.1 : complétera la génération PDF complète (layout, sections, export).
///
/// INTERDIT : texte de disclaimer inline — utiliser [LegalConstants] uniquement.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]
class PdfGenerator {
  const PdfGenerator._();

  /// Retourne le disclaimer de correction manuelle à insérer dans le rapport PDF,
  /// ou null si aucune correction n'a été effectuée.
  ///
  /// Logique (AC5) :
  /// - Si [analysis.manualCorrectionApplied] == false → null
  /// - Si [analysis.manualCorrectionJoint] == null → null
  /// - Sinon → [LegalConstants.manualCorrectionDisclaimer(jointLabel)]
  ///
  /// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task5.2]
  static String? manualCorrectionDisclaimerText(Analysis analysis) {
    if (!analysis.manualCorrectionApplied) return null;
    final joint = analysis.manualCorrectionJoint;
    if (joint == null) return null;

    final jointLabel = _localizedJointName(joint);
    return LegalConstants.manualCorrectionDisclaimer(jointLabel);
  }

  /// Traduit l'identifiant interne du joint en nom localisé français.
  static String _localizedJointName(String joint) => switch (joint) {
        'knee' => 'Genou',
        'hip' => 'Hanche',
        'ankle' => 'Cheville',
        _ => joint,
      };
}
