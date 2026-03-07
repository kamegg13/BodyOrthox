import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'biometric_notifier.dart';

// Re-export biometricServiceProvider pour que les consommateurs n'importent
// que auth_provider.dart — point d'entrée unique pour les providers auth.
export 'biometric_service_provider.dart' show biometricServiceProvider;

/// Provider de l'état biométrique global.
///
/// AsyncNotifierProvider<BiometricNotifier, BiometricState> — Riverpod 3.x.
/// État initial : AsyncData(BiometricLocked()) — toujours verrouillé au démarrage.
///
/// RÈGLE : Ce provider est le SEUL point d'accès à l'état biométrique.
/// Aucun feature provider ne doit en dériver ou le dupliquer.
final biometricNotifierProvider =
    AsyncNotifierProvider<BiometricNotifier, BiometricState>(
  BiometricNotifier.new,
);
