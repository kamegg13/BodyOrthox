import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'biometric_service.dart';
import 'biometric_service_provider.dart';

// ---------------------------------------------------------------------------
// Sealed class BiometricState — Dart 3 exhaustive switch obligatoire
// [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs]
// ---------------------------------------------------------------------------

sealed class BiometricState {
  const BiometricState();
}

/// L'utilisateur a passé l'authentification biométrique avec succès.
final class BiometricUnlocked extends BiometricState {
  const BiometricUnlocked();
}

/// L'app est verrouillée — l'utilisateur doit s'authentifier.
/// État initial et état après mise en background.
final class BiometricLocked extends BiometricState {
  const BiometricLocked();
}

/// La biométrie n'est pas disponible sur cet appareil (non supportée ou non enrôlée).
/// L'accès à l'app est bloqué (AC6).
final class BiometricUnavailable extends BiometricState {
  final String reason;
  const BiometricUnavailable(this.reason);
}

// ---------------------------------------------------------------------------
// BiometricNotifier — AsyncNotifier<BiometricState> + AppLifecycle observer
// ---------------------------------------------------------------------------

/// Notifier central de l'état biométrique.
///
/// Responsabilités :
/// 1. État initial = [BiometricLocked] — toujours verrouillé au démarrage
/// 2. Observer [AppLifecycleState] pour re-verrouiller en background
/// 3. Déclencher [authenticate()] sur foreground
/// 4. Exposer [authenticate()] pour le bouton "Se déverrouiller"
///
/// RÈGLE : Ce notifier est le SEUL à modifier l'état biométrique.
/// Aucun widget feature ne doit lire/écrire cet état directement.
/// [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]
class BiometricNotifier extends AsyncNotifier<BiometricState>
    with WidgetsBindingObserver {
  /// Guard anti-double-appel : empêche deux prompts Face ID simultanés.
  ///
  /// Scénario protégé : `didChangeAppLifecycleState(resumed)` ET
  /// `BiometricLockScreen.initState()` déclenchent `authenticate()` quasi-
  /// simultanément → sans ce guard, deux appels concurrent seraient possibles.
  bool _isAuthenticating = false;

  @override
  Future<BiometricState> build() async {
    // Enregistrer l'observer du cycle de vie de l'app.
    WidgetsBinding.instance.addObserver(this);

    // Nettoyer quand le provider est détruit (hot restart / dispose).
    ref.onDispose(() => WidgetsBinding.instance.removeObserver(this));

    // État initial : verrouillé — l'utilisateur DOIT s'authentifier.
    // Le prompt biométrique sera déclenché par BiometricLockScreen au montage.
    return const BiometricLocked();
  }

  // -------------------------------------------------------------------------
  // AppLifecycle observer — re-verrouillage automatique
  // -------------------------------------------------------------------------

  @override
  void didChangeAppLifecycleState(AppLifecycleState appState) {
    switch (appState) {
      case AppLifecycleState.paused:
        // Re-verrouiller uniquement quand l'app passe réellement en background.
        state = const AsyncData(BiometricLocked());
      case AppLifecycleState.resumed:
        // Déclencher l'auth automatiquement quand l'app revient au premier plan.
        authenticate();
      case AppLifecycleState.inactive:
        // Intentionnellement sans action (M3) : "inactive" est déclenché par
        // les appels entrants et notifications système — verrouiller ici couperait
        // la session en pleine consultation. Seul "paused" verrouille l'app.
        break;
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        // Pas d'action spécifique — l'app est en cours de fermeture.
        break;
    }
  }

  // -------------------------------------------------------------------------
  // authenticate() — méthode publique appelée par BiometricLockScreen
  // -------------------------------------------------------------------------

  /// Déclenche l'authentification biométrique via [BiometricService].
  ///
  /// Transitions de state :
  /// - → AsyncLoading (en cours d'auth)
  /// - → AsyncData(BiometricUnavailable) si biométrie non disponible
  /// - → AsyncData(BiometricUnlocked) si succès
  /// - → AsyncData(BiometricLocked) si annulation ou échec
  ///
  /// Protégé par [_isAuthenticating] : les appels concurrents sont ignorés
  /// (H2 — évite deux prompts Face ID simultanés depuis resumed + initState).
  Future<void> authenticate() async {
    if (_isAuthenticating) return;
    _isAuthenticating = true;
    try {
      state = const AsyncLoading();

      final service = ref.read(biometricServiceProvider);

      final isAvailable = await service.isBiometricAvailable();
      if (!isAvailable) {
        state = const AsyncData(
          BiometricUnavailable(
            'Aucune biométrie configurée. '
            'Rendez-vous dans Réglages → Face ID & code.',
          ),
        );
        return;
      }

      final success = await service.authenticate();
      state = AsyncData(
        success ? const BiometricUnlocked() : const BiometricLocked(),
      );
    } finally {
      _isAuthenticating = false;
    }
  }
}
