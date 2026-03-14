import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_provider.dart';
import '../auth/biometric_guard.dart';
import '../../features/capture/presentation/capture_photo_hka_screen.dart';
import '../../features/results/presentation/results_screen.dart';
import '../../features/results/presentation/hka_results_screen.dart';
import '../../core/analysis/analysis_result.dart';
import '../../features/patients/presentation/create_patient_screen.dart';
import '../../features/patients/presentation/patient_detail_screen.dart';
import '../../features/patients/presentation/patient_timeline_screen.dart';
import '../../features/patients/presentation/patients_screen.dart';
import '../../features/results/presentation/replay_screen.dart';
import '../../shared/widgets/biometric_lock_screen.dart';

// ---------------------------------------------------------------------------
// RouterNotifier — pont entre Riverpod et go_router refreshListenable
// ---------------------------------------------------------------------------

/// Notifier qui observe [biometricNotifierProvider] et notifie go_router
/// de réévaluer le redirect quand l'état biométrique change.
///
/// Pattern recommandé pour go_router + Riverpod :
/// [refreshListenable] attend un [Listenable] — ce ChangeNotifier fait le pont.
class _BiometricRouterNotifier extends ChangeNotifier {
  _BiometricRouterNotifier(Ref ref) {
    // Écouter le provider biométrique et notifier le router à chaque changement.
    ref.listen(biometricNotifierProvider, (_, __) {
      notifyListeners();
    });
  }
}

/// Provider du [_BiometricRouterNotifier] — scoped dans core/.
final _biometricRouterNotifierProvider =
    Provider<_BiometricRouterNotifier>((ref) {
  final notifier = _BiometricRouterNotifier(ref);
  // Disposer le ChangeNotifier quand le provider est détruit.
  ref.onDispose(notifier.dispose);
  return notifier;
});

// ---------------------------------------------------------------------------
// routerProvider — GoRouter configuré avec biometric redirect
// ---------------------------------------------------------------------------

/// Provider du GoRouter applicatif.
///
/// Routes :
/// - `/lock`              → [BiometricLockScreen] — écran de verrouillage (AC5)
/// - `/`                  → redirect vers `/patients`
/// - `/patients`          → [PatientsScreen] — liste des patients (Story 2.1)
///   - `/patients/create` → [CreatePatientScreen] — création patient (Story 2.2)
///   - `/patients/:id`    → [PatientDetailScreen] — fiche patient (Story 2.2 stub)
///     - `/patients/:id/capture`              → [CaptureScreen] — capture guidée (Story 3.1)
///     - `/patients/:id/analyses/:analysisId` → [AnalysisResultsScreen] — résultats (Story 2.3 stub)
///     - `/patients/:id/timeline`             → [PatientTimelineScreen] — progression clinique (Story 2.4)
///
/// Le redirect [biometricGuard] protège TOUTES les routes (AC3).
/// [refreshListenable] garantit que le redirect est réévalué à chaque
/// changement d'état biométrique (unlock / lock / unavailable).
final routerProvider = Provider<GoRouter>((ref) {
  // ref.read est correct ici : routerProvider est un Provider non-autodispose
  // qui ne se rebuild pas. ref.watch serait trompeur (M5) — le notifier est
  // obtenu une seule fois à la création du provider.
  final notifier = ref.read(_biometricRouterNotifierProvider);

  final router = GoRouter(
    debugLogDiagnostics: kDebugMode,
    refreshListenable: notifier,
    redirect: (context, state) => biometricGuard(state, ref),
    routes: [
      GoRoute(
        path: '/lock',
        builder: (context, state) => const BiometricLockScreen(),
      ),
      // ── Story 3.0 : Capture Photo HKA ─────────────────────────────────────
      /// Route top-level `/capture` — CapturePhotoHkaScreen (AC2 : caméra native).
      /// Navigué depuis la fiche patient (Story 2.2, implémenté en Story 3.0+).
      GoRoute(
        path: '/capture',
        builder: (context, state) => const CapturePhotoHkaScreen(),
      ),
      // ── Story 3.0 + 3.4 : Résultats HKA ──────────────────────────────────
      /// Route top-level `/results` — reçoit [AnalysisSuccess] via state.extra.
      /// Placeholder jusqu'à Story 3.4 (HkaResultsScreen complet).
      GoRoute(
        path: '/results',
        builder: (context, state) => HkaResultsScreen(
          analysisSuccess: state.extra as AnalysisSuccess?,
        ),
      ),
      GoRoute(
        path: '/',
        redirect: (_, __) => '/patients',
      ),
      GoRoute(
        path: '/patients',
        builder: (context, state) => const PatientsScreen(),
        routes: [
          GoRoute(
            path: 'create',
            builder: (context, state) => const CreatePatientScreen(),
          ),
          GoRoute(
            path: ':patientId',
            builder: (context, state) => PatientDetailScreen(
              patientId: state.pathParameters['patientId']!,
            ),
            routes: [
              GoRoute(
                path: 'analyses/:analysisId',
                builder: (context, state) => ResultsScreen(
                  analysisId: state.pathParameters['analysisId']!,
                ),
                routes: [
                  // Route replay expert — Story 3.5 (AC1-AC10)
                  GoRoute(
                    path: 'replay',
                    name: 'analysisReplay',
                    builder: (context, state) => ReplayScreen(
                      analysisId: state.pathParameters['analysisId']!,
                    ),
                  ),
                ],
              ),
              GoRoute(
                path: 'timeline',
                builder: (context, state) => PatientTimelineScreen(
                  patientId: state.pathParameters['patientId']!,
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  );
  // Disposer le GoRouter quand le provider est détruit.
  ref.onDispose(router.dispose);
  return router;
});
