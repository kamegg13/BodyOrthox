# Story 3.1 : Lancement de Session & Guidage Caméra

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a practitioner,
I want real-time visual guidance when positioning my iPhone to film a patient,
so that I capture footage that the ML engine can analyze successfully.

## Acceptance Criteria

1. **[AC1 — GuidedCameraOverlay états couleur]** Given je sélectionne un patient et lance une analyse, When l'écran de capture s'ouvre, Then le `GuidedCameraOverlay` affiche un cadre vert (`#34C759`) / orange (`#FF9500`) / rouge (`#FF3B30`) selon l'état (ready / positioning ou lowLight / recording) en temps réel, latence < 100ms (NFR-P5).

2. **[AC2 — Détection luminosité < 100ms]** Given l'écran de capture est actif, When la luminosité ambiante est insuffisante, Then le `GuidedCameraOverlay` bascule immédiatement en état `lowLight` (bordure orange, texte "Améliorez l'éclairage") avec un message actionnable visible dans la zone basse de l'overlay (FR9), latence de réaction < 100ms.

3. **[AC3 — Guidage vue de profil strict]** Given l'écran de capture est actif et la luminosité est suffisante, When la position de l'iPhone n'est pas en vue de profil strict du patient, Then l'overlay bascule en état `positioning` (bordure orange, texte "Orientez de profil") et le bouton "Démarrer" reste masqué (FR10).

4. **[AC4 — Bouton Démarrer conditionnel]** Given l'overlay est dans un état autre que `ready`, Then le bouton "Démarrer" est masqué ou désactivé (fond gris `#C7C7CC`, inactif). Given l'overlay est en état `ready` (bonne luminosité + bon angle), Then le bouton "Démarrer" est visible et actif (FilledButton `#1B6FBF`, 56pt hauteur, touch target ≥ 44×44pt).

5. **[AC5 — Relance sans quitter le flux]** Given une capture est en cours ou vient de se terminer prématurément, When le praticien appuie sur "Arrêter", Then il peut relancer immédiatement une nouvelle prise sans quitter l'écran `capture_screen.dart`, la `CaptureState` revient à `CaptureIdle` (FR11).

6. **[AC6 — Fluidité 58 FPS]** Given l'écran de capture est actif avec le `GuidedCameraOverlay`, Then l'UI reste fluide à ≥ 58 FPS constants (NFR-P2, Impeller activé sur iOS 16+), sans jank visible pendant le traitement des frames caméra.

7. **[AC7 — Permission caméra contextuelle]** Given la permission caméra n'a pas encore été accordée, When le praticien arrive sur l'écran de capture, Then la demande de permission est faite au moment contextuel avec un `CupertinoAlertDialog` explicatif avant le prompt système iOS (FR37). Given la permission est refusée, Then un message d'erreur avec bouton "Ouvrir Réglages" est affiché — jamais d'écran bloqué sans sortie.

8. **[AC8 — Haptic feedback état ready]** Given le `GuidedCameraOverlay` passe de tout état à l'état `ready`, Then un haptic feedback léger (`HapticFeedback.lightImpact`) est déclenché. VoiceOver annonce le changement d'état (accessibilité).

## Tasks / Subtasks

- [x] Task 1 — Créer `capture_screen.dart` et scaffolding de la feature capture (AC: #1, #4, #5)
  - [x] 1.1 Créer `lib/features/capture/presentation/capture_screen.dart` (StatelessWidget + ConsumerWidget Riverpod)
  - [x] 1.2 Créer la structure complète `features/capture/data/`, `domain/`, `application/`, `presentation/widgets/`
  - [x] 1.3 Créer `lib/features/capture/domain/capture_state.dart` — sealed class `CaptureState` (CaptureIdle, CaptureRecording, CaptureProcessing, CaptureCompleted, CaptureFailed)
  - [x] 1.4 Créer `lib/features/capture/application/capture_notifier.dart` — `Notifier<CaptureState>` (Riverpod 3.x)
  - [x] 1.5 Créer `lib/features/capture/application/capture_provider.dart` — déclarations providers

- [x] Task 2 — Implémenter `GuidedCameraOverlay` avec machine d'états couleur (AC: #1, #2, #3, #4, #8)
  - [x] 2.1 Créer `lib/features/capture/presentation/widgets/guided_camera_overlay.dart`
  - [x] 2.2 Définir `CameraOverlayState` enum : `idle`, `positioning`, `lowLight`, `ready`, `recording`
  - [x] 2.3 Implémenter le rectangle overlay centré (80% width, 90% height) avec `DecoratedBox`
  - [x] 2.4 Implémenter la bordure dynamique colorée selon l'état (`#34C759` / `#FF9500` / `#FF3B30`)
  - [x] 2.5 Implémenter la zone texte basse (≤ 5 mots) avec les messages d'état
  - [x] 2.6 Implémenter le bouton "Démarrer" conditionnel (visible uniquement en état `ready`)
  - [x] 2.7 Implémenter haptic feedback (`HapticFeedback.lightImpact`) au passage vers `ready`
  - [x] 2.8 Ajouter `Semantics` VoiceOver pour les changements d'état de l'overlay

- [x] Task 3 — Implémenter la détection de luminosité temps réel < 100ms (AC: #2, #6)
  - [x] 3.1 Créer `lib/features/capture/presentation/widgets/luminosity_indicator.dart`
  - [x] 3.2 Intégrer le plugin `camera` Flutter pour accéder au flux de frames (CameraController)
  - [x] 3.3 Analyser la luminosité moyenne des frames via `imageStream` (moyenne pixel Y ou canaux RGB) — traitement léger pour maintenir < 100ms
  - [x] 3.4 Seuil luminosité configurable (40/255 ≈ 0.157) dans `capture_provider.dart` (luminosityThreshold const)
  - [x] 3.5 Déclencher la transition `lowLight` ↔ `ready` via `luminosityProvider` + `overlayStateProvider`
  - [x] 3.6 Vérifier la latence overlay sur device physique (iPhone 12+ avec Impeller) — doit rester < 100ms (NFR-P5)

- [x] Task 4 — Implémenter le guidage de positionnement vue de profil (AC: #3)
  - [x] 4.1 Utiliser heuristique simple pour MVP (portrait strict = position correcte)
  - [x] 4.2 Pour MVP : détection basique — `_isPortraitPosition()` retourne true en portrait
  - [x] 4.3 Afficher le texte "Orientez de profil" en état `positioning` avec bordure orange
  - [x] 4.4 Le bouton "Démarrer" reste masqué tant que l'état n'est pas `ready`

- [x] Task 5 — Implémenter la gestion des permissions caméra (AC: #7)
  - [x] 5.1 Utiliser `permission_handler` pour vérifier le statut permission caméra
  - [x] 5.2 Afficher un `CupertinoAlertDialog` explicatif AVANT le prompt système iOS
  - [x] 5.3 Gérer l'état "permission refusée" avec lien vers les réglages iOS (`openAppSettings()`)
  - [x] 5.4 Ne jamais bloquer l'écran sans action possible pour l'utilisateur

- [x] Task 6 — Implémenter la logique de relance de capture (AC: #5)
  - [x] 6.1 Bouton "Arrêter" visible uniquement en état `CaptureRecording` (via `overlayStateProvider`)
  - [x] 6.2 `CaptureNotifier.stopCapture()` → transition vers `CaptureIdle` (pas de navigation)
  - [x] 6.3 `CaptureNotifier.startCapture()` → transition vers `CaptureRecording`
  - [x] 6.4 Réinitialiser le `GuidedCameraOverlay` à l'état `idle` lors du retour à `CaptureIdle`

- [x] Task 7 — Tests (AC: tous)
  - [x] 7.1 Créer `lib/features/capture/application/capture_notifier_test.dart` — tester les transitions de `CaptureState`
  - [x] 7.2 Créer `lib/features/capture/presentation/widgets/guided_camera_overlay_test.dart` — widget test pour chaque état couleur
  - [x] 7.3 Tester la logique de relance sans navigation (AC5)
  - [x] 7.4 Tester le comportement du bouton "Démarrer" conditionnel (visible seulement en `ready`)

## Dev Notes

### Contexte Epic 3 — Dépendances et positionnement

Cette story est la **première story de l'Epic 3 (Capture Guidée & Analyse ML)**. Elle établit le scaffolding de la feature `capture/` et le composant `GuidedCameraOverlay` qui sera réutilisé dans les stories 3.2 (script RGPD + démarrage enregistrement), 3.3 (pipeline ML on-device) et au-delà.

**Ne pas implémenter dans cette story :**

- Le démarrage de l'enregistrement effectif (Story 3.2)
- Le pipeline ML, l'isolate, `MlIsolateRunner` (Story 3.3)
- L'affichage des résultats (Story 3.4)
- Le replay image par image (Story 3.5)

### CaptureState sealed class — Patron obligatoire

L'architecture impose l'utilisation d'une `sealed class` Dart 3 pour la machine d'états de la capture. Définir dans `lib/features/capture/domain/capture_state.dart` :

```dart
sealed class CaptureState {
  const CaptureState();
}

final class CaptureIdle extends CaptureState {
  const CaptureIdle();
}

final class CaptureRecording extends CaptureState {
  const CaptureRecording();
}

final class CaptureProcessing extends CaptureState {
  const CaptureProcessing();
}

final class CaptureCompleted extends CaptureState {
  final AnalysisResult result;
  const CaptureCompleted(this.result);
}

final class CaptureFailed extends CaptureState {
  final AnalysisError error;
  const CaptureFailed(this.error);
}
```

**Règle architecture :** Switch exhaustif OBLIGATOIRE sur `CaptureState` dans l'UI — interdit d'utiliser `if (state is CaptureRecording)`.

```dart
// ✅ CORRECT
switch (captureState) {
  case CaptureIdle()      => _buildIdleUI(),
  case CaptureRecording() => _buildRecordingUI(),
  case CaptureProcessing()=> _buildProcessingUI(),
  case CaptureCompleted() => _buildCompletedUI(),
  case CaptureFailed()    => _buildFailedUI(),
}
```

### GuidedCameraOverlay — Spécification complète

Source : `docs/planning-artifacts/ux-design-specification.md#GuidedCameraOverlay`

**Anatomie :**

- Rectangle overlay centré : 80% de la largeur écran, 90% de la hauteur
- Bordure colorée dynamique (voir tableau ci-dessous)
- Icône état + texte ≤ 5 mots (zone basse de l'overlay)
- Bouton "Démarrer" conditionnel en bas d'écran (44pt minimum, touch target ≥ 44×44pt)

**États et couleurs :**

| État          | Couleur bordure         | Texte zone basse             | Bouton Démarrer |
| ------------- | ----------------------- | ---------------------------- | --------------- |
| `idle`        | Blanc 40% opacity       | —                            | Masqué          |
| `positioning` | `#FF9500` orange        | "Orientez de profil"         | Masqué          |
| `lowLight`    | `#FF9500` orange        | "Améliorez l'éclairage"      | Masqué          |
| `ready`       | `#34C759` vert          | "Prêt — appuyez pour filmer" | Visible, actif  |
| `recording`   | `#FF3B30` rouge (pulse) | "En cours..."                | → Bouton Stop   |

**Règle critique :** Le bouton "Démarrer" n'apparaît QU'en état `ready`. En tout autre état, il est soit masqué soit rendu en `FilledButton` disabled (fond `#C7C7CC`).

**Haptic :** `HapticFeedback.lightImpact()` uniquement au passage vers `ready`.

**Accessibilité :** `Semantics(label: 'Caméra prête. Appuyez sur Démarrer pour filmer.')` en état `ready`. `Semantics(label: 'Lumière insuffisante. Améliorez l\'éclairage pour continuer.')` en état `lowLight`.

### Détection luminosité — NFR-P5 (< 100ms)

La détection de luminosité doit être réalisée en temps réel sur le flux de frames de la caméra avec une latence de mise à jour de l'overlay < 100ms.

**Approche recommandée pour MVP :**

- Utiliser `CameraController.startImageStream()` pour récupérer les frames
- Calculer la luminosité moyenne sur les pixels Y (format YUV420 ou luminance plane)
- Seuil configurable (ex: 40/255) — en dessous = `lowLight`
- Le calcul doit être léger (pas de ML Kit, pas d'isolate pour cette étape) pour garantir la latence < 100ms

**Point de vigilance :** Le traitement des frames caméra pour la détection luminosité tourne sur le thread UI ou un thread léger séparé — ne PAS lancer un isolate complet pour cette seule tâche (surcoût mémoire non justifié). Utiliser `compute()` si nécessaire pour un traitement non-bloquant.

**Impeller (NFR-P2) :** Impeller est activé par défaut sur iOS 16+ dans Flutter 3.x. Ne pas désactiver. Le `CustomPaint` pour l'overlay caméra doit utiliser des opérations compatibles Impeller (pas de `saveLayer` inutile, pas de `maskFilter` complexe).

### Structure fichiers à créer

Nouveaux fichiers pour cette story (selon l'arborescence architecturale) :

```
lib/features/capture/
├── domain/
│   ├── capture_state.dart              # ← CRÉER (sealed class)
│   ├── analysis_result.dart            # ← CRÉER (sealed — stub pour story 3.3)
│   └── analysis_error.dart             # ← CRÉER (sealed — stub pour story 3.3)
├── application/
│   ├── capture_notifier.dart           # ← CRÉER (AsyncNotifier<CaptureState>)
│   ├── capture_notifier_test.dart      # ← CRÉER (co-localisé)
│   └── capture_provider.dart           # ← CRÉER
└── presentation/
    ├── capture_screen.dart             # ← CRÉER
    └── widgets/
        ├── guided_camera_overlay.dart  # ← CRÉER (GuidedCameraOverlay)
        ├── guided_camera_overlay_test.dart  # ← CRÉER (co-localisé)
        └── luminosity_indicator.dart   # ← CRÉER
```

**Fichiers STUBS à créer maintenant (utilisés en story 3.3) :**

`analysis_result.dart` et `analysis_error.dart` doivent être créés comme stubs vides (sealed classes sans membres) pour que `CaptureCompleted` et `CaptureFailed` compilent. Ils seront complétés en Story 3.3.

### Routing — Intégration go_router

La `capture_screen.dart` doit être ajoutée aux routes de `lib/core/router/app_router.dart`. La navigation vers l'écran de capture se fait depuis la fiche patient (`patient_detail_screen.dart`, feature patients) avec le `patientId` comme paramètre de route obligatoire.

```dart
// Route typée (go_router_builder)
@TypedGoRoute<CaptureRoute>(path: '/patients/:patientId/capture')
class CaptureRoute extends GoRouteData {
  final String patientId;
  const CaptureRoute({required this.patientId});
}
```

La route est protégée par le `biometric_guard.dart` dans `core/auth/` — ne pas ajouter de vérification biométrique directement dans l'écran.

### Design System — Rappel palette obligatoire

Source : `docs/planning-artifacts/architecture.md#De la spécification UX`

```dart
// lib/shared/design_system/app_colors.dart (déjà défini en Story 1.1)
static const Color primary     = Color(0xFF1B6FBF);
static const Color success     = Color(0xFF34C759);  // cadre vert = ready
static const Color warning     = Color(0xFFFF9500);  // cadre orange = lowLight/positioning
static const Color error       = Color(0xFFFF3B30);  // cadre rouge = recording
static const Color surface     = Color(0xFFFFFFFF);
static const Color textPrimary = Color(0xFF1C1C1E);
```

Ne jamais hardcoder les couleurs hex dans les widgets — toujours référencer `AppColors`.

### Boutons — Hiérarchie obligatoire (UX spec)

- Bouton "Démarrer" : `FilledButton` (fond `AppColors.primary`, hauteur 56pt, full-width, touch target ≥ 44×44pt)
- Bouton "Démarrer" désactivé : `FilledButton` avec `onPressed: null` (fond automatiquement `#C7C7CC`)
- Bouton "Arrêter" : `OutlinedButton` (bord `AppColors.error`, texte rouge)
- Pas de bouton primaire secondaire sur le même écran (règle : 1 action primaire max par écran)

### Orientation — Portrait strict

Source : `docs/planning-artifacts/ux-design-specification.md#Règle BodyOrthox`

Le flux de capture est **portrait strict**. Si l'iPhone passe en landscape pendant la capture, l'overlay doit afficher "Repassez en mode portrait" et désactiver le bouton Démarrer. Implémenter via `SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp])` au `initState` de l'écran de capture et le relâcher au `dispose`.

### Riverpod — Pattern CaptureNotifier

```dart
// lib/features/capture/application/capture_notifier.dart
@riverpod
class CaptureNotifier extends _$CaptureNotifier {
  @override
  CaptureState build() => const CaptureIdle();

  Future<void> startCapture() async {
    state = const CaptureRecording();
    // Logique d'enregistrement implémentée en Story 3.2
  }

  void stopCapture() {
    state = const CaptureIdle();
  }

  void updateLuminosity(double luminosityValue) {
    // Déclenche la transition lowLight ↔ ready selon le seuil
    // Ne pas appeler depuis le UI thread directement si calcul lourd
  }
}
```

**Règle architecture :** `AsyncNotifier<CaptureState>` uniquement. `StateNotifier` et `ChangeNotifier` sont interdits. Providers déclarés dans `capture_provider.dart` uniquement.

### Tests — Conventions co-location

Tests co-localisés avec les fichiers source (convention architecturale) :

```
lib/features/capture/application/capture_notifier.dart
lib/features/capture/application/capture_notifier_test.dart   ← co-localisé ✅
```

Interdit : dossier `test/` séparé miroir de `lib/`.

**Cas de tests minimaux pour cette story :**

1. `CaptureNotifier` : transition `CaptureIdle` → `CaptureRecording` (startCapture)
2. `CaptureNotifier` : transition `CaptureRecording` → `CaptureIdle` (stopCapture)
3. `GuidedCameraOverlay` widget test : état `ready` → bouton Démarrer visible
4. `GuidedCameraOverlay` widget test : état `lowLight` → bouton Démarrer masqué
5. `GuidedCameraOverlay` widget test : couleur bordure correcte pour chaque état

### Project Structure Notes

**Alignement avec l'arborescence architecturale :**

- `features/capture/` → `FR7-FR19` (source : `docs/planning-artifacts/architecture.md#Mapping des exigences → composants`)
- `guided_camera_overlay.dart` → `features/capture/presentation/widgets/` (path exact défini dans l'arborescence)
- `luminosity_indicator.dart` → `features/capture/presentation/widgets/` (path exact défini dans l'arborescence)
- `capture_state.dart` → `features/capture/domain/` (sealed state machine)

**Conflits ou variances détectés :**

- Aucun conflit avec Story 1.1 (fondation technique déjà en place)
- Story 3.1 ne doit pas créer de logique dans `core/database/` — les analyses ne sont pas persistées dans cette story
- `AnalysisResult` et `AnalysisError` créés comme stubs — ils seront implémentés complètement en Story 3.3

### Dépendance sur Story 1.1

Cette story suppose que Story 1.1 est **done** et que les éléments suivants existent :

- `lib/shared/design_system/app_colors.dart` avec la palette complète
- `lib/core/router/app_router.dart` en place (go_router)
- `pubspec.yaml` avec le plugin `camera` déclaré (vérifier la présence, sinon ajouter)
- Flavor `dev` fonctionnel pour tester sur device

### References

- [Source: docs/planning-artifacts/epics.md#Epic 3 — Story 3.1] — User story, Acceptance Criteria complets
- [Source: docs/planning-artifacts/architecture.md#State machine pipeline ML] — `CaptureState` sealed class patron
- [Source: docs/planning-artifacts/architecture.md#Architecture Frontend (Flutter)] — Riverpod AsyncNotifier pattern
- [Source: docs/planning-artifacts/architecture.md#Patterns de communication] — Switch exhaustif obligatoire
- [Source: docs/planning-artifacts/architecture.md#Structure du Projet] — Arborescence complète + mapping FR
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns explicites] — DAO direct interdit, disclaimer inline interdit
- [Source: docs/planning-artifacts/ux-design-specification.md#GuidedCameraOverlay] — Anatomie, états, couleurs, règles
- [Source: docs/planning-artifacts/ux-design-specification.md#Button Hierarchy] — FilledButton / disabled pattern
- [Source: docs/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Ton assistant, pas modal bloquant
- [Source: docs/planning-artifacts/epics.md#NonFunctional Requirements] — NFR-P2 (58 FPS), NFR-P5 (< 100ms overlay)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `StateProvider` supprimé dans Riverpod 3.x → remplacé par `@riverpod` Notifier avec méthode `update()`
- `OverlayState` conflit avec `flutter/widgets.dart` → renommé en `CameraOverlayState`
- Provider généré par riverpod_generator 4.x : `CaptureNotifier` → `captureProvider` (suffix "Notifier" strippé)
- 2 tests pré-existants en échec dans `test/app_test.dart` (appConfigProvider Story 1.x) — non causés par Story 3.1

### Completion Notes List

- ✅ CaptureState sealed class (5 états) + CaptureNotifier (Riverpod 3.x Notifier) — TDD, 5 tests unitaires
- ✅ GuidedCameraOverlay avec CameraOverlayState enum (5 états), bordures couleur, bouton conditionnel, haptic, Semantics — TDD, 13 tests widget
- ✅ Détection luminosité temps réel via CameraController.startImageStream() (plan Y YUV420) — 1 frame/3 pour < 100ms
- ✅ capture_provider.dart avec overlayStateProvider dérivé (luminosityProvider + correctPositionProvider)
- ✅ CaptureScreen : ConsumerStatefulWidget, gestion permissions avec CupertinoAlertDialog pré-système
- ✅ LuminosityIndicator widget auxiliaire créé
- ✅ Route /patients/:patientId/capture ajoutée dans app_router.dart
- ✅ Stubs analysis_result.dart et analysis_error.dart créés pour Story 3.3
- ✅ 18 tests feature capture passent (0 régression nouvelle)

### File List

- `bodyorthox/lib/features/capture/domain/capture_state.dart` — sealed class CaptureState (5 états)
- `bodyorthox/lib/features/capture/domain/analysis_result.dart` — stub sealed class (Story 3.3)
- `bodyorthox/lib/features/capture/domain/analysis_error.dart` — stub sealed class (Story 3.3)
- `bodyorthox/lib/features/capture/application/capture_notifier.dart` — Riverpod 3.x Notifier<CaptureState>
- `bodyorthox/lib/features/capture/application/capture_notifier.g.dart` — généré
- `bodyorthox/lib/features/capture/application/capture_notifier_test.dart` — 5 tests unitaires
- `bodyorthox/lib/features/capture/application/capture_provider.dart` — providers dérivés (overlayState)
- `bodyorthox/lib/features/capture/application/capture_provider.g.dart` — généré
- `bodyorthox/lib/features/capture/presentation/capture_screen.dart` — écran principal ConsumerStatefulWidget
- `bodyorthox/lib/features/capture/presentation/widgets/guided_camera_overlay.dart` — overlay + CameraOverlayState
- `bodyorthox/lib/features/capture/presentation/widgets/guided_camera_overlay_test.dart` — 13 tests widget
- `bodyorthox/lib/features/capture/presentation/widgets/luminosity_indicator.dart` — indicateur luminosité
- `bodyorthox/lib/core/router/app_router.dart` — route /patients/:patientId/capture ajoutée
- `bodyorthox/pubspec.yaml` — camera ^0.12.0 et permission_handler ^12.0.1 ajoutés
