/// Interface abstraite BiometricService — permet le mock dans les tests.
/// [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales]
///
/// Toute interaction avec local_auth est encapsulée derrière cette interface —
/// jamais d'appel direct à LocalAuthentication en dehors de l'implémentation concrète.
abstract class BiometricService {
  /// Retourne true si l'appareil supporte la biométrie ET qu'au moins
  /// une empreinte/Face ID est enrôlée.
  Future<bool> isBiometricAvailable();

  /// Lance le prompt biométrique iOS.
  /// Retourne true si l'authentification réussit.
  /// Ne retourne jamais d'exception — les erreurs sont converties en false.
  Future<bool> authenticate();
}
