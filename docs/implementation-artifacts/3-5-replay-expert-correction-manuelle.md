# Story 3.5 : Replay Expert & Correction Manuelle

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que praticien,
Je veux revoir l'analyse image par image avec les angles articulaires superposés, et corriger manuellement un point articulaire si la confiance ML est insuffisante,
Afin de valider ou corriger les résultats avant de générer le rapport.

## Acceptance Criteria

1. **Replay image par image** — Étant donné que je suis sur l'écran de résultats d'une analyse, quand j'accède au replay, alors la vidéo se joue image par image avec les angles articulaires superposés (FR18)
2. **Signalement visuel basse confiance** — Les articulations ayant un score ML < 60% sont visuellement signalées (points orange sur le `BodySkeletonOverlay`) pendant le replay
3. **Déclenchement correction manuelle** — Quand une articulation a une confiance ML insuffisante (`MLLowConfidence`), l'état `lowConfidence` de l'`ArticularAngleCard` s'affiche et un CTA "Corriger" est disponible
4. **Drag/tap pour repositionner** — Le praticien peut ajuster manuellement le point articulaire sur le frame en cours via drag ou tap sur la zone de l'articulation concernée
5. **Disclaimer dans le rapport** — Après correction manuelle, le rapport généré inclut explicitement : _"Données [articulation] : estimées — vérification manuelle effectuée."_ (FR17)
6. **Scrubber timeline** — Un slider Material 3 en bas du replay permet de naviguer frame par frame (scrubbing)
7. **Contrôles lecture** — Play/Pause, navigation frame précédent/suivant disponibles pendant le replay
8. **Pinch-to-zoom** — Le praticien peut zoomer sur la zone d'annotation pour affiner la correction
9. **Persistence de la correction** — Les corrections manuelles sont persistées dans la base Drift chiffrée via `DriftAnalysisRepository` en transaction atomique (NFR-R2)
10. **Aucun crash mémoire** — La navigation frame par frame ne déclenche pas de fuite mémoire (frames libérés après affichage)

## Tasks / Subtasks

- [ ] Task 1 — Créer `replay_viewer.dart` avec affichage image par image (AC: #1, #6, #7, #10)
  - [ ] Subtask 1.1 — Implémenter le widget `ReplayViewer` dans `features/results/presentation/widgets/replay_viewer.dart`
  - [ ] Subtask 1.2 — Intégrer le `BodySkeletonOverlay` en superposition sur chaque frame avec les points articulaires + labels angles
  - [ ] Subtask 1.3 — Implémenter le scrubber `Slider` Material 3 en bas du viewer (état `scrubbing`)
  - [ ] Subtask 1.4 — Ajouter contrôles Play/Pause + navigation frame précédent/suivant
  - [ ] Subtask 1.5 — Implémenter Pinch-to-zoom sur la zone d'annotation
  - [ ] Subtask 1.6 — Libérer les frames en mémoire après affichage (dispose + weak references)

- [ ] Task 2 — Implémenter le signalement visuel basse confiance dans `BodySkeletonOverlay` (AC: #2)
  - [ ] Subtask 2.1 — Colorer les points articulaires en orange (`#FF9500`) quand score ML < 60%
  - [ ] Subtask 2.2 — Afficher le badge "Confiance ML < 60% — Correction disponible" dans l'état `lowConfidence` de l'`ArticularAngleCard`

- [ ] Task 3 — Implémenter le déclenchement de la correction manuelle via `MLLowConfidence` (AC: #3, #4)
  - [ ] Subtask 3.1 — Dans `results_notifier.dart` / `capture_notifier.dart`, sur `MLLowConfidence`, passer l'`ArticularAngleCard` en état `lowConfidence` et rendre visible le bouton "Corriger"
  - [ ] Subtask 3.2 — Sur tap "Corriger", activer le mode édition sur le frame courant du `ReplayViewer`
  - [ ] Subtask 3.3 — Implémenter le `GestureDetector` permettant drag ou tap sur la zone articulaire pour repositionner le point
  - [ ] Subtask 3.4 — Recalculer l'angle articulaire après repositionnement du point et mettre à jour le label en temps réel

- [ ] Task 4 — Persister les corrections manuelles en base Drift (AC: #9)
  - [ ] Subtask 4.1 — Ajouter les champs `manualCorrectionApplied` (bool) et `manualCorrectionJoint` (String?) dans le modèle Freezed `Analysis` / `ArticularAngles`
  - [ ] Subtask 4.2 — Ajouter les colonnes correspondantes dans le DAO Drift `analysis_dao.dart`
  - [ ] Subtask 4.3 — Persister la correction via `DriftAnalysisRepository.saveCorrection()` dans une transaction Drift atomique
  - [ ] Subtask 4.4 — Relancer `dart run build_runner build --delete-conflicting-outputs` après modification des modèles Freezed et tables Drift

- [ ] Task 5 — Injecter le disclaimer dans le rapport (AC: #5)
  - [ ] Subtask 5.1 — Dans `pdf_generator.dart` (feature `report`), vérifier si `analysis.manualCorrectionApplied == true`
  - [ ] Subtask 5.2 — Si oui, ajouter la ligne _"Données [articulation] : estimées — vérification manuelle effectuée."_ dans la section métadonnées du rapport (en plus du `LegalConstants.mdrDisclaimer` permanent)

- [ ] Task 6 — Tests unitaires co-localisés (AC: tous)
  - [ ] Subtask 6.1 — `replay_viewer_test.dart` co-localisé dans `features/results/presentation/widgets/`
  - [ ] Subtask 6.2 — `results_notifier_test.dart` — vérifier transition vers `lowConfidence` sur `MLLowConfidence`
  - [ ] Subtask 6.3 — `drift_analysis_repository_test.dart` — vérifier persistance `manualCorrectionApplied`
  - [ ] Subtask 6.4 — `pdf_generator_test.dart` — vérifier présence du disclaimer de correction dans le PDF généré

## Dev Notes

### Vue d'ensemble fonctionnelle

Cette story couvre FR17 (correction manuelle d'un point articulaire) et FR18 (replay image par image avec angles superposés). Elle est le dernier maillon de l'Epic 3 avant la génération de rapport (Epic 4) : les données corrigées persistées ici alimentent `pdf_generator.dart`.

Le point d'entrée UI est l'`expert_view.dart` (story 3.4), qui expose le bouton "Replay expert". La navigation vers le replay se fait via go_router depuis `ResultsScreen` ou `expert_view.dart`.

### Architecture du `ReplayViewer`

Fichier cible : `lib/features/results/presentation/widgets/replay_viewer.dart`

Le `ReplayViewer` reçoit en entrée une liste de `AnalysisFrame` (frame décodé + poses détectées + scores de confiance par articulation). Il ne re-exécute pas le pipeline ML — les frames annotés sont produits par `ml_isolate_runner.dart` et stockés en mémoire dans le `ResultsNotifier` le temps de la session.

```dart
// Modèle de données pour chaque frame du replay
@freezed
class AnalysisFrame with _$AnalysisFrame {
  const factory AnalysisFrame({
    required int frameIndex,
    required ui.Image image,           // frame décodé — libéré après affichage
    required List<JointPose> joints,   // points articulaires ML Kit
    required ArticularAngles angles,   // angles calculés pour ce frame
    required ConfidenceScore confidence,
  }) = _AnalysisFrame;
}
```

Structure du widget :

```dart
class ReplayViewer extends ConsumerStatefulWidget {
  final List<AnalysisFrame> frames;
  final String analysisId; // pour persister la correction via le Repository

  // ...
}
```

États internes du viewer :

- `_currentFrameIndex` : frame affiché
- `_isPlaying` : lecture automatique active
- `_editingJoint` : JointType? — joint en cours de correction manuelle (null = pas en mode édition)

### Déclenchement `MLLowConfidence` → correction

La sealed class `MLLowConfidence` est définie dans `core/` ou `features/capture/domain/analysis_error.dart` :

```dart
final class MLLowConfidence extends AnalysisError {
  final double score;        // ex: 0.54 (54%)
  final JointType joint;     // articulation concernée
  const MLLowConfidence({required this.score, required this.joint});
}
```

Dans le `ResultsNotifier`, le switch exhaustif sur `AnalysisResult` doit capturer ce cas :

```dart
switch (result) {
  case AnalysisSuccess(:final angles) => // affichage normal
  case AnalysisFailure(:final error) => switch (error) {
    case MLLowConfidence(:final score, :final joint) =>
      // Passer l'ArticularAngleCard correspondante en état lowConfidence
      // + rendre disponible le CTA "Corriger" dans expert_view.dart
    case MLDetectionFailed() => // erreur non récupérable
    case VideoProcessingError() => // erreur technique
  }
}
```

Seuil de déclenchement : `score < 0.60` (< 60%) — cohérent avec UX spec et `ArticularAngleCard` state `lowConfidence`.

### Correction manuelle — interaction drag/tap

Lors de l'activation du mode édition (bouton "Corriger" tapé), `_editingJoint` est défini. Le `BodySkeletonOverlay` passe en mode édition pour ce joint :

```dart
// Dans BodySkeletonOverlay — mode édition
GestureDetector(
  onTapDown: (details) => _repositionJoint(details.localPosition),
  onPanUpdate: (details) => _repositionJoint(details.localPosition),
  child: CustomPaint(
    painter: SkeletonPainter(
      joints: frame.joints,
      editingJoint: widget.editingJoint,
      // point édité en surbrillance bleue #1B6FBF avec rayon 12pt
    ),
  ),
)
```

Après repositionnement :

1. Recalculer l'angle articulaire à partir de la nouvelle position du point
2. Mettre à jour le label de l'angle dans `BodySkeletonOverlay` en temps réel
3. Mettre à jour `ArticularAngles` dans le `ResultsNotifier` via `state.copyWith(...)`
4. Persister via `analysisRepository.saveManualCorrection(analysisId, joint, newPosition)`

### Champ `manualCorrectionApplied` dans le modèle `Analysis`

Le modèle Freezed `Analysis` (dans `features/capture/domain/analysis.dart`) doit être étendu :

```dart
@freezed
class Analysis with _$Analysis {
  const factory Analysis({
    required String id,
    required String patientId,
    required ArticularAngles angles,
    required ConfidenceScore confidence,
    required String createdAt,  // ISO 8601
    @Default(false) bool manualCorrectionApplied,
    String? manualCorrectionJoint,  // ex: "knee", "hip", "ankle"
  }) = _Analysis;
}
```

Colonne Drift correspondante dans `analysis_dao.dart` :

```dart
BoolColumn get manualCorrectionApplied =>
    boolean().withDefault(const Constant(false))();
TextColumn get manualCorrectionJoint =>
    text().nullable()();
```

ATTENTION : après modification du schéma Drift, relancer obligatoirement :

```bash
dart run build_runner build --delete-conflicting-outputs
```

Le MVP utilise `MigrationStrategy.recreateTablesOnSchemaChanges()` — les données de développement sont perdues. Acceptable pour le MVP.

### Injection du disclaimer dans `pdf_generator.dart`

Dans `features/report/data/pdf_generator.dart`, la logique de génération PDF doit vérifier la correction :

```dart
// Section métadonnées du rapport (en plus du LegalConstants.mdrDisclaimer permanent)
if (analysis.manualCorrectionApplied && analysis.manualCorrectionJoint != null) {
  final jointLabel = _localizedJointName(analysis.manualCorrectionJoint!);
  pdf.addText(
    'Données $jointLabel : estimées — vérification manuelle effectuée.',
    style: disclaimerStyle,  // caption 12pt, italic, #FF9500
  );
}
// LegalConstants.mdrDisclaimer est TOUJOURS présent sur chaque page — non conditionnel
```

INTERDIT : écrire le texte du disclaimer inline. Utiliser `LegalConstants.mdrDisclaimer` pour le disclaimer EU MDR permanent et la constante dédiée pour le disclaimer de correction manuelle.

Proposition de constante à ajouter dans `core/legal/legal_constants.dart` :

```dart
static String manualCorrectionDisclaimer(String jointName) =>
    'Données $jointName : estimées — vérification manuelle effectuée.';
```

### Gestion mémoire des frames

Les frames décodés (`ui.Image`) sont coûteux en mémoire. Stratégie obligatoire :

- Ne garder que le frame courant ± 2 frames en cache (fenêtre glissante)
- `dispose()` les `ui.Image` hors de la fenêtre
- Ne jamais stocker tous les frames simultanément en mémoire

```dart
// Dans _ReplayViewerState
void _updateFrameCache(int newIndex) {
  // Libérer les frames hors fenêtre [-2, +2]
  for (final frame in _cachedFrames.values) {
    if ((frame.frameIndex - newIndex).abs() > 2) {
      frame.image.dispose();
      _cachedFrames.remove(frame.frameIndex);
    }
  }
}
```

### Routing

Accès au replay depuis `ResultsScreen` via go_router. Ajouter la route dans `app_router.dart` :

```dart
GoRoute(
  path: '/results/:analysisId/replay',
  name: 'analysisReplay',
  builder: (context, state) {
    final analysisId = state.pathParameters['analysisId']!;
    return ReplayScreen(analysisId: analysisId);
  },
)
```

`ReplayScreen` est l'écran conteneur qui initialise les frames depuis le `ResultsNotifier` et les passe au `ReplayViewer`.

### Project Structure Notes

**Fichiers à créer :**

```
lib/features/results/presentation/
  widgets/
    replay_viewer.dart                  ← widget principal (cette story)
    replay_viewer_test.dart             ← test co-localisé
  replay_screen.dart                    ← écran conteneur (si non existant)

lib/features/capture/domain/
  analysis.dart                         ← ajouter manualCorrectionApplied + manualCorrectionJoint
  analysis.freezed.dart                 ← régénéré par build_runner

lib/features/capture/data/
  analysis_dao.dart                     ← ajouter colonnes manualCorrectionApplied + manualCorrectionJoint
  drift_analysis_repository.dart        ← ajouter saveManualCorrection()
  drift_analysis_repository_test.dart   ← test persistance correction

lib/features/report/data/
  pdf_generator.dart                    ← ajouter disclaimer correction manuelle
  pdf_generator_test.dart               ← tester présence disclaimer

lib/core/legal/
  legal_constants.dart                  ← ajouter manualCorrectionDisclaimer()

lib/core/router/
  app_router.dart                       ← ajouter route /results/:id/replay
  app_router.g.dart                     ← régénéré par build_runner
```

**Fichiers modifiés (non créés) :**

- `features/results/application/results_notifier.dart` — ajouter gestion `MLLowConfidence` + état correction
- `features/results/application/results_provider.dart` — ajouter provider pour correction si nécessaire
- `features/results/presentation/widgets/body_skeleton_overlay.dart` — mode édition + lowConfidence points orange
- `features/results/presentation/widgets/articular_angle_card.dart` — état `lowConfidence` + CTA "Corriger"
- `features/results/presentation/widgets/expert_view.dart` — bouton "Replay expert" + navigation vers ReplayScreen

**Fichiers à NE PAS toucher :**

- `features/capture/application/ml_isolate_runner.dart` — le pipeline ML est finalisé à la story 3.3
- `features/capture/application/capture_notifier.dart` — la capture est finalisée à la story 3.1/3.2
- `core/auth/biometric_guard.dart` — aucune modification de sécurité requise
- `core/database/app_database.dart` — modifications de schéma uniquement via le DAO

### Dépendances inter-stories

- **Dépend de Story 3.3** (`pipeline-ml-on-device-extraction-des-angles`) : les `AnalysisFrame` avec poses ML Kit et scores de confiance doivent être disponibles dans le `ResultsNotifier`. Cette story suppose que `MLLowConfidence` est déjà défini dans `analysis_error.dart`.
- **Dépend de Story 3.4** (`affichage-des-resultats-avec-normes-de-reference`) : `expert_view.dart`, `body_skeleton_overlay.dart` et `articular_angle_card.dart` doivent exister.
- **Alimente Story 4.1** (`generation-du-rapport-pdf-structure`) : le champ `analysis.manualCorrectionApplied` est consommé par `pdf_generator.dart`.

### Règles architecturales obligatoires

1. `switch` exhaustif obligatoire sur `AnalysisResult` / `AnalysisError` — pas de `if (error is MLLowConfidence)`
2. Persistance uniquement via `DriftAnalysisRepository.saveManualCorrection()` — jamais via le DAO directement depuis un Notifier
3. `LegalConstants.mdrDisclaimer` (disclaimer EU MDR permanent) et `LegalConstants.manualCorrectionDisclaimer(joint)` (disclaimer correction) sont les seules sources autorisées — zéro texte inline
4. Les frames `ui.Image` doivent être `dispose()`s — la vidéo ne doit pas occuper de mémoire persistante (NFR-S5 étendu à la session replay)
5. Providers déclarés dans `features/results/application/results_provider.dart` uniquement
6. Tests co-localisés avec les fichiers source — aucun dossier `test/` miroir

### Stack technique de référence

| Composant          | Version       | Usage dans cette story                                   |
| ------------------ | ------------- | -------------------------------------------------------- |
| Flutter + Impeller | 3.x / iOS 16+ | Animations replay fluides 58+ FPS                        |
| Riverpod           | 3.2.1         | `AsyncNotifier<ResultsState>` — état replay + correction |
| Freezed            | courante      | `AnalysisFrame`, extension `Analysis`                    |
| Drift + SQLCipher  | courantes     | Persistance `manualCorrectionApplied` chiffrée AES-256   |
| Google ML Kit      | courante      | Données de pose fournies par story 3.3                   |
| go_router          | 17.x          | Route `/results/:id/replay`                              |
| pdf                | courante      | Consommé par story 4.1 — disclaimer correction           |

### References

- [Source: docs/planning-artifacts/epics.md#Story 3.5] — Acceptance criteria et user story
- [Source: docs/planning-artifacts/epics.md#FR17] — Correction manuelle d'un point articulaire
- [Source: docs/planning-artifacts/epics.md#FR18] — Replay image par image avec angles superposés
- [Source: docs/planning-artifacts/architecture.md#Communication & Gestion des erreurs] — Sealed class `MLLowConfidence`, pattern switch exhaustif
- [Source: docs/planning-artifacts/architecture.md#Architecture Frontend (Flutter)] — Structure feature `results/`, Riverpod `AsyncNotifier`
- [Source: docs/planning-artifacts/architecture.md#Patterns d'Implémentation & Règles de Cohérence] — Anti-patterns, conventions nommage, co-location tests
- [Source: docs/planning-artifacts/architecture.md#Structure du Projet & Frontières Architecturales] — Arborescence `features/results/presentation/widgets/replay_viewer.dart`
- [Source: docs/planning-artifacts/architecture.md#Patterns de processus] — `LegalConstants.mdrDisclaimer`, disclaimer inline interdit
- [Source: docs/planning-artifacts/ux-design-specification.md#BodySkeletonOverlay] — States `scrubbing`, `lowConfidence`, interaction pinch-to-zoom, tap sur point articulaire
- [Source: docs/planning-artifacts/ux-design-specification.md#ArticularAngleCard] — State `lowConfidence` gris + label "Correction manuelle"
- [Source: docs/planning-artifacts/ux-design-specification.md#Patterns Spécifiques — Feedback Clinique] — Seuils confiance ML (> 85% / 60-85% / < 60%)
- [Source: docs/planning-artifacts/ux-design-specification.md#Responsive & Breakpoints] — iPad : 2 colonnes sur `AnalysisResultScreen` (liste + replay)
- [Source: docs/planning-artifacts/epics.md#NFR-R2] — Atomicité Drift pour la persistance correction
- [Source: docs/planning-artifacts/epics.md#NFR-S5] — Vidéo / frames jamais en mémoire persistante

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

Story 3.5 créée en mode #yolo. Analyse exhaustive des artefacts de planning effectuée. Guide développeur complet : `replay_viewer.dart` image par image avec `BodySkeletonOverlay`, déclenchement `MLLowConfidence` sealed error, correction drag/tap sur point articulaire, disclaimer "Données [articulation] : estimées — vérification manuelle effectuée." injecté dans `pdf_generator.dart`, persistance Drift chiffrée AES-256.

### File List

- `lib/features/results/presentation/widgets/replay_viewer.dart` (créer)
- `lib/features/results/presentation/widgets/replay_viewer_test.dart` (créer)
- `lib/features/results/presentation/replay_screen.dart` (créer si absent)
- `lib/features/capture/domain/analysis.dart` (modifier — champs correction)
- `lib/features/capture/domain/analysis.freezed.dart` (régénéré)
- `lib/features/capture/data/analysis_dao.dart` (modifier — colonnes correction)
- `lib/features/capture/data/drift_analysis_repository.dart` (modifier — saveManualCorrection)
- `lib/features/capture/data/drift_analysis_repository_test.dart` (modifier)
- `lib/features/report/data/pdf_generator.dart` (modifier — disclaimer correction)
- `lib/features/report/data/pdf_generator_test.dart` (modifier)
- `lib/core/legal/legal_constants.dart` (modifier — manualCorrectionDisclaimer)
- `lib/core/router/app_router.dart` (modifier — route replay)
- `lib/core/router/app_router.g.dart` (régénéré)
- `lib/features/results/application/results_notifier.dart` (modifier — MLLowConfidence)
- `lib/features/results/presentation/widgets/body_skeleton_overlay.dart` (modifier — mode édition)
- `lib/features/results/presentation/widgets/articular_angle_card.dart` (modifier — état lowConfidence + CTA)
- `lib/features/results/presentation/widgets/expert_view.dart` (modifier — bouton replay)
