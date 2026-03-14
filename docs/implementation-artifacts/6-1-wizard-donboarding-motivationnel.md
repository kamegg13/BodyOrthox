# Story 6.1 : Wizard d'Onboarding Motivationnel

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que praticien ouvrant BodyOrthox pour la première fois,
Je veux voir le résultat final avant toute instruction, et accorder les permissions au bon moment,
Afin de comprendre la valeur immédiatement et me sentir confiant pour lancer ma première analyse.

## Acceptance Criteria

**AC1 — Déclenchement unique, jamais revu**

- **Given** c'est le premier lancement de l'app (flag `onboarding_completed` absent de `SharedPreferences`)
- **When** l'app démarre après l'authentification biométrique
- **Then** le wizard d'onboarding s'affiche avant le dashboard principal
- **And** l'`OnboardingNotifier` positionne le flag `onboarding_completed = true` en `SharedPreferences` à la complétion
- **And** lors de tout lancement ultérieur, le flag est détecté et le dashboard s'affiche directement — l'onboarding n'est jamais revu

**AC2 — 3 écrans dans l'ordre : résultat → flux capture → confidentialité RGPD**

- **Given** l'onboarding est affiché
- **When** le praticien parcourt les écrans
- **Then** exactement 3 pages sont présentées dans cet ordre strict :
  1. **Écran 1 — Résultat** : affiche un exemple de rapport d'analyse réelle (angles articulaires genou/hanche/cheville avec indicateurs visuels, ArticularAngleCards) — PAS une liste de fonctionnalités
  2. **Écran 2 — Flux capture** : illustration de la position de profil strict + guidage caméra avec la demande de permission caméra contextuelle
  3. **Écran 3 — Confidentialité RGPD** : texte de réassurance offline-first, chiffrement local

**AC3 — Résultat d'abord (PAS liste de features)**

- **Given** l'écran 1 est affiché
- **Then** le contenu montre un exemple concret d'`ArticularAngleCard` avec valeurs fictives réalistes (ex. : Genou 42.3°, Hanche 67.1°, Cheville 18.5°) et leurs indicateurs visuels (dans/hors norme)
- **And** aucune liste à puces de fonctionnalités n'est affichée sur cet écran
- **And** le libellé du CTA est "Voir comment c'est capturé →" pour transitionner à l'écran 2

**AC4 — Permission caméra au moment contextuel (écran 2)**

- **Given** le praticien arrive à l'écran 2 ("flux capture")
- **When** l'écran est affiché
- **Then** la permission caméra iOS est sollicitée via `permission_handler` avec explication contextuelle visible : _"BodyOrthox utilise la caméra uniquement pour filmer la marche de votre patient. La vidéo n'est jamais stockée ni transmise."_
- **And** si la permission est accordée, le CTA "Continuer" devient actif
- **And** si la permission est refusée, un message guide vers les réglages iOS avec un CTA "Ouvrir les Réglages"

**AC5 — Permission notifications différée après la 1ère analyse complète**

- **Given** l'onboarding est terminé et le praticien n'a pas encore réalisé d'analyse
- **Then** la permission notifications n'est PAS demandée pendant l'onboarding
- **When** la première analyse ML est complétée avec succès (événement `AnalysisSuccess`)
- **Then** la permission notifications est demandée avec explication : _"Recevez une notification quand l'analyse est prête, pour continuer votre consultation pendant le traitement."_

**AC6 — Navigation fluide et indicateur de progression**

- **Given** l'onboarding est affiché
- **Then** un indicateur de progression (3 dots/points) est visible en permanence
- **And** swipe horizontal ou bouton "Suivant" permettent de naviguer
- **And** un bouton "Passer" (skip) en haut à droite permet de sauter directement au dashboard (le flag est quand même positionné à `true`)
- **And** les transitions utilisent une animation slide horizontale 300ms (Impeller)

## Tasks / Subtasks

- [ ] **Task 1 — Persistance du flag d'onboarding** (AC: #1)
  - [ ] Ajouter la dépendance `shared_preferences` dans `pubspec.yaml`
  - [ ] Créer `features/onboarding/data/onboarding_preferences.dart` — wrapper `SharedPreferences` avec clé `onboarding_completed`
  - [ ] Créer `features/onboarding/data/onboarding_preferences_test.dart`

- [ ] **Task 2 — OnboardingNotifier** (AC: #1, #4, #5)
  - [ ] Créer `features/onboarding/application/onboarding_notifier.dart` — `AsyncNotifier<OnboardingState>` gérant :
    - Lecture du flag au démarrage
    - Page courante (index 0, 1, 2)
    - Statut permission caméra
    - `completeOnboarding()` → écrit le flag et navigue vers `/patients`
    - `skipOnboarding()` → écrit le flag et navigue vers `/patients`
  - [ ] Créer `features/onboarding/application/onboarding_provider.dart`
  - [ ] Créer `features/onboarding/application/onboarding_notifier_test.dart`

- [ ] **Task 3 — Domaine OnboardingState** (AC: #1)
  - [ ] Créer `features/onboarding/domain/onboarding_state.dart` — sealed class :
    ```dart
    sealed class OnboardingState { const OnboardingState(); }
    final class OnboardingNotCompleted extends OnboardingState {
      final int currentPage;
      final bool cameraPermissionGranted;
      const OnboardingNotCompleted({this.currentPage = 0, this.cameraPermissionGranted = false});
    }
    final class OnboardingCompleted extends OnboardingState { const OnboardingCompleted(); }
    ```

- [ ] **Task 4 — Intégration go_router : redirect conditionnel** (AC: #1)
  - [ ] Dans `core/router/app_router.dart`, ajouter redirect sur `/` :
    - Si `onboarding_completed` = false → redirect vers `/onboarding`
    - Si `onboarding_completed` = true → redirect vers `/patients` (après auth biométrique)
  - [ ] Déclarer la route `/onboarding` pointant vers `OnboardingScreen`

- [ ] **Task 5 — OnboardingScreen et structure des pages** (AC: #2, #6)
  - [ ] Créer `features/onboarding/presentation/onboarding_screen.dart` — `PageView` avec `PageController`
  - [ ] Bouton "Passer" en haut à droite (appelle `skipOnboarding()`)
  - [ ] Indicateur de progression 3 dots en bas
  - [ ] Navigation Next / swipe

- [ ] **Task 6 — Page 1 : Résultat (OnboardingPageResult)** (AC: #3)
  - [ ] Créer `features/onboarding/presentation/widgets/onboarding_page_result.dart`
  - [ ] Afficher 3 `ArticularAngleCard` avec données fictives réalistes :
    - Genou : 42.3° (indicateur "dans la norme", couleur `#34C759`)
    - Hanche : 67.1° (indicateur "légèrement hors norme", couleur `#FF9500`)
    - Cheville : 18.5° (indicateur "dans la norme", couleur `#34C759`)
  - [ ] Titre : "Vos résultats en 30 secondes"
  - [ ] Sous-titre : "Angles articulaires mesurés automatiquement, sans matériel supplémentaire."
  - [ ] CTA : "Voir comment capturer →"
  - [ ] Réutiliser le widget `ArticularAngleCard` de `features/results/presentation/widgets/articular_angle_card.dart`

- [ ] **Task 7 — Page 2 : Flux capture + permission caméra (OnboardingPageCapture)** (AC: #2, #4)
  - [ ] Créer `features/onboarding/presentation/widgets/onboarding_page_capture.dart`
  - [ ] Illustration de la position de profil strict (asset SVG ou image)
  - [ ] Texte d'explication contextuelle permission caméra
  - [ ] Bouton "Autoriser la caméra" → déclenche `permission_handler` request
  - [ ] Gestion état : accordée (CTA "Continuer" actif) / refusée (CTA "Ouvrir les Réglages")
  - [ ] Ajouter `permission_handler` dans `pubspec.yaml` si absent

- [ ] **Task 8 — Page 3 : Confidentialité RGPD (OnboardingPagePrivacy)** (AC: #2)
  - [ ] Créer `features/onboarding/presentation/widgets/onboarding_page_privacy.dart`
  - [ ] Icône cadenas + icône "no cloud"
  - [ ] Titre : "Vos données ne quittent jamais cet appareil"
  - [ ] Corps : "Toutes les analyses sont effectuées localement. Aucune vidéo, aucune donnée patient n'est transmise sur un serveur. Jamais."
  - [ ] CTA : "Commencer" → appelle `completeOnboarding()`

- [ ] **Task 9 — Déclenchement permission notifications post-1ère analyse** (AC: #5)
  - [ ] Dans `features/capture/application/capture_notifier.dart`, après confirmation `AnalysisSuccess` persisté :
    - Vérifier si c'est la première analyse complète (compteur Drift = 1)
    - Si oui : déclencher `NotificationPermissionService.requestIfNeeded()` depuis `core/config/`
  - [ ] Créer `core/config/notification_permission_service.dart` avec `requestIfNeeded()` utilisant `permission_handler`

- [ ] **Task 10 — Tests de l'`OnboardingNotifier`** (AC: #1, #4, #5)
  - [ ] Test : flag absent → `OnboardingNotCompleted` renvoyé
  - [ ] Test : flag présent → `OnboardingCompleted` renvoyé (redirect déclenché)
  - [ ] Test : `completeOnboarding()` → flag écrit en `SharedPreferences`
  - [ ] Test : `skipOnboarding()` → flag écrit en `SharedPreferences`
  - [ ] Test : page 2 affichée → permission caméra sollicitée

## Dev Notes

### Architecture et localisation

La feature `onboarding` est entièrement contenue dans `features/onboarding/` selon la structure Feature-First obligatoire :

```
features/onboarding/
  data/
    onboarding_preferences.dart          # Wrapper SharedPreferences
    onboarding_preferences_test.dart
  domain/
    onboarding_state.dart                # Sealed class OnboardingState
  application/
    onboarding_notifier.dart             # AsyncNotifier<OnboardingState>
    onboarding_provider.dart
    onboarding_notifier_test.dart
  presentation/
    onboarding_screen.dart               # PageView + PageController
    widgets/
      onboarding_page_result.dart        # Écran 1 — résultat
      onboarding_page_capture.dart       # Écran 2 — flux + permission caméra
      onboarding_page_privacy.dart       # Écran 3 — RGPD
```

### Persistance du flag — SharedPreferences (et non Drift)

Le flag `onboarding_completed` est stocké en `SharedPreferences` (pas dans la base Drift chiffrée) car :

1. Il doit être lisible avant l'ouverture de la connexion SQLCipher (qui nécessite la clé Keychain, donc l'auth biométrique)
2. Ce n'est pas une donnée patient — pas de contrainte RGPD
3. `shared_preferences` est lisible au cold start sans dépendances bloquantes

Clé : `'onboarding_completed'` (bool). Ne jamais utiliser d'autre clé.

### OnboardingNotifier — Pattern obligatoire

```dart
// features/onboarding/application/onboarding_notifier.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'onboarding_notifier.g.dart';

@riverpod
class OnboardingNotifier extends _$OnboardingNotifier {
  @override
  Future<OnboardingState> build() async {
    final prefs = await SharedPreferences.getInstance();
    final completed = prefs.getBool('onboarding_completed') ?? false;
    if (completed) return const OnboardingCompleted();
    return const OnboardingNotCompleted(currentPage: 0, cameraPermissionGranted: false);
  }

  Future<void> completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_completed', true);
    state = const AsyncData(OnboardingCompleted());
    // La navigation vers /patients est gérée par le redirect go_router qui écoute ce notifier
  }

  Future<void> skipOnboarding() async => completeOnboarding(); // même comportement

  void goToPage(int page) {
    final current = state.valueOrNull;
    if (current is OnboardingNotCompleted) {
      state = AsyncData(OnboardingNotCompleted(
        currentPage: page,
        cameraPermissionGranted: current.cameraPermissionGranted,
      ));
    }
  }

  void setCameraPermissionGranted(bool granted) {
    final current = state.valueOrNull;
    if (current is OnboardingNotCompleted) {
      state = AsyncData(OnboardingNotCompleted(
        currentPage: current.currentPage,
        cameraPermissionGranted: granted,
      ));
    }
  }
}
```

### Intégration go_router — redirect conditionnel

```dart
// Ajout dans core/router/app_router.dart
// Le redirect doit s'évaluer APRÈS l'auth biométrique (biometric_guard.dart déjà en place)

redirect: (context, state) {
  final onboardingState = ref.read(onboardingNotifierProvider).valueOrNull;

  // Biométrie non validée → géré par biometric_guard.dart (déjà existant)

  // Onboarding non complété → forcer /onboarding
  if (onboardingState is OnboardingNotCompleted && state.uri.path != '/onboarding') {
    return '/onboarding';
  }

  // Onboarding complété → ne pas revenir sur /onboarding
  if (onboardingState is OnboardingCompleted && state.uri.path == '/onboarding') {
    return '/patients';
  }

  return null; // pas de redirect
},
```

**IMPORTANT :** Ne pas confondre avec `biometric_guard.dart`. Les deux redirects coexistent :

- `biometric_guard.dart` → vérifie l'auth biométrique (existant, Story 1.2)
- redirect onboarding → vérifie `onboarding_completed` (nouvelle Story 6.1)

### Permission caméra — pattern obligatoire (écran 2)

```dart
// features/onboarding/presentation/widgets/onboarding_page_capture.dart

Future<void> _requestCameraPermission(WidgetRef ref) async {
  final status = await Permission.camera.request();
  ref
    .read(onboardingNotifierProvider.notifier)
    .setCameraPermissionGranted(status.isGranted);
  if (status.isPermanentlyDenied) {
    await openAppSettings(); // permission_handler
  }
}
```

**Ne jamais** demander la permission caméra dans `main_dev.dart`, `app.dart` ou au lancement de l'app. Uniquement au moment de l'affichage de l'écran 2 de l'onboarding, et lors de l'écran de capture réel (Story 3.2).

### Permission notifications — déclenchement post-1ère analyse

La permission notifications n'est **JAMAIS** demandée pendant l'onboarding. Elle est demandée dans `capture_notifier.dart` après la première analyse complète :

```dart
// features/capture/application/capture_notifier.dart
// Après persistance réussie d'une AnalysisSuccess :
final analysisCount = await ref.read(analysisRepositoryProvider).countAll();
if (analysisCount == 1) {
  // Première analyse — demander permission notifications
  await ref.read(notificationPermissionServiceProvider).requestIfNeeded();
}
```

```dart
// core/config/notification_permission_service.dart
class NotificationPermissionService {
  Future<void> requestIfNeeded() async {
    final status = await Permission.notification.status;
    if (status.isDenied) {
      await Permission.notification.request();
    }
  }
}
```

### Widget ArticularAngleCard — réutilisation depuis results

**Ne pas recréer** le widget `ArticularAngleCard`. Le réutiliser directement :

```dart
// Import dans onboarding_page_result.dart
import 'package:bodyorthox/features/results/presentation/widgets/articular_angle_card.dart';

// Données fictives pour la démo onboarding
const demoAngles = [
  ArticularAngleDemo(joint: 'Genou', value: 42.3, isInNorm: true),
  ArticularAngleDemo(joint: 'Hanche', value: 67.1, isInNorm: false),
  ArticularAngleDemo(joint: 'Cheville', value: 18.5, isInNorm: true),
];
```

Si `ArticularAngleCard` n'accepte pas de données fictives directement, créer un `ArticularAngleDemoCard` dans `features/onboarding/presentation/widgets/` qui duplique uniquement le rendu visuel (sans logique métier).

### Design system — contraintes obligatoires

| Élément                        | Valeur                | Source                     |
| ------------------------------ | --------------------- | -------------------------- |
| Couleur primaire               | `#1B6FBF`             | `AppColors.primary`        |
| Couleur succès (dans la norme) | `#34C759`             | `AppColors.success`        |
| Couleur warning (hors norme)   | `#FF9500`             | `AppColors.warning`        |
| Fond                           | `#FFFFFF`             | `AppColors.surface`        |
| Texte                          | `#1C1C1E`             | `AppColors.text`           |
| Espacement base                | 8pt                   | `AppSpacing.base`          |
| Marges écran                   | 16pt                  | `AppSpacing.screenMargin`  |
| Touch targets                  | min 44×44pt           | Apple HIG + WCAG           |
| Durée animation transition     | 300ms                 | Impeller, slide horizontal |
| Typographie                    | SF Pro Display / Text | `AppTypography`            |

Bouton "Passer" : text button (pas de fond), couleur `AppColors.primary`, positioned `Align(alignment: Alignment.topRight)` dans le Stack de l'`OnboardingScreen`.

### AsyncValue — switch exhaustif obligatoire

```dart
// ✅ CORRECT dans OnboardingScreen
switch (onboardingState) {
  case AsyncData(:final value) => _buildPageView(value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error.toString()),
}

// ❌ INTERDIT
onboardingState.when(data: ..., loading: ..., error: ...);
```

### Points de vigilance critiques

1. **Ordre des redirects go_router** : le redirect biométrique (`biometric_guard.dart`) doit s'évaluer avant le redirect onboarding. Vérifier l'ordre des guards dans `app_router.dart`.

2. **SharedPreferences vs Drift** : le flag onboarding est en `SharedPreferences`, pas en Drift. Ne pas mélanger les deux storages pour cette donnée.

3. **Pas de re-rendering de PageView** : utiliser `AutomaticKeepAliveClientMixin` sur chaque page pour éviter le rebuild lors du swipe.

4. **`build_runner` requis** : après création de `onboarding_notifier.dart` (annotée `@riverpod`), exécuter :

   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

   Cela génère `onboarding_notifier.g.dart`. Ne jamais éditer le fichier `.g.dart` manuellement.

5. **Permission caméra sur simulateur** : le simulateur iOS ne supporte pas la caméra réelle. En flavor dev, la permission peut être mockée. Tester la permission sur device physique uniquement.

6. **Données fictives de l'écran 1** : les valeurs 42.3°/67.1°/18.5° sont hardcodées dans `onboarding_page_result.dart`. Ce ne sont PAS des données persistées. Nommer les constantes clairement : `_demoKneeAngle`, `_demoHipAngle`, `_demoAnkleAngle`.

### Structure projet — notes

```
lib/features/onboarding/               ← Feature complète ici
lib/core/config/notification_permission_service.dart  ← Nouveau fichier cross-cutting
lib/core/router/app_router.dart        ← Modifier pour ajouter redirect onboarding
```

**Fichiers à NE PAS toucher dans cette story :**

- `core/auth/biometric_guard.dart` — déjà en place (Story 1.2), ne pas modifier la logique biométrique
- `features/capture/domain/` — les sealed classes AnalysisResult/AnalysisError sont définies en Story 3.3
- `features/results/presentation/widgets/articular_angle_card.dart` — réutiliser sans modifier

### Dépendances pubspec.yaml à vérifier / ajouter

```yaml
dependencies:
  shared_preferences: ^2.3.0 # Flag onboarding_completed
  permission_handler: ^11.0.0 # Permission caméra (écran 2) + notifications (post-1ère analyse)
```

Ces packages doivent être ajoutés si absents. Vérifier d'abord dans `pubspec.yaml` existant.

### Project Structure Notes

- Alignement avec la structure Feature-First définie dans `architecture.md` : `features/onboarding/data/domain/application/presentation`
- Le `OnboardingNotifier` est un `AsyncNotifier` (pas `StateNotifier` ni `ChangeNotifier` — interdits)
- Les providers sont déclarés dans `onboarding_provider.dart` uniquement
- Co-location des tests avec les fichiers source (pas de dossier `test/` miroir séparé)
- La route `/onboarding` est déclarée dans `core/router/app_router.dart` avec `go_router_builder`

### Mockup de référence

> Écrans Stitch générés le 08/03/2026 — pivot HKA. Utiliser comme référence visuelle pour l'implémentation.

| Écran                                                                       | Screenshot                                                                            | HTML interactif                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Onboarding 1/3 — Démo analyse HKA (position anatomique frontale, axe H-K-A) | `docs/planning-artifacts/stitch-mockups/screenshots/10-onboarding-1-3-hka.png`        | `docs/planning-artifacts/stitch-mockups/html/10-onboarding-1-3-hka.html`        |
| Onboarding 3/3 — Export sécurisé (`AnalyseHKA`)                             | `docs/planning-artifacts/stitch-mockups/screenshots/11-onboarding-3-3-export-hka.png` | `docs/planning-artifacts/stitch-mockups/html/11-onboarding-3-3-export-hka.html` |

### References

- Epics & Stories : [Source: docs/planning-artifacts/epics.md#Story-6.1]
- FR36 (wizard 3 écrans, résultat d'abord), FR37 (permissions contextuelles) : [Source: docs/planning-artifacts/epics.md#FR36-FR37]
- Architecture Feature-First, Riverpod AsyncNotifier, go_router redirect : [Source: docs/planning-artifacts/architecture.md#Architecture-Frontend]
- Patterns de nommage snake_case/PascalCase, co-location tests : [Source: docs/planning-artifacts/architecture.md#Patterns-d-implementation]
- Design system palette, espacement, touch targets : [Source: docs/planning-artifacts/architecture.md#De-la-specification-UX]
- Principe "résultat avant instructions", émotion cible premier lancement : [Source: docs/planning-artifacts/ux-design-specification.md#Experience-Principles]
- Journey 1 — wizard motivationnel 3 écrans : [Source: docs/planning-artifacts/ux-design-specification.md#Journey-1]
- Règle 8 agents — Repository uniquement pour accès données : [Source: docs/planning-artifacts/architecture.md#Regles-d-application]
- AsyncValue switch exhaustif obligatoire : [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
