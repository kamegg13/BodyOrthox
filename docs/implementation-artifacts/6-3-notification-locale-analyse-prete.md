# Story 6.3 : Notification Locale "Analyse Prête"

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 6.3, Epic 6 (Onboarding & Expérience Utilisateur) -->

---

## Story

As a practitioner who has started an analysis,
I want to receive a local notification when the ML processing is complete,
So that I can attend to my patient while the analysis runs in the background and return when ready.

---

## Acceptance Criteria

**AC1 — Notification locale à la fin du traitement (succès)**
**Given** une analyse ML est en cours de traitement en background
**When** le traitement se termine avec succès
**Then** une notification locale est envoyée avec le titre "Analyse prête" et le corps "L'analyse de [Nom Patient] est prête — 23°/67°/41°" (FR40)

**AC2 — Notification locale à la fin du traitement (échec)**
**Given** une analyse ML est en cours de traitement en background
**When** le traitement échoue (MLDetectionFailed, VideoProcessingError, MLLowConfidence non récupérable)
**Then** une notification locale est envoyée avec le corps "L'analyse de [Nom Patient] a échoué — veuillez relancer"

**AC3 — 100% offline, zéro APNs**
**And** la notification fonctionne sans connexion réseau — `flutter_local_notifications` uniquement
**And** aucun appel APNs/push notification n'est émis à aucun moment

**AC4 — Deep link vers l'écran de résultats**
**When** l'utilisateur tappe la notification
**Then** l'app navigue directement vers l'écran de résultats de l'analyse concernée via go_router
**And** la navigation fonctionne que l'app soit en foreground, background ou lancée depuis la notification

**AC5 — Permission notifications au bon moment**
**Given** c'est la première analyse complétée par le praticien
**When** l'analyse se termine
**Then** la permission iOS de notifications est demandée avec une explication contextuelle (FR37)
**And** si la permission est refusée, l'app continue à fonctionner normalement sans notification

**AC6 — Configuration centralisée dans `core/config/`**
**And** le service de notifications est initialisé dans `core/config/` (conforme à l'architecture — point d'intégration externe wrappé)

---

## Tasks / Subtasks

- [ ] **T1 — Créer `NotificationService` dans `core/config/`** (AC: 1, 2, 3, 5, 6)
  - [ ] T1.1 — Créer `lib/core/config/notification_service.dart` (classe abstraite + implémentation)
  - [ ] T1.2 — Créer `lib/core/config/notification_provider.dart` (provider Riverpod)
  - [ ] T1.3 — Initialiser `FlutterLocalNotificationsPlugin` avec `DarwinInitializationSettings` (iOS uniquement, MVP)
  - [ ] T1.4 — Implémenter `onDidReceiveNotificationResponse` pour router le payload vers go_router
  - [ ] T1.5 — Implémenter `getNotificationAppLaunchDetails` pour gérer le cold-start depuis notification
  - [ ] T1.6 — Créer le handler de background `@pragma('vm:entry-point') void notificationTapBackground(NotificationResponse)`

- [ ] **T2 — Implémenter les méthodes de notification** (AC: 1, 2, 3)
  - [ ] T2.1 — Implémenter `showAnalysisSuccessNotification(String patientName, ArticularAngles angles, String analysisId)`
  - [ ] T2.2 — Implémenter `showAnalysisFailureNotification(String patientName, String analysisId)`
  - [ ] T2.3 — Construire le corps "L'analyse de [patientName] est prête — [knee]°/[hip]°/[ankle]°" (angles formatés à 1 décimale)
  - [ ] T2.4 — Encoder `analysisId` dans le `payload` de la notification (JSON string `{"analysisId": "uuid"}`)
  - [ ] T2.5 — Vérifier que `DarwinNotificationDetails` est utilisé (iOS) — pas de détails Android

- [ ] **T3 — Intégrer `NotificationService` dans `CaptureNotifier`** (AC: 1, 2)
  - [ ] T3.1 — Injecter `notificationServiceProvider` dans `capture_notifier.dart` via `ref.read`
  - [ ] T3.2 — Dans le cas `AnalysisSuccess` : appeler `showAnalysisSuccessNotification` avec angles + patientName
  - [ ] T3.3 — Dans le cas `AnalysisFailure` : appeler `showAnalysisFailureNotification` avec patientName
  - [ ] T3.4 — S'assurer que l'appel notification a lieu APRÈS la persistance Drift (ne pas notifier si la transaction échoue)

- [ ] **T4 — Implémenter la demande de permission contextuelle** (AC: 5)
  - [ ] T4.1 — Ajouter `bool hasRequestedNotificationPermission` dans le stockage local (via `flutter_secure_storage` ou `shared_preferences` selon ce qui est déjà bootstrappé)
  - [ ] T4.2 — Dans `NotificationService`, implémenter `requestPermissionIfFirstAnalysis()`
  - [ ] T4.3 — Appeler cette méthode depuis `CaptureNotifier` au moment de la première complétion d'analyse
  - [ ] T4.4 — Utiliser `flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()?.requestPermissions()` pour iOS

- [ ] **T5 — Configurer le deep link go_router** (AC: 4)
  - [ ] T5.1 — Ajouter la route `/results/:analysisId` dans `core/router/app_router.dart` (si pas encore présente)
  - [ ] T5.2 — Dans `onDidReceiveNotificationResponse` : décoder le payload JSON, extraire `analysisId`, appeler `router.go('/results/$analysisId')`
  - [ ] T5.3 — Dans `getNotificationAppLaunchDetails` (cold-start) : même logique de navigation après initialisation de l'app
  - [ ] T5.4 — S'assurer que la route résultats est protégée par `biometric_guard.dart` (l'auth biométrique précède la navigation)

- [ ] **T6 — Initialisation dans `app.dart`** (AC: 3, 6)
  - [ ] T6.1 — Appeler `notificationService.initialize(router)` dans `app.dart` (dans `ProviderScope` ou via `ref.read` dans un widget `ConsumerStatefulWidget`)
  - [ ] T6.2 — Passer la référence `GoRouter` au service pour permettre la navigation depuis les callbacks

- [ ] **T7 — Tests** (AC: 1, 2, 3, 4)
  - [ ] T7.1 — Créer `lib/core/config/notification_service_test.dart` (co-localisé)
  - [ ] T7.2 — Tester `showAnalysisSuccessNotification` : vérifier le titre, le corps formaté et le payload JSON
  - [ ] T7.3 — Tester `showAnalysisFailureNotification` : vérifier le corps d'échec
  - [ ] T7.4 — Tester le décodage payload → route go_router
  - [ ] T7.5 — Utiliser `mocktail` pour mocker `FlutterLocalNotificationsPlugin`

---

## Dev Notes

### Vue d'ensemble

Cette story implémente FR40 (notification locale "Analyse prête") et FR37 (permission contextuelle pour les notifications). C'est une story autonome qui s'intègre dans le pipeline déjà posé : `CaptureNotifier` → `MlIsolateRunner` → `AnalysisResult` sealed class → **notification locale**.

L'architecture définit que les notifications locales sont configurées dans `core/config/` (point d'intégration externe wrappé). Le service est une dépendance injectée dans `CaptureNotifier` via Riverpod.

**Contrainte critique :** `flutter_local_notifications` UNIQUEMENT. Aucun APNs, aucune notification push, aucune dépendance Firebase/OneSignal/autre SDK cloud. Le projet est 100% offline (NFR-S3, FR29).

### Package : `flutter_local_notifications`

Version dans `pubspec.yaml` (Story 1.1) : `flutter_local_notifications: ^17.2.2`

**Configuration iOS (Darwin) — seule plateforme MVP :**

```dart
// lib/core/config/notification_service.dart

import 'dart:convert';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';

abstract class NotificationService {
  Future<void> initialize(GoRouter router);
  Future<void> showAnalysisSuccessNotification({
    required String patientName,
    required double kneeAngle,
    required double hipAngle,
    required double ankleAngle,
    required String analysisId,
  });
  Future<void> showAnalysisFailureNotification({
    required String patientName,
    required String analysisId,
  });
  Future<void> requestPermissionIfFirstAnalysis();
}

class LocalNotificationService implements NotificationService {
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  GoRouter? _router;

  @override
  Future<void> initialize(GoRouter router) async {
    _router = router;

    const DarwinInitializationSettings darwinSettings =
        DarwinInitializationSettings(
      requestAlertPermission: false, // Demandée contextuellement (AC5)
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const InitializationSettings settings = InitializationSettings(
      iOS: darwinSettings,
    );

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
      onDidReceiveBackgroundNotificationResponse: _onBackgroundNotificationTapped,
    );

    // Gérer le cold-start depuis notification
    final launchDetails = await _plugin.getNotificationAppLaunchDetails();
    if (launchDetails?.didNotificationLaunchApp ?? false) {
      final payload = launchDetails!.notificationResponse?.payload;
      _navigateFromPayload(payload);
    }
  }

  void _onNotificationTapped(NotificationResponse response) {
    _navigateFromPayload(response.payload);
  }

  void _navigateFromPayload(String? payload) {
    if (payload == null) return;
    try {
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final analysisId = data['analysisId'] as String?;
      if (analysisId != null) {
        _router?.go('/results/$analysisId');
      }
    } catch (_) {
      // Payload malformé — ne pas crasher
    }
  }

  @override
  Future<void> showAnalysisSuccessNotification({
    required String patientName,
    required double kneeAngle,
    required double hipAngle,
    required double ankleAngle,
    required String analysisId,
  }) async {
    final knee = kneeAngle.toStringAsFixed(1);
    final hip = hipAngle.toStringAsFixed(1);
    final ankle = ankleAngle.toStringAsFixed(1);

    const DarwinNotificationDetails darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    await _plugin.show(
      analysisId.hashCode, // ID unique dérivé de l'analysisId
      'Analyse prête',
      "L'analyse de $patientName est prête — $knee°/$hip°/$ankle°",
      const NotificationDetails(iOS: darwinDetails),
      payload: jsonEncode({'analysisId': analysisId}),
    );
  }

  @override
  Future<void> showAnalysisFailureNotification({
    required String patientName,
    required String analysisId,
  }) async {
    const DarwinNotificationDetails darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: false,
      presentSound: false,
    );

    await _plugin.show(
      analysisId.hashCode,
      'Analyse échouée',
      "L'analyse de $patientName a échoué — veuillez relancer",
      const NotificationDetails(iOS: darwinDetails),
      payload: jsonEncode({'analysisId': analysisId}),
    );
  }

  @override
  Future<void> requestPermissionIfFirstAnalysis() async {
    await _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
  }
}

// Handler background — OBLIGATOIRE top-level function (pas de closure, pas de méthode d'instance)
@pragma('vm:entry-point')
void _onBackgroundNotificationTapped(NotificationResponse response) {
  // Le routing background ne peut pas se faire ici (pas de BuildContext / GoRouter)
  // La navigation est gérée par getNotificationAppLaunchDetails au prochain démarrage
}
```

### Intégration dans `CaptureNotifier`

Le `CaptureNotifier` connaît déjà l'`AnalysisResult` sealed class. Il faut y ajouter l'appel notification **après** la persistance Drift réussie :

```dart
// lib/features/capture/application/capture_notifier.dart (extrait)

// Dans la méthode de traitement post-isolate :
switch (result) {
  case AnalysisSuccess(:final angles):
    // 1. Persister en Drift (transaction atomique)
    await ref.read(analysisRepositoryProvider).save(analysis);
    // 2. Notifier APRÈS persistance réussie
    await ref.read(notificationServiceProvider).showAnalysisSuccessNotification(
      patientName: patient.name,
      kneeAngle: angles.kneeAngle,
      hipAngle: angles.hipAngle,
      ankleAngle: angles.ankleAngle,
      analysisId: analysis.id,
    );
    // 3. Permission contextuelle à la première analyse
    await ref.read(notificationServiceProvider).requestPermissionIfFirstAnalysis();
    state = AsyncData(CaptureCompleted(result));

  case AnalysisFailure(:final error):
    // Notifier l'échec (aucune persistance — NFR-R2)
    await ref.read(notificationServiceProvider).showAnalysisFailureNotification(
      patientName: patient.name,
      analysisId: pendingAnalysisId,
    );
    state = AsyncData(CaptureFailed(error));
}
```

**Règle critique :** Ne jamais appeler `showAnalysisSuccessNotification` si la transaction Drift a lancé une exception. L'appel notification doit être dans le bloc `try` après `await repository.save(analysis)`.

### Route go_router pour le deep link

La route `/results/:analysisId` doit être déclarée dans `core/router/app_router.dart` :

```dart
// lib/core/router/app_router.dart (extrait)

GoRoute(
  path: '/results/:analysisId',
  builder: (context, state) {
    final analysisId = state.pathParameters['analysisId']!;
    return ResultsScreen(analysisId: analysisId);
  },
),
```

La protection biométrique via `biometric_guard.dart` (redirect) s'applique à cette route automatiquement — aucun code supplémentaire requis dans cette story.

### Passage de `GoRouter` au `NotificationService`

Le `GoRouter` est créé dans `core/router/app_router.dart`. Pour éviter un couplage circulaire, passer la référence via l'initialisation :

```dart
// lib/app.dart (extrait)
class BodyOrthoxApp extends ConsumerStatefulWidget { ... }

class _BodyOrthoxAppState extends ConsumerState<BodyOrthoxApp> {
  @override
  void initState() {
    super.initState();
    // Initialiser après le premier frame pour que le router soit disponible
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final router = ref.read(appRouterProvider);
      ref.read(notificationServiceProvider).initialize(router);
    });
  }
}
```

### Provider Riverpod

```dart
// lib/core/config/notification_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return LocalNotificationService();
});
```

Déclaré dans `core/config/` — conforme à la règle : providers globaux uniquement dans `core/`.

### Format du texte de notification

Le texte suit exactement la spec de l'AC1 et de la Story 6.3 dans epics.md :

```
Titre : "Analyse prête"
Corps : "L'analyse de [Nom Patient] est prête — [knee]°/[hip]°/[ankle]°"
```

Les angles sont affichés à **1 décimale** (conformément à la convention architecturale `kneeAngle.toStringAsFixed(1)`).

Exemples concrets :

- `"L'analyse de Martin est prête — 23.0°/67.0°/41.0°"` (angles entiers → 1 décimale)
- `"L'analyse de Fatima est prête — 22.8°/65.3°/39.7°"` (angles décimaux)

### Project Structure Notes

**Fichiers à créer dans cette story :**

```
lib/
└── core/
    └── config/
        ├── notification_service.dart          ← Nouveau (abstract + impl)
        ├── notification_service_test.dart     ← Nouveau (co-localisé)
        └── notification_provider.dart         ← Nouveau
```

**Fichiers à modifier dans cette story :**

```
lib/
├── app.dart                                   ← Modifier : initialisation NotificationService
├── core/
│   └── router/
│       └── app_router.dart                    ← Modifier : ajouter route /results/:analysisId
└── features/
    └── capture/
        └── application/
            └── capture_notifier.dart          ← Modifier : appels notification post-analyse
```

**Fichier explicitement NON modifié :**

- `core/config/app_config.dart` — pas de flag notification (les notifs sont actives sur les deux flavors dev et prod)
- `features/onboarding/` — la permission est déjà gérée via `requestPermissionIfFirstAnalysis()` dans le `CaptureNotifier`, pas dans l'onboarding (Story 6.1 ne couvre pas cette permission — confirmé par AC de Story 6.1)

### Dépendances entre stories

Cette story dépend de :

- **Story 1.1** — `flutter_local_notifications` déjà déclaré dans `pubspec.yaml`
- **Story 3.3** — `CaptureNotifier`, `AnalysisResult` sealed class, `MlIsolateRunner` déjà implémentés
- **Story 1.2** — `biometric_guard.dart` déjà en place pour protéger la route résultats

Cette story ne bloque aucune autre story.

### Règles architecturales OBLIGATOIRES

1. **Structure feature** : `NotificationService` est dans `core/config/` (pas dans une feature) — c'est un cross-cutting concern
2. **Nommage** : `notification_service.dart` (snake_case), `LocalNotificationService` (PascalCase), `notificationServiceProvider` (camelCase + Provider)
3. **Provider déclaration** : dans `notification_provider.dart` — jamais inline
4. **Provider scope** : `Provider<NotificationService>` dans `core/` car c'est un service global
5. **Tests co-localisés** : `notification_service_test.dart` dans `core/config/`
6. **Zéro APNs** : `DarwinInitializationSettings` ne doit pas activer `requestAlertPermission: true` à l'initialisation (demande différée via `requestPermissionIfFirstAnalysis`)
7. **Payload JSON** : toujours `jsonEncode({'analysisId': id})` — jamais de payload string brut non parseable

### Anti-patterns à éviter

```dart
// ❌ INTERDIT — APNs / push notifications
FirebaseMessaging.instance.getToken()
OneSignal.shared.setAppId(...)

// ❌ INTERDIT — Permission à l'initialisation (doit être contextuelle - FR37)
DarwinInitializationSettings(requestAlertPermission: true)  // ← NE PAS faire

// ❌ INTERDIT — Navigation dans le background handler (pas de contexte disponible)
@pragma('vm:entry-point')
void _onBackgroundNotificationTapped(NotificationResponse response) {
  router.go('/results/${...}');  // ← CRASH — GoRouter pas disponible en background isolate
}

// ❌ INTERDIT — Notification si la transaction Drift a échoué
try {
  await repository.save(analysis); // exception lancée ici
} catch (e) {
  await notificationService.showAnalysisSuccessNotification(...); // ← NE PAS faire
}

// ❌ INTERDIT — Provider DAO direct depuis CaptureNotifier
ref.read(driftDbProvider).analysisDao.save(analysis)  // Toujours via Repository

// ❌ INTERDIT — Texte de notification inline différent du format spec
'Analyse terminée pour ${patient.name}'  // ← Ne pas inventer le texte
// ✅ CORRECT — Texte conforme à la spec
"L'analyse de $patientName est prête — $knee°/$hip°/$ankle°"
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-6.3] — User story, Acceptance Criteria, FR40, FR37
- [Source: docs/planning-artifacts/epics.md#FR14] — "notification locale fin d'analyse" (défini en Epic 3, story 3.3 — cette story 6.3 est la couche notification dédiée)
- [Source: docs/planning-artifacts/architecture.md#Points-d'intégration-externe] — `flutter_local_notifications` configuré dans `core/config/`
- [Source: docs/planning-artifacts/architecture.md#Authentification-Sécurité] — 100% offline, zéro requête réseau
- [Source: docs/planning-artifacts/architecture.md#Architecture-Frontend] — go_router deep link vers analyse, `AsyncNotifier` pour CaptureNotifier
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes, camelCase providers
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Tests co-localisés, structure `core/`
- [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping] — Provider global dans `core/` uniquement
- [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs] — `AnalysisResult` sealed class, switch exhaustif
- [Source: flutter_local_notifications docs — Context7] — `onDidReceiveNotificationResponse`, `getNotificationAppLaunchDetails`, `DarwinInitializationSettings`, `@pragma('vm:entry-point')`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_À remplir par l'agent de développement pendant l'implémentation._

### Completion Notes List

_À remplir par l'agent de développement à la fin de l'implémentation._

### File List

_L'agent de développement doit lister ici tous les fichiers créés ou modifiés._

Fichiers attendus :

- `bodyorthox/lib/core/config/notification_service.dart` — created
- `bodyorthox/lib/core/config/notification_service_test.dart` — created
- `bodyorthox/lib/core/config/notification_provider.dart` — created
- `bodyorthox/lib/app.dart` — modified (initialisation NotificationService)
- `bodyorthox/lib/core/router/app_router.dart` — modified (route /results/:analysisId)
- `bodyorthox/lib/features/capture/application/capture_notifier.dart` — modified (appels notification)
