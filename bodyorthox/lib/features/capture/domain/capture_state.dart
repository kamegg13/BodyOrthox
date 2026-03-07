// Machine d'états de la session de capture guidée.
// [Source: docs/implementation-artifacts/3-1-lancement-de-session-guidage-camera.md#T1.3]
import 'analysis_error.dart';
import 'analysis_result.dart';

/// État de la session de capture — sealed class Dart 3.
///
/// Switch exhaustif OBLIGATOIRE dans l'UI — interdit d'utiliser `is` checks.
sealed class CaptureState {
  const CaptureState();
}

/// Aucune capture en cours — état initial et état de repos après arrêt.
final class CaptureIdle extends CaptureState {
  const CaptureIdle();
}

/// Permission caméra en cours de demande (dialog affiché).
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T2]
final class CapturePermissionPending extends CaptureState {
  const CapturePermissionPending();
}

/// Permission caméra refusée par l'utilisateur.
/// [Source: docs/implementation-artifacts/3-2-script-rgpd-demarrage-enregistrement.md#T2]
final class CapturePermissionDenied extends CaptureState {
  const CapturePermissionDenied();
}

/// Enregistrement actif (démarré via CaptureNotifier.startRecording()).
/// Story 3.3 complétera la logique d'enregistrement effective.
final class CaptureRecording extends CaptureState {
  const CaptureRecording();
}

/// Pipeline ML en cours d'exécution après la fin de l'enregistrement.
/// Traitement : Story 3.3.
final class CaptureProcessing extends CaptureState {
  const CaptureProcessing();
}

/// Analyse terminée avec succès — le résultat est disponible.
final class CaptureCompleted extends CaptureState {
  final AnalysisResult result;
  const CaptureCompleted(this.result);
}

/// Capture ou analyse échouée — l'erreur est disponible.
final class CaptureFailed extends CaptureState {
  final AnalysisError error;
  const CaptureFailed(this.error);
}
