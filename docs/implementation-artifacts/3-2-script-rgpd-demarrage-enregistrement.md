# Story 3.2 : Script RGPD & Démarrage Enregistrement

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 3.2, Epic 3 (Capture Guidée & Analyse ML) -->

---

## Story

As a practitioner,
I want to read a RGPD reassurance script to my patient before recording, and start recording with a single tap,
So that patients are informed and consent is managed before any capture begins.

---

## Acceptance Criteria

**AC1 — Affichage du script RGPD**
**Given** l'écran de capture est prêt (Story 3.1 a initialisé `GuidedCameraOverlay`)
**When** j'arrive à l'étape de capture
**Then** le texte de réassurance RGPD est affiché de manière visible : _"Cette vidéo est analysée localement sur cet appareil. Elle n'est pas transmise ni stockée sur un serveur externe."_
**And** ce texte est affiché sous forme de caption inline (non-modal, toujours visible) au-dessus du bouton "Démarrer"
**And** le texte provient obligatoirement de `LegalConstants.rgpdReassuranceScript` — jamais inline dans le widget

**AC2 — Démarrage enregistrement 1 tap**
**Given** le script RGPD est affiché
**When** l'état du `GuidedCameraOverlay` est `ready` (cadre vert — conditions d'éclairage et positionnement OK)
**Then** le bouton "Démarrer" est visible et actif
**And** un seul tap sur "Démarrer" lance immédiatement l'enregistrement (transition vers état `recording`)
**And** le `CaptureNotifier` passe de l'état `CaptureIdle` à `CaptureRecording`

**AC3 — Permission caméra contextuelle**
**Given** la permission caméra n'a pas encore été accordée
**When** l'écran de capture s'ouvre pour la première fois
**Then** un `CupertinoAlertDialog` iOS natif est affiché avec une explication contextuelle avant la demande de permission système
**And** le texte de ce dialog est : _"BodyOrthox utilise votre caméra uniquement pendant l'analyse. La vidéo reste sur votre appareil."_
**And** si la permission est refusée, un message d'erreur actionnable s'affiche ("Autoriser dans Réglages iOS") — jamais un écran bloquant sans issue

**AC4 — Bouton conditionnel (état non-ready)**
**Given** le `GuidedCameraOverlay` est dans un état autre que `ready` (`idle`, `positioning`, ou `lowLight`)
**Then** le bouton "Démarrer" est masqué ou désactivé
**And** aucun démarrage d'enregistrement n'est possible tant que les conditions ne sont pas remplies

**AC5 — Conformité architecturale**
**And** le script RGPD est la seule constante de type légal/RGPD de cette feature — elle est déclarée dans `core/legal/legal_constants.dart`
**And** le `CaptureNotifier` gère l'état de la permission caméra comme un `AsyncValue` dans son `CaptureState`

---

## Tasks / Subtasks

- [ ] **T1 — Ajouter `LegalConstants.rgpdReassuranceScript`** (AC: 1, 5)
  - [ ] T1.1 — Ouvrir `lib/core/legal/legal_constants.dart`
  - [ ] T1.2 — Ajouter la constante `static const String rgpdReassuranceScript = 'Cette vidéo est analysée localement sur cet appareil. Elle n\'est pas transmise ni stockée sur un serveur externe.';`
  - [ ] T1.3 — Vérifier que la constante est accessible depuis `features/capture/presentation/`

- [ ] **T2 — Implémenter la gestion de permission caméra** (AC: 3, 5)
  - [ ] T2.1 — Dans `lib/features/capture/application/capture_notifier.dart`, ajouter la vérification de permission caméra au démarrage via `permission_handler` ou l'API native Flutter (`camera` plugin)
  - [ ] T2.2 — Créer l'état `CapturePermissionDenied` dans `lib/features/capture/domain/capture_state.dart` (sealed class)
  - [ ] T2.3 — Implémenter la logique : si permission non accordée → déclencher la demande contextuelle ; si refusée → passer à `CapturePermissionDenied`
  - [ ] T2.4 — Le `CaptureNotifier` expose l'état de permission via `AsyncValue<CaptureState>`

- [ ] **T3 — Afficher le dialog de permission contextuel** (AC: 3)
  - [ ] T3.1 — Dans `lib/features/capture/presentation/capture_screen.dart`, écouter l'état `AsyncValue<CaptureState>` du `captureStateProvider`
  - [ ] T3.2 — Avant la demande système, afficher un `CupertinoAlertDialog` avec le texte explicatif (voir AC3)
  - [ ] T3.3 — En cas de permission refusée, afficher un widget d'erreur non-bloquant avec lien vers les réglages iOS (`openAppSettings()`)
  - [ ] T3.4 — Écrire `capture_screen_test.dart` co-localisé : tester les états `permissionGranted` / `permissionDenied`

- [ ] **T4 — Afficher le script RGPD inline sur l'écran de capture** (AC: 1, 4)
  - [ ] T4.1 — Dans `lib/features/capture/presentation/capture_screen.dart`, ajouter un `Text(LegalConstants.rgpdReassuranceScript)` en style caption gris au-dessus de la zone de bouton
  - [ ] T4.2 — Appliquer le style : `AppTypography` callout (16pt Regular), couleur texte secondaire gris (`#8E8E93` système iOS)
  - [ ] T4.3 — Vérifier que le texte est toujours visible (non masqué par le `GuidedCameraOverlay`)
  - [ ] T4.4 — VoiceOver : le texte est lisible par le lecteur d'écran (pas d'`ExcludeSemantics`)

- [ ] **T5 — Implémenter le bouton "Démarrer" conditionnel** (AC: 2, 4)
  - [ ] T5.1 — Dans `capture_screen.dart`, consommer l'état `GuidedCameraOverlay` (état `ready` vs autre)
  - [ ] T5.2 — Le bouton "Démarrer" (`FilledButton`, fond `#1B6FBF`, hauteur 56pt, full-width, `AppSpacing.touchTarget` minimum 44pt) s'affiche uniquement quand l'état overlay est `ready`
  - [ ] T5.3 — Au tap sur "Démarrer" : appeler `ref.read(captureStateProvider.notifier).startRecording()`
  - [ ] T5.4 — Le `CaptureNotifier.startRecording()` valide que l'état courant est `CaptureIdle` (guard contre double-tap) puis passe à `CaptureRecording`
  - [ ] T5.5 — Écrire le test unitaire `capture_notifier_test.dart` : vérifier la transition `CaptureIdle → CaptureRecording`

- [ ] **T6 — Intégration avec la state machine `CaptureState`** (AC: 2, 5)
  - [ ] T6.1 — Vérifier que `CaptureState` dans `lib/features/capture/domain/capture_state.dart` inclut les états : `CaptureIdle`, `CapturePermissionPending`, `CapturePermissionDenied`, `CaptureRecording` (au minimum pour cette story)
  - [ ] T6.2 — Mettre à jour `lib/features/capture/application/capture_provider.dart` si nécessaire pour exposer le provider `captureStateProvider`
  - [ ] T6.3 — S'assurer que le switch exhaustif dans `capture_screen.dart` couvre tous les états de la sealed class

- [ ] **T7 — Validation finale**
  - [ ] T7.1 — `flutter analyze` passe sans erreurs ni warnings
  - [ ] T7.2 — Tous les tests co-localisés passent (`flutter test lib/features/capture/`)
  - [ ] T7.3 — Sur simulateur : vérifier le flux complet (dialog permission → script RGPD visible → bouton conditionnel → 1 tap démarre l'enregistrement)
  - [ ] T7.4 — Vérifier l'accessibilité VoiceOver sur le texte RGPD et le bouton "Démarrer"

---

## Dev Notes

### Contexte de la story dans l'Epic 3

Cette story est la **deuxième story de l'Epic 3** (Capture Guidée & Analyse ML). Elle s'appuie sur les fondations de la Story 3.1 (qui implémente le `GuidedCameraOverlay`, la détection de luminosité, et la structure de `CaptureState`). Elle prépare la Story 3.3 (pipeline ML — le `CaptureNotifier.startRecording()` amorcé ici sera complété par la logique d'analyse).

**Dépendances impératives :**

- Story 1.1 : structure Feature-First + `LegalConstants` existants dans `core/legal/legal_constants.dart`
- Story 1.3 : `core/database/` opérationnel (pas directement requis ici, mais la foundation doit être en place)
- Story 3.1 : `GuidedCameraOverlay`, `CaptureState` sealed class, `CaptureNotifier` base, `capture_provider.dart`

### Constante RGPD obligatoire à ajouter dans `legal_constants.dart`

```dart
// lib/core/legal/legal_constants.dart
abstract class LegalConstants {
  /// Disclaimer EU MDR — affiché sur chaque page de rapport PDF.
  /// [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus]
  static const String mdrDisclaimer =
      'BodyOrthox est un outil de documentation clinique. '
      'Les données produites ne constituent pas un acte de '
      'diagnostic médical et ne se substituent pas au jugement '
      'clinique du praticien.';

  /// Script de réassurance RGPD — affiché inline avant toute capture vidéo.
  /// INTERDIT : reproduire ce texte inline dans un widget.
  /// [Source: docs/planning-artifacts/epics.md#Story-3.2]
  static const String rgpdReassuranceScript =
      'Cette vidéo est analysée localement sur cet appareil. '
      'Elle n\'est pas transmise ni stockée sur un serveur externe.';
}
```

### Extension de `CaptureState` pour cette story

La Story 3.1 aura créé le fichier `lib/features/capture/domain/capture_state.dart`. Cette story doit s'assurer que les états liés à la permission caméra sont présents (ou les ajouter si Story 3.1 ne les a pas inclus) :

```dart
// lib/features/capture/domain/capture_state.dart
sealed class CaptureState { const CaptureState(); }

/// État initial — en attente d'interaction ou de permission.
final class CaptureIdle extends CaptureState { const CaptureIdle(); }

/// Permission caméra en cours de demande (dialog affiché).
final class CapturePermissionPending extends CaptureState {
  const CapturePermissionPending();
}

/// Permission caméra refusée par l'utilisateur.
final class CapturePermissionDenied extends CaptureState {
  const CapturePermissionDenied();
}

/// Enregistrement vidéo en cours.
final class CaptureRecording extends CaptureState { const CaptureRecording(); }

/// Analyse ML en cours en arrière-plan (post-enregistrement — Story 3.3).
final class CaptureProcessing extends CaptureState { const CaptureProcessing(); }

/// Analyse terminée avec succès (Story 3.3+).
final class CaptureCompleted extends CaptureState {
  final AnalysisResult result;
  const CaptureCompleted(this.result);
}

/// Analyse échouée (Story 3.3+).
final class CaptureFailed extends CaptureState {
  final AnalysisError error;
  const CaptureFailed(this.error);
}
```

**Règle critique :** Tous les `switch` sur `CaptureState` doivent être exhaustifs — Dart 3 le garantit à la compilation.

### Méthode `startRecording()` dans `CaptureNotifier`

```dart
// lib/features/capture/application/capture_notifier.dart
class CaptureNotifier extends AsyncNotifier<CaptureState> {
  @override
  Future<CaptureState> build() async => const CaptureIdle();

  /// Demande la permission caméra si nécessaire, puis passe en idle.
  /// Appelée au montage de CaptureScreen.
  Future<void> requestCameraPermission() async {
    state = const AsyncValue.loading();
    // Logique de demande de permission via camera plugin ou permission_handler
    // → Si accordée : const CaptureIdle()
    // → Si refusée : const CapturePermissionDenied()
  }

  /// Démarre l'enregistrement vidéo — guard contre double-tap.
  /// Pré-condition : état courant doit être CaptureIdle.
  Future<void> startRecording() async {
    final current = state.valueOrNull;
    if (current is! CaptureIdle) return; // Guard — ignore si mauvais état
    state = const AsyncValue.data(CaptureRecording());
    // Story 3.3 complétera cette méthode avec le pipeline ML
  }
}
```

### Affichage du script RGPD dans `CaptureScreen`

```dart
// lib/features/capture/presentation/capture_screen.dart
// Extrait de la zone bouton

// ✅ CORRECT — utilise la constante centralisée
Text(
  LegalConstants.rgpdReassuranceScript,
  style: Theme.of(context).textTheme.bodySmall?.copyWith(
    color: const Color(0xFF8E8E93), // Gris iOS système
  ),
  textAlign: TextAlign.center,
),
const SizedBox(height: AppSpacing.base), // 8pt

// Bouton conditionnel — visible uniquement en état `ready` du GuidedCameraOverlay
if (overlayState == GuidedCameraOverlayState.ready)
  SizedBox(
    width: double.infinity,
    height: 56, // FilledButton standard BodyOrthox
    child: FilledButton(
      onPressed: () => ref.read(captureStateProvider.notifier).startRecording(),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary, // #1B6FBF
      ),
      child: const Text('Démarrer'),
    ),
  ),

// ❌ INTERDIT — ne jamais écrire le texte RGPD inline
// Text('Cette vidéo est analysée localement...')  // INTERDIT
```

### Gestion de la permission caméra — Dialog contextuel

La spécification UX impose un `CupertinoAlertDialog` (non un `AlertDialog` Material) pour les permissions système, avec une explication avant la demande iOS :

```dart
// Avant la demande de permission système iOS
Future<void> _showCameraPermissionDialog(BuildContext context) async {
  final granted = await showCupertinoDialog<bool>(
    context: context,
    builder: (ctx) => CupertinoAlertDialog(
      title: const Text('Accès à la caméra'),
      content: const Text(
        'BodyOrthox utilise votre caméra uniquement pendant l\'analyse. '
        'La vidéo reste sur votre appareil.',
      ),
      actions: [
        CupertinoDialogAction(
          isDestructiveAction: true,
          child: const Text('Pas maintenant'),
          onPressed: () => Navigator.of(ctx).pop(false),
        ),
        CupertinoDialogAction(
          isDefaultAction: true,
          child: const Text('Autoriser'),
          onPressed: () => Navigator.of(ctx).pop(true),
        ),
      ],
    ),
  );
  if (granted == true) {
    await ref.read(captureStateProvider.notifier).requestCameraPermission();
  }
}
```

**En cas de refus :** Afficher un widget non-bloquant (pas un écran entier) avec un lien vers les réglages iOS :

```dart
// Widget d'erreur permission refusée — non bloquant
if (captureState is CapturePermissionDenied)
  Padding(
    padding: const EdgeInsets.all(AppSpacing.margin),
    child: Column(
      children: [
        Text(
          'Accès caméra refusé. Activez-le dans les Réglages iOS pour utiliser BodyOrthox.',
          style: Theme.of(context).textTheme.bodyMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.base),
        TextButton(
          onPressed: () => openAppSettings(), // openAppSettings() de permission_handler
          child: const Text('Ouvrir les Réglages'),
        ),
      ],
    ),
  ),
```

### Pattern AsyncValue dans `CaptureScreen` — switch exhaustif obligatoire

```dart
// ✅ CORRECT — switch exhaustif Dart 3
switch (captureState) {
  case AsyncData(:final value) => _buildCaptureContent(value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error: error),
}

// Et pour CaptureState lui-même (sealed):
switch (captureStateValue) {
  case CaptureIdle()              => _buildIdleView(),
  case CapturePermissionPending() => _buildPermissionPendingView(),
  case CapturePermissionDenied()  => _buildPermissionDeniedView(),
  case CaptureRecording()         => _buildRecordingView(),
  case CaptureProcessing()        => _buildProcessingView(),
  case CaptureCompleted(:final result) => _buildCompletedView(result),
  case CaptureFailed(:final error)     => _buildFailedView(error),
}

// ❌ INTERDIT
captureState.when(data: ..., loading: ..., error: ...); // INTERDIT
captureState.maybeWhen(...); // INTERDIT
```

### UX — Comportement visuel du script RGPD

Selon `docs/planning-artifacts/ux-design-specification.md` (section "System Feedback Patterns") :

- Le script RGPD est une **notice info inline** — jamais une modal, jamais un écran dédié
- Style : `Caption gris` (texte statique, non-interactif)
- Position : au-dessus du bouton "Démarrer", toujours visible
- Il est visible en permanence sur l'écran de capture — pas de "j'ai lu et compris" à cocher
- Hauteur minimum de la zone de bouton : 44pt (conformité Apple HIG + WCAG)

**État du `GuidedCameraOverlay` (depuis Story 3.1) :**

| État          | Couleur bordure   | Texte overlay                | Bouton "Démarrer" |
| ------------- | ----------------- | ---------------------------- | ----------------- |
| `idle`        | Blanc 40% opacité | —                            | Masqué            |
| `positioning` | `#FF9500` orange  | "Orientez de profil"         | Masqué            |
| `lowLight`    | `#FF9500` orange  | "Améliorez l'éclairage"      | Masqué            |
| `ready`       | `#34C759` vert    | "Prêt — appuyez pour filmer" | Visible           |
| `recording`   | `#FF3B30` rouge   | "En cours..."                | → Bouton Stop     |

**Haptic feedback :** Lors du passage à l'état `ready`, un haptic léger (`HapticFeedback.lightImpact()`) signale que le bouton "Démarrer" est maintenant actif.

### Structure des fichiers à toucher / créer

```
lib/
├── core/
│   └── legal/
│       └── legal_constants.dart           ← MODIFIER : ajouter rgpdReassuranceScript
├── features/
│   └── capture/
│       ├── domain/
│       │   └── capture_state.dart         ← VÉRIFIER/MODIFIER : états permission
│       ├── application/
│       │   ├── capture_notifier.dart      ← MODIFIER : requestCameraPermission() + startRecording()
│       │   ├── capture_notifier_test.dart ← CRÉER/MODIFIER : tests transitions d'état
│       │   └── capture_provider.dart      ← VÉRIFIER : captureStateProvider exposé
│       └── presentation/
│           ├── capture_screen.dart        ← MODIFIER : affichage RGPD + dialog permission + bouton
│           └── capture_screen_test.dart   ← CRÉER : tests widget permission/RGPD
```

**Fichiers à NE PAS toucher dans cette story :**

- `ml_service.dart` — sera traité en Story 3.3
- `ml_isolate_runner.dart` — sera traité en Story 3.3
- `guided_camera_overlay.dart` — implémenté en Story 3.1, uniquement consommé ici
- `analysis_dao.dart` — pas de persistance dans cette story
- Tout fichier sous `features/results/`, `features/report/` — hors scope

### Règles architecturales OBLIGATOIRES

1. **LegalConstants** : `rgpdReassuranceScript` doit être dans `core/legal/legal_constants.dart` — texte JAMAIS inline dans un widget
2. **AsyncValue switch exhaustif** : Dart 3 `switch` pattern matching sur `AsyncValue<CaptureState>` et sur `CaptureState` — `state.when(...)` interdit
3. **Providers Riverpod** : déclarés uniquement dans `capture_provider.dart` — pas de provider ad hoc dans les widgets
4. **CupertinoAlertDialog** : pour la demande de permission — pas de `AlertDialog` Material (design system Cupertino + Material 3 hybride, les permissions utilisent Cupertino)
5. **Bouton conditionnel** : le bouton "Démarrer" ne peut pas être affiché quand l'overlay n'est pas `ready` — règle UX critique qui empêche les captures ratées (spec UX §GuidedCameraOverlay)
6. **Tests co-localisés** : `capture_notifier_test.dart` au même niveau que `capture_notifier.dart` — INTERDIT : dossier `test/` miroir séparé
7. **Permission caméra** : toujours demandée au moment contextuel (jamais au lancement de l'app, jamais de manière silencieuse)

### Anti-patterns à éviter impérativement

```dart
// ❌ INTERDIT — texte RGPD inline
Text('Cette vidéo est analysée localement sur cet appareil. Elle n\'est pas...')

// ✅ CORRECT
Text(LegalConstants.rgpdReassuranceScript)

// ❌ INTERDIT — AsyncValue.when
captureState.when(data: ..., loading: ..., error: ...)

// ✅ CORRECT — switch exhaustif
switch (captureState) {
  case AsyncData(:final value) => ...,
  case AsyncLoading() => ...,
  case AsyncError(:final error) => ...,
}

// ❌ INTERDIT — accès DAO direct
ref.read(driftDbProvider).analysisDao.something()

// ✅ CORRECT — via Repository uniquement
ref.read(analysisRepositoryProvider).something()

// ❌ INTERDIT — MaterialAlertDialog pour les permissions
showDialog(builder: (ctx) => AlertDialog(...))

// ✅ CORRECT — CupertinoAlertDialog
showCupertinoDialog(builder: (ctx) => CupertinoAlertDialog(...))

// ❌ INTERDIT — permission au lancement de l'app
// Ne pas demander la permission caméra dans main_dev.dart ou app.dart

// ✅ CORRECT — permission au moment contextuel
// Demander uniquement quand CaptureScreen s'ouvre pour la première fois
```

### Considérations NFR

| NFR    | Impact sur cette story                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-P2 | UI à ≥ 58 FPS — le `GuidedCameraOverlay` tourne en temps réel sur le main thread avec Impeller. Ne pas bloquer avec des opérations synchrones.                          |
| NFR-P5 | Latence overlay < 100ms — vérifier que l'affichage conditionnel du bouton "Démarrer" ne crée pas de jank (rebuild minimal).                                             |
| NFR-S5 | Vidéo brute jamais sur disque — cette story ne lance pas encore l'analyse ML mais prépare la transition. Confirmer que le `CaptureRecording()` n'écrit rien sur disque. |
| NFR-S6 | Conformité RGPD — le script affiché est la manifestation UX de la conformité RGPD by architecture. Sa présence visible avant toute capture est non-négociable.          |

### Tests à écrire

**`capture_notifier_test.dart`** (co-localisé avec `capture_notifier.dart`) :

```dart
// Transitions d'état à tester :
// 1. État initial = CaptureIdle
// 2. startRecording() quand état = CaptureIdle → CaptureRecording
// 3. startRecording() quand état ≠ CaptureIdle → état inchangé (guard)
// 4. requestCameraPermission() → permission accordée → CaptureIdle
// 5. requestCameraPermission() → permission refusée → CapturePermissionDenied
```

**`capture_screen_test.dart`** (co-localisé avec `capture_screen.dart`) :

```dart
// Tests widget à écrire :
// 1. LegalConstants.rgpdReassuranceScript est affiché sur l'écran
// 2. Bouton "Démarrer" absent quand overlay state ≠ ready
// 3. Bouton "Démarrer" présent quand overlay state = ready
// 4. CupertinoAlertDialog affiché quand permission non accordée
// 5. Widget d'erreur affiché quand état = CapturePermissionDenied
```

### Project Structure Notes

**Alignement avec l'arborescence architecture définie :**

```
features/capture/                                  (architecture.md#Arborescence)
  domain/capture_state.dart                        ✅ ajout états permission
  application/capture_notifier.dart                ✅ méthodes permission + startRecording
  application/capture_provider.dart                ✅ vérifier exposition provider
  presentation/capture_screen.dart                 ✅ RGPD + permission + bouton conditionnel
core/legal/legal_constants.dart                    ✅ ajout rgpdReassuranceScript
```

**Conflit détecté et résolu :**
L'architecture définit `capture_screen.dart` dans `features/capture/presentation/`. La Story 3.1 a déjà créé ce fichier. Cette story le modifie — pas de nouveau fichier de présentation à créer. Vérifier avant de commencer si la Story 3.1 a déjà inclus un stub pour le bouton "Démarrer" ou si c'est à créer ici.

### References

- [Source: docs/planning-artifacts/epics.md#Story-3.2] — User story, Acceptance Criteria originaux, texte exact du script RGPD
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus] — LegalConstants pattern, texte RGPD in-context
- [Source: docs/planning-artifacts/architecture.md#Communication-Gestion-des-erreurs] — Sealed class CaptureState, switch exhaustif obligatoire
- [Source: docs/planning-artifacts/architecture.md#Architecture-Frontend] — AsyncNotifier, switch AsyncValue exhaustif
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Feature-First, co-location tests
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes
- [Source: docs/planning-artifacts/ux-design-specification.md#System-Feedback-Patterns] — Notice RGPD inline caption, jamais modal
- [Source: docs/planning-artifacts/ux-design-specification.md#GuidedCameraOverlay] — États overlay, bouton conditionnel état `ready`
- [Source: docs/planning-artifacts/ux-design-specification.md#Button-Hierarchy] — FilledButton `#1B6FBF`, 56pt hauteur, full-width
- [Source: docs/planning-artifacts/ux-design-specification.md#Component-Library] — CupertinoAlertDialog pour permissions
- [Source: docs/planning-artifacts/epics.md#Requirements] — FR12 (script RGPD), FR37 (permission contextuelle), NFR-S6 (RGPD by architecture)
- [Source: docs/implementation-artifacts/1-1-initialisation-du-projet-infrastructure-technique.md#LegalConstants] — Pattern LegalConstants établi en Story 1.1

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

Fichiers attendus (non-exhaustif) :

- `bodyorthox/lib/core/legal/legal_constants.dart` — modified (ajout `rgpdReassuranceScript`)
- `bodyorthox/lib/features/capture/domain/capture_state.dart` — modified (ajout états permission)
- `bodyorthox/lib/features/capture/application/capture_notifier.dart` — modified (requestCameraPermission + startRecording)
- `bodyorthox/lib/features/capture/application/capture_notifier_test.dart` — created/modified
- `bodyorthox/lib/features/capture/application/capture_provider.dart` — verified/modified
- `bodyorthox/lib/features/capture/presentation/capture_screen.dart` — modified (RGPD + permission dialog + bouton conditionnel)
- `bodyorthox/lib/features/capture/presentation/capture_screen_test.dart` — created
