/// Constante centralisée — disclaimer EU MDR.
/// INTERDIT : texte inline dans widgets ou PDF generator.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]
abstract class LegalConstants {
  static const String mdrDisclaimer =
      'BodyOrthox est un outil de documentation clinique. '
      'Les données produites ne constituent pas un acte de '
      'diagnostic médical et ne se substituent pas au jugement '
      'clinique du praticien.';

  /// Script de réassurance RGPD — affiché inline avant toute capture vidéo.
  /// INTERDIT : reproduire ce texte inline dans un widget.
  /// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T1]
  static const String rgpdReassuranceScript =
      'Cette vidéo est analysée localement sur cet appareil. '
      'Elle n\'est pas transmise ni stockée sur un serveur externe.';

  /// Disclaimer de correction manuelle — affiché dans le rapport PDF quand
  /// un point articulaire a été corrigé manuellement (Story 3.5, AC5).
  ///
  /// INTERDIT : texte inline dans pdf_generator.dart — utiliser cette méthode.
  /// [Source: docs/implementation-artifacts/3-5-replay-expert-correction-manuelle.md#Task5]
  static String manualCorrectionDisclaimer(String jointName) =>
      'Données $jointName : estimées — vérification manuelle effectuée.';
}
