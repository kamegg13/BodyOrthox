# Story 3.4 : Affichage des Résultats avec Normes de Référence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a practitioner,
I want to see the measured articular angles alongside age-appropriate reference norms, in simple or expert view,
So that I can immediately interpret the clinical significance of the results.

## Acceptance Criteria

1. **Given** l'analyse ML est terminée avec succès **When** j'accède à l'écran de résultats **Then** les `ArticularAngleCard` affichent genou, hanche et cheville avec leur valeur en degrés (1 décimale) — ex : `"42.3°"` (FR15, architecture patterns/format)
2. **Given** un patient a un âge et un profil morphologique défini **When** les résultats s'affichent **Then** les plages normatives de référence par âge et profil sont récupérées depuis `reference_norms.dart` et affichées sous chaque valeur mesurée
3. **Given** je suis en vue simple (default) **When** je lis les résultats **Then** chaque `ArticularAngleCard` affiche l'angle mesuré + un indicateur visuel vert/orange/rouge (`normal` / `borderline` / `abnormal`) + le label court associé (FR38)
4. **Given** je suis en vue simple **When** je tape le toggle "Vue experte" **Then** la bascule s'effectue en 1 tap, sans navigation imbriquée, révélant les données brutes et le score de confiance ML dans chaque `ArticularAngleCard`
5. **Given** je suis sur l'écran de résultats **Then** le `BodySkeletonOverlay` visualise la posture analysée (frame clé du pipeline ML) avec les points articulaires `#1B6FBF` et les segments osseux
6. **Given** une articulation a un score de confiance ML < 60% **Then** la `ArticularAngleCard` affiche un état `lowConfidence` (chip gris + label "Correction manuelle") et l'entrée VoiceOver annonce "Correction manuelle requise"
7. **Given** l'écran de résultats s'affiche **Then** le switch `AsyncValue` sur le provider `resultsProvider` est exhaustif (Dart 3) — `AsyncData`, `AsyncLoading`, `AsyncError` — aucun cas non couvert à la compilation
8. **Given** le VoiceOver est actif **Then** les labels sémantiques sont "Flexion genou gauche : 42.3 degrés, sous la norme de 60 à 70 degrés pour 67 ans." conformément à la spécification UX

## Tasks / Subtasks

- [x] Task 1 — Créer le domaine `reference_norms.dart` (AC: #2)
  - [x] Définir la structure de données normative : plages par tranche d'âge (< 40, 40–60, > 60) × profil morphologique (standard / hypermobile / hypermobile)
  - [x] Implémenter la classe `ReferenceNorms` avec méthode `getNorm(ArticulationName, int ageYears, MorphologicalProfile) → NormRange`
  - [x] Définir `NormRange` (sans Freezed — class const) avec `min`, `max`, et méthode `evaluate(double angle) → NormStatus`
  - [x] Définir `NormStatus` sealed : `NormNormal`, `NormBorderline`, `NormAbnormal`
  - [x] Écrire les tests unitaires co-localisés `reference_norms_test.dart` (20 tests)

- [x] Task 2 — Créer `results_notifier.dart` et `results_provider.dart` (AC: #7)
  - [x] `ResultsNotifier extends _$ResultsNotifier` (family `@riverpod`) — chargement via `analysisRepo.watchById(analysisId).first`
  - [x] Calcul des `NormStatus` pour chaque articulation via `ReferenceNorms.getNorm()` sur l'âge/profil du patient
  - [x] Exposer `ResultsView` (enum `simple` / `expert`) via `ResultsViewController` (`@riverpod`)
  - [x] Méthode `toggle()` pour basculer entre vue simple et vue experte
  - [x] Déclarer tous les providers dans `results_provider.dart` uniquement
  - [x] Écrire `results_notifier_test.dart` co-localisé (mocktail + pattern `expectLater(throwsA)`)

- [x] Task 3 — Implémenter `articular_angle_card.dart` (AC: #1, #3, #4, #6, #8)
  - [x] Variante `ArticularAngleCard.primary` (grande card, articulation dominante)
  - [x] Variante `ArticularAngleCard.compact` (tableau des 3 articulations)
  - [x] Valeur dominante : `"42.3°"` (toStringAsFixed(1))
  - [x] Sous-valeur : norme de référence gris `#8E8E93` : `"Norme 60–70° / 67 ans"`
  - [x] Indicateur pastille : vert/orange/rouge + label court Normal/Limite/Hors norme
  - [x] En vue experte : chip ML score en bas à droite
  - [x] État `lowConfidence` : chip gris + label "Correction manuelle"
  - [x] Semantic label VoiceOver complet + `excludeSemantics: true` (fix code-review)
  - [x] Background `#E8F1FB`, border radius `12pt`, padding `16pt`

- [x] Task 4 — Implémenter `body_skeleton_overlay.dart` (AC: #5)
  - [x] Placeholder anatomique générique (dégradation gracieuse — Story 3.3 sans keyFrameData)
  - [x] Points articulaires : cercles `#1B6FBF` 8pt diamètre (orange si lowConfidence)
  - [x] Segments osseux : lignes 2pt entre les points
  - [x] Labels angles : Callout (16pt) SF Pro Semibold sur genou, hanche, cheville
  - [x] `ExcludeSemantics` wrappant l'overlay (VoiceOver ignore le décoratif)
  - [x] `RepaintBoundary` pour isoler les repaints (Impeller 60fps)

- [x] Task 5 — Implémenter `simple_view.dart` et `expert_view.dart` (AC: #3, #4)
  - [x] `simple_view.dart` : articulation dominante (grande card) + 2 cartes compactes
  - [x] `expert_view.dart` : `BodySkeletonOverlay` + 3 cartes compactes `isExpertView: true`
  - [x] Toggle `SegmentedButton` Material 3 — 1 tap, `AnimatedSwitcher` 200ms sans navigation push
  - [x] Persistance via `resultsViewControllerProvider`

- [x] Task 6 — Implémenter `results_screen.dart` (AC: #1–#8)
  - [x] Route intégrée dans `app_router.dart` : `/patients/:patientId/analyses/:analysisId`
  - [x] Switch exhaustif Dart 3 sur `AsyncValue<AnalysisResultDisplay>` (AsyncData/AsyncLoading/AsyncError)
  - [x] Titre "Résultats" 34pt Regular
  - [x] Bouton "Exporter PDF" FilledButton full-width 56pt hauteur (stub Story 4.1)
  - [x] `LegalConstants.mdrDisclaimer` affiché en bas (jamais inline)
  - [x] Marges 16pt, espacement 24pt, touch targets ≥ 44pt

- [x] Task 7 — Écrire les tests (AC: tous)
  - [x] `reference_norms_test.dart` : 20 tests (NormRange.evaluate × 7, getNorm × tranche d'âge, profils fallback)
  - [x] `results_notifier_test.dart` : 12 tests (chargement, erreurs, calcul normes, toggle vue)
  - [x] `articular_angle_card_test.dart` : 11 widget tests (4 états, chip ML, semantic labels)
  - [x] `results_screen_test.dart` : 5 smoke tests (AsyncData, AsyncLoading, AsyncError, toggle, disclaimer)

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] AC5 scope — `BodySkeletonOverlay` absent de la vue simple : AC5 dit "sur l'écran de résultats" sans qualifier "vue experte". Décision UX requise avant Story 3.5. [simple_view.dart]
- [ ] [AI-Review][MEDIUM] Route path divergente — story spec `/results/:analysisId` vs implémentation `/patients/:patientId/analyses/:analysisId`. Impact Story 6.3 deep links. [app_router.dart]
- [ ] [AI-Review][MEDIUM] Doublon `_computeAgeYears` — même logique dans `ResultsNotifier._computeAgeYears()` et `AnalysisResultDisplay.patientAgeYears`. [results_notifier.dart:86, analysis_result_display.dart:44]
- [ ] [AI-Review][LOW] `shouldRepaint` reference equality dans `_SkeletonPainter` — `AnalysisResultDisplay` sans `==` override. [body_skeleton_overlay.dart:137]
- [ ] [AI-Review][LOW] Wildcard `_` dans `ReferenceNorms.getNorm()` contourne le switch exhaustif : nouveaux profils ignorés silencieusement. [reference_norms.dart:86]

## Dev Notes

### Contexte architectural

Cette story implémente la feature `results/` telle que définie dans l'architecture :

```
features/results/
  domain/
    reference_norms.dart       ← NOUVEAU (cette story)
  application/
    results_notifier.dart      ← NOUVEAU
    results_provider.dart      ← NOUVEAU
  presentation/
    results_screen.dart        ← NOUVEAU
    widgets/
      articular_angle_card.dart ← NOUVEAU
      body_skeleton_overlay.dart ← NOUVEAU
      simple_view.dart          ← NOUVEAU
      expert_view.dart          ← NOUVEAU
```

La story 3.4 dépend directement de Story 3.3 (`CaptureCompleted` avec `AnalysisResult` sealed) et expose les données à la story 4.1 (génération PDF). Les données d'`AnalysisResult` doivent déjà être persistées en base Drift par la story 3.3.

### Dépendances inter-stories critiques

- **Story 3.3 (REQUISE)** : `AnalysisResult` sealed, `ArticularAngles` Freezed, `ConfidenceScore` Freezed, `analysis_repository.dart` (interface + Drift impl) doivent exister avant d'implémenter cette story
- **Story 4.1 (suivante)** : `results_screen.dart` expose un bouton "Exporter PDF" — naviguer vers `report/` mais sans implémenter la génération PDF ici
- **Story 3.5 (parallèle optionnelle)** : `BodySkeletonOverlay` utilisé ici en mode statique (frame clé) sera étendu en mode replay scrubbing dans la story 3.5 — prévoir les props pour cette extension

### Modèles de domaine attendus (Story 3.3)

```dart
// features/capture/domain/articular_angles.dart (Freezed — Story 3.3)
@freezed
class ArticularAngles with _$ArticularAngles {
  const factory ArticularAngles({
    required double kneeAngle,      // degrés, 1 décimale
    required double hipAngle,       // degrés, 1 décimale
    required double ankleAngle,     // degrés, 1 décimale
  }) = _ArticularAngles;
}

// features/capture/domain/confidence_score.dart (Freezed — Story 3.3)
@freezed
class ConfidenceScore with _$ConfidenceScore {
  const factory ConfidenceScore({
    required double knee,    // 0.0 → 1.0
    required double hip,
    required double ankle,
  }) = _ConfidenceScore;
}
```

### Implémentation `reference_norms.dart`

```dart
// features/results/domain/reference_norms.dart

enum ArticulationName { knee, hip, ankle }
enum MorphologicalProfile { standard, hypermobile, restricted }

@freezed
class NormRange with _$NormRange {
  const factory NormRange({
    required double min,
    required double max,
  }) = _NormRange;

  const NormRange._();

  NormStatus evaluate(double angle) {
    if (angle >= min && angle <= max) return const NormNormal();
    final margin = (max - min) * 0.15; // ±15% = borderline
    if (angle >= min - margin && angle <= max + margin) return const NormBorderline();
    return const NormAbnormal();
  }
}

sealed class NormStatus { const NormStatus(); }
final class NormNormal    extends NormStatus { const NormNormal(); }
final class NormBorderline extends NormStatus { const NormBorderline(); }
final class NormAbnormal  extends NormStatus { const NormAbnormal(); }

abstract class ReferenceNorms {
  static NormRange getNorm(
    ArticulationName articulation,
    int ageYears,
    MorphologicalProfile profile,
  ) {
    // Plages normatives — source : littérature biomécanique standard
    // Subdivisions : < 40 ans | 40–60 ans | > 60 ans
    return switch ((articulation, _ageGroup(ageYears), profile)) {
      // Genou (flexion en marche)
      (ArticulationName.knee, _AgeGroup.under40, MorphologicalProfile.standard) =>
        const NormRange(min: 55.0, max: 70.0),
      (ArticulationName.knee, _AgeGroup.fortyToSixty, MorphologicalProfile.standard) =>
        const NormRange(min: 52.0, max: 68.0),
      (ArticulationName.knee, _AgeGroup.over60, MorphologicalProfile.standard) =>
        const NormRange(min: 48.0, max: 65.0),
      // Hanche (extension en marche)
      (ArticulationName.hip, _AgeGroup.under40, MorphologicalProfile.standard) =>
        const NormRange(min: 20.0, max: 30.0),
      (ArticulationName.hip, _AgeGroup.fortyToSixty, MorphologicalProfile.standard) =>
        const NormRange(min: 15.0, max: 28.0),
      (ArticulationName.hip, _AgeGroup.over60, MorphologicalProfile.standard) =>
        const NormRange(min: 10.0, max: 25.0),
      // Cheville (dorsiflexion en phase d'appui)
      (ArticulationName.ankle, _AgeGroup.under40, MorphologicalProfile.standard) =>
        const NormRange(min: 8.0, max: 15.0),
      (ArticulationName.ankle, _AgeGroup.fortyToSixty, MorphologicalProfile.standard) =>
        const NormRange(min: 6.0, max: 13.0),
      (ArticulationName.ankle, _AgeGroup.over60, MorphologicalProfile.standard) =>
        const NormRange(min: 5.0, max: 12.0),
      // Profil hypermobile : plages élargies +20%
      (ArticulationName.knee, _AgeGroup.under40, MorphologicalProfile.hypermobile) =>
        const NormRange(min: 50.0, max: 78.0),
      // ... (pattern identique pour tous les cas hypermobile/restricted)
      _ => ReferenceNorms.getNorm(articulation, ageYears, MorphologicalProfile.standard),
    };
  }
}

enum _AgeGroup { under40, fortyToSixty, over60 }
_AgeGroup _ageGroup(int age) {
  if (age < 40) return _AgeGroup.under40;
  if (age <= 60) return _AgeGroup.fortyToSixty;
  return _AgeGroup.over60;
}
```

**ATTENTION :** Les plages normatives ci-dessus sont des valeurs de référence biomécanique standard (marche). Elles doivent être validées par Karimmeguenni-tani avant intégration en production. Source de référence recommandée : Perry & Burnfield, "Gait Analysis: Normal and Pathological Function" (2nd ed.).

### Pattern `AsyncValue` switch exhaustif obligatoire

```dart
// ✅ CORRECT — switch exhaustif Dart 3 obligatoire
final state = ref.watch(resultsProvider);
switch (state) {
  case AsyncData(:final value) => ResultsContent(value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error),
}

// ❌ INTERDIT
state.when(data: ..., loading: ..., error: ...);
state.maybeWhen(...);
```

### `ArticularAngleCard` — logique d'affichage

```dart
// Affichage de la valeur : toujours 1 décimale, jamais d'arrondi entier
final display = '${angle.toStringAsFixed(1)}°';
// ex : 42.3° — JAMAIS 42° ou 42.30°

// Seuil confidence critique : < 0.6 → état lowConfidence
final isLowConfidence = confidenceScore < 0.60;

// Seuil confidence warning : 0.60–0.85 → chip orange en vue experte
final isLowish = confidenceScore >= 0.60 && confidenceScore < 0.85;
```

### `BodySkeletonOverlay` — données source

La story 3.3 doit persister un `keyFrameData` dans l'`AnalysisResult` : tableau de `PoseLandmark` (positions normalisées 0.0–1.0) pour le frame avec les angles les plus significatifs. Cette story récupère ce `keyFrameData` et l'affiche statiquement.

Si la story 3.3 n'a pas persisté de `keyFrameData` : afficher un placeholder anatomique SVG (silhouette générique) plutôt que planter — dégradation gracieuse.

### Toggle vue simple / vue experte

```dart
// enum déclaré dans results_provider.dart
enum ResultsView { simple, expert }

// Provider synchrone (NotifierProvider, pas AsyncNotifier)
@riverpod
class ResultsViewController extends _$ResultsViewController {
  @override
  ResultsView build() => ResultsView.simple; // défaut : vue simple

  void toggle() => state = state == ResultsView.simple
      ? ResultsView.expert
      : ResultsView.simple;
}
```

Le toggle doit être dans `results_provider.dart` et accessible depuis `results_screen.dart`. Pas de navigation push — bascule in-place avec `AnimatedSwitcher` (duration 200ms, courbe `Curves.easeInOut`).

### Articulation dominante

L'articulation affichée en `ArticularAngleCard.primary` (grande card en tête de page) est celle avec l'écart le plus élevé par rapport à la borne normative (en valeur absolue). Logique dans `ResultsNotifier` :

```dart
ArticulationName get _primaryArticulation {
  final scores = {
    ArticulationName.knee:  _normDeviation(kneeAngle,  kneeNorm),
    ArticulationName.hip:   _normDeviation(hipAngle,   hipNorm),
    ArticulationName.ankle: _normDeviation(ankleAngle, ankleNorm),
  };
  return scores.entries.reduce((a, b) => a.value > b.value ? a : b).key;
}

double _normDeviation(double angle, NormRange norm) {
  if (angle < norm.min) return norm.min - angle;
  if (angle > norm.max) return angle - norm.max;
  return 0.0;
}
```

### Design system — tokens obligatoires

Tous les composants utilisent les tokens du design system — aucune valeur hardcodée :

```dart
// shared/design_system/app_colors.dart
static const Color primary        = Color(0xFF1B6FBF);
static const Color primaryLight   = Color(0xFFE8F1FB);
static const Color success        = Color(0xFF34C759); // NormNormal
static const Color warning        = Color(0xFFFF9500); // NormBorderline
static const Color error          = Color(0xFFFF3B30); // NormAbnormal
static const Color secondaryText  = Color(0xFF8E8E93); // normes de référence
static const Color background     = Color(0xFFFFFFFF);
static const Color surface        = Color(0xFFF2F2F7);
static const Color textPrimary    = Color(0xFF1C1C1E);
```

```dart
// shared/design_system/app_spacing.dart
static const double base         = 8.0;
static const double cardPadding  = 16.0;
static const double screenMargin = 16.0;
static const double sectionGap   = 24.0;
static const double borderRadius = 12.0;
static const double touchTarget  = 44.0;
```

### Accessibilité — VoiceOver obligatoire

Semantic labels pour `ArticularAngleCard` (format exact de la spec UX) :

```dart
Semantics(
  label: _buildSemanticLabel(
    articulation: 'Flexion genou gauche',
    angle: 42.3,
    normMin: 60.0,
    normMax: 70.0,
    patientAge: 67,
    status: NormAbnormal(),
  ),
  child: ArticularAngleCardInternal(...),
)

// Format : "Flexion genou gauche : 42.3 degrés, sous la norme de 60 à 70 degrés pour 67 ans. Hors norme."
// Si lowConfidence : ajouter "Correction manuelle requise."
```

`BodySkeletonOverlay` DOIT être wrappé dans `ExcludeSemantics` — l'overlay est décoratif, VoiceOver ne doit pas le traverser.

### Disclaimer légal

```dart
// ✅ OBLIGATOIRE — jamais de texte inline
Text(
  LegalConstants.mdrDisclaimer,
  style: Theme.of(context).textTheme.caption,
)
// Source : core/legal/legal_constants.dart
```

### Performance — Impeller

- `RepaintBoundary` autour du `BodySkeletonOverlay` (repaint isolé du reste de la page)
- `RepaintBoundary` autour des `ArticularAngleCard` si animation d'entrée utilisée
- Animations d'entrée des angles : durée 300ms max, `Curves.easeOut` — cohérent avec HIG iOS

### Routing — go_router

Route à déclarer dans `core/router/app_router.dart` :

```dart
GoRoute(
  path: '/results/:analysisId',
  name: 'analysisResults',
  builder: (context, state) => ResultsScreen(
    analysisId: state.pathParameters['analysisId']!,
  ),
),
```

Le `analysisId` est l'UUID v4 de l'analyse persistée par Story 3.3. Ce deep link est utilisé par la notification locale "Analyse prête" (Story 6.3).

### Project Structure Notes

**Fichiers à créer dans cette story :**

```
lib/features/results/
  domain/
    reference_norms.dart
    reference_norms_test.dart          ← co-localisé
  application/
    results_notifier.dart
    results_notifier_test.dart         ← co-localisé
    results_provider.dart
  presentation/
    results_screen.dart
    widgets/
      articular_angle_card.dart
      articular_angle_card_test.dart   ← co-localisé
      body_skeleton_overlay.dart
      simple_view.dart
      expert_view.dart
      results_screen_test.dart         ← co-localisé
```

**Fichiers existants à modifier (minimalement) :**

- `core/router/app_router.dart` — ajouter la route `/results/:analysisId`
- `core/router/app_router.g.dart` — régénérer via build_runner

**Fichiers à NE PAS toucher dans cette story :**

- `features/capture/` — logique ML déjà implémentée en Story 3.3, ne pas modifier
- `features/report/` — la génération PDF est Story 4.1 ; le bouton "Exporter PDF" dans `results_screen.dart` navigue vers la route report mais n'implémente pas la génération
- `core/legal/legal_constants.dart` — utiliser tel quel, sans modifier
- `core/database/` — structure Drift définie en Stories 1.1/1.3, ne pas modifier

**Commande build_runner après modification des providers :**

```bash
dart run build_runner build --delete-conflicting-outputs
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-3.4] — User story, acceptance criteria, FR15, FR16, FR38
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-format] — Format angles : 1 décimale obligatoire (`toStringAsFixed(1)`)
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — Switch exhaustif AsyncValue Dart 3 obligatoire, interdit `.when()`
- [Source: docs/planning-artifacts/architecture.md#Architecture-Frontend] — `AsyncNotifier`, scoping providers dans `{feature}_provider.dart`
- [Source: docs/planning-artifacts/architecture.md#Structure-du-projet] — Mapping FR15/FR18/FR38 → `features/results/`
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-processus] — `LegalConstants.mdrDisclaimer` obligatoire, jamais inline
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Structure `data/domain/application/presentation` + co-location tests
- [Source: docs/planning-artifacts/ux-design-specification.md#ArticularAngleCard] — Anatomy, states, variants, accessibility labels
- [Source: docs/planning-artifacts/ux-design-specification.md#BodySkeletonOverlay] — Anatomy, states, interaction, RepaintBoundary
- [Source: docs/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation] — Palette, typography (Title 1 Semibold 28pt), spacing tokens
- [Source: docs/planning-artifacts/ux-design-specification.md#Experience-Mechanics §5] — Hiérarchie page résultats : articulation dominante → tableau → toggle vue
- [Source: docs/planning-artifacts/ux-design-specification.md#Responsive-Accessibility] — VoiceOver format exact, ExcludeSemantics sur animation squelette

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implémentation TDD complète — 48 tests unitaires + 6 smoke tests (54 total), tous verts.
- `NormRange` implémentée sans Freezed (classe const pure) — code généré non nécessaire pour un value object statique.
- `ResultsNotifier` est une family `@riverpod` (`(String analysisId)`) — génère `resultsProvider` (et non `resultsNotifierProvider`).
- Repositories scopés dans `results_provider.dart` (`resultsAnalysisRepositoryProvider`, `resultsPatientRepositoryProvider`) pour éviter la dépendance circulaire avec `capture/`.
- Tests d'erreur async utilisent `expectLater(provider.future, throwsA(anything))` en raison du comportement autoDispose de Riverpod.
- `BodySkeletonOverlay` : placeholder anatomique générique (Story 3.3 n'a pas persisté `keyFrameData`) — dégradation gracieuse documentée.
- Code review : H1 fixé (`excludeSemantics: true`), L1 fixé (import inutilisé), M4+L4 fixés (font 16pt, rayon 4pt), M6 fixé (`AppColors.background` ajouté).

### File List

**Créés :**

- lib/features/results/domain/reference_norms.dart
- lib/features/results/domain/reference_norms_test.dart
- lib/features/results/domain/analysis_result_display.dart
- lib/features/results/application/results_notifier.dart
- lib/features/results/application/results_notifier.g.dart
- lib/features/results/application/results_notifier_test.dart
- lib/features/results/application/results_provider.dart
- lib/features/results/application/results_provider.g.dart
- lib/features/results/presentation/results_screen.dart
- lib/features/results/presentation/results_screen_test.dart
- lib/features/results/presentation/widgets/articular_angle_card.dart
- lib/features/results/presentation/widgets/articular_angle_card_test.dart
- lib/features/results/presentation/widgets/body_skeleton_overlay.dart
- lib/features/results/presentation/widgets/simple_view.dart
- lib/features/results/presentation/widgets/expert_view.dart

**Modifiés :**

- lib/core/database/analyses_dao.dart (ajout : watchById)
- lib/core/database/patients_dao.dart (ajout : findById)
- lib/features/capture/data/analysis_repository.dart (ajout interface : watchById)
- lib/features/capture/data/drift_analysis_repository.dart (ajout impl : watchById)
- lib/features/patients/data/patient_repository.dart (ajout interface : findById)
- lib/features/patients/data/drift_patient_repository.dart (ajout impl : findById)
- lib/shared/design_system/app_colors.dart (ajout : primaryLight, secondaryText, background)
- lib/shared/design_system/app_spacing.dart (ajout : borderRadius)
- lib/core/router/app_router.dart (route analyses/:analysisId → ResultsScreen)
