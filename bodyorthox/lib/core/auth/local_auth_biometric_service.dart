import 'package:local_auth/local_auth.dart';
import 'biometric_service.dart';

/// Implémentation concrète de [BiometricService] via le package local_auth 3.x.
///
/// RÈGLE CRITIQUE — `biometricOnly: true` :
/// Interdit le fallback PIN iOS. Conforme RGPD / EU MDR pour données médicales.
/// [Source: docs/planning-artifacts/architecture.md#Authentification-Sécurité]
///
/// Constructeur injectable via [LocalAuthBiometricService.withAuth()] pour les tests.
class LocalAuthBiometricService implements BiometricService {
  final LocalAuthentication _auth;

  /// Constructeur par défaut — utilise l'instance LocalAuthentication standard.
  LocalAuthBiometricService() : _auth = LocalAuthentication();

  /// Constructeur injectable — permet de passer un mock en tests unitaires.
  /// Pattern recommandé par le story file (T1.6).
  LocalAuthBiometricService.withAuth(LocalAuthentication auth) : _auth = auth;

  /// Retourne true si l'appareil supporte la biométrie ET qu'au moins
  /// une empreinte/Face ID est enrôlée.
  ///
  /// Cas couverts :
  /// - Appareil ne supporte pas la biométrie → false
  /// - Appareil supporte mais aucune empreinte enrôlée → false
  /// - Appareil supporte et biométrie configurée → true
  @override
  Future<bool> isBiometricAvailable() async {
    try {
      final isDeviceSupported = await _auth.isDeviceSupported();
      if (!isDeviceSupported) return false;

      final availableBiometrics = await _auth.getAvailableBiometrics();
      return availableBiometrics.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Lance le prompt biométrique iOS via local_auth 3.x.
  ///
  /// local_auth 3.x API : paramètres directs (pas d'AuthenticationOptions).
  /// `biometricOnly: true` — refuse le fallback PIN iOS (obligatoire story 1.2).
  /// `persistAcrossBackgrounding: true` — équivalent stickyAuth, gère les interruptions
  /// (appels entrants) sans annuler le prompt.
  ///
  /// Retourne false en cas d'annulation, d'échec, ou d'exception.
  @override
  Future<bool> authenticate() async {
    try {
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) return false;

      return await _auth.authenticate(
        localizedReason:
            'Déverrouillez BodyOrthox pour accéder à vos données patients',
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );
    } catch (_) {
      return false;
    }
  }
}
