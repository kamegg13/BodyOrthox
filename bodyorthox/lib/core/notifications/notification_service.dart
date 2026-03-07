// Service de notifications locales — zero APNs, zero réseau (FR29).
// [Source: docs/implementation-artifacts/3-3-pipeline-ml-on-device-extraction-des-angles.md#T6]
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../features/capture/domain/articular_angles.dart';

/// Service de notifications locales — wrapping [FlutterLocalNotificationsPlugin].
///
/// Utilisé UNIQUEMENT pour les notifications on-device — jamais APNs ni réseau.
/// [Source: docs/planning-artifacts/epics.md#FR29]
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  /// Initialise le plugin — à appeler depuis main_dev.dart / main_prod.dart.
  Future<void> initialize() async {
    if (_initialized) return;

    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _plugin.initialize(
      settings: const InitializationSettings(iOS: darwinSettings),
    );

    _initialized = true;
  }

  /// Envoie la notification "Analyse prête" après le pipeline ML (AC5).
  ///
  /// Format : "L'analyse de [patientLabel] est prête — [knee]°/[hip]°/[ankle]°"
  /// [Source: docs/planning-artifacts/epics.md#FR40]
  Future<void> showAnalysisReady({
    required String patientLabel,
    required ArticularAngles angles,
  }) async {
    if (!_initialized) await initialize();

    const darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: false,
      presentSound: false,
    );

    final body =
        'L\'analyse de $patientLabel est prête — '
        '${angles.kneeAngle}°/${angles.hipAngle}°/${angles.ankleAngle}°';

    await _plugin.show(
      id: DateTime.now().millisecondsSinceEpoch & 0x7FFFFFFF,
      title: 'Analyse prête',
      body: body,
      notificationDetails: const NotificationDetails(iOS: darwinDetails),
    );
  }
}
