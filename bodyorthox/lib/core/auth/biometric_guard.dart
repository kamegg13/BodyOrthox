import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'auth_provider.dart';
import 'biometric_notifier.dart';

/// Redirect go_router — point de contrôle biométrique unique.
///
/// Toutes les routes applicatives passent par ici.
/// Retourne '/lock' si l'utilisateur n'est pas authentifié.
/// Retourne null si l'accès est autorisé (go_router continue la navigation normale).
///
/// RÈGLE : Ce guard est le SEUL point de contrôle biométrique.
/// Aucun widget ou notifier feature ne doit effectuer ce check directement.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]
String? biometricGuard(GoRouterState state, Ref ref) {
  // Ne jamais rediriger depuis /lock — évite la boucle infinie de redirects.
  if (state.matchedLocation == '/lock') return null;

  final biometricState = ref.read(biometricNotifierProvider);

  // Switch exhaustif sur AsyncValue<BiometricState> — pas de wildcard (H3).
  // AsyncValue est une sealed class Dart 3 avec exactement 3 sous-types :
  // AsyncData, AsyncLoading, AsyncError. Ces 3 cas couvrent l'exhaustivité.
  return switch (biometricState) {
    AsyncData(:final value) => switch (value) {
        BiometricUnlocked() => null,       // Accès autorisé
        BiometricLocked() => '/lock',      // Verrouillé → écran de lock
        BiometricUnavailable() => '/lock', // Biométrie absente → même écran
      },
    AsyncLoading() => '/lock',             // Auth en cours → garder sur lock
    AsyncError() => '/lock',              // Erreur → verrouillé par défaut
  };
}
