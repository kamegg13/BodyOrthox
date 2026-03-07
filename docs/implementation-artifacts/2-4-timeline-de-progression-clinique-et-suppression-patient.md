# Story 2.4 : Timeline de Progression Clinique et Suppression Patient

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 2.4, Epic 2 (Gestion des Patients) -->

---

## Story

As a practitioner,
I want to visualize a patient's clinical progression over time and be able to delete a patient,
So that I can track treatment effectiveness and maintain data hygiene.

---

## Acceptance Criteria

**AC1 — Graphe temporel comparatif (FR5)**
**Given** un patient a 2+ analyses enregistrées
**When** j'accède à la vue timeline depuis la fiche patient
**Then** les angles articulaires (genou, hanche, cheville) sont affichés sur un graphe temporel comparatif
**And** l'axe X représente la date d'analyse (ISO 8601), l'axe Y représente la valeur en degrés (1 décimale)
**And** chaque articulation est représentée par une courbe ou une série de points distincts (couleurs cohérentes avec le design system)
**And** la plage de référence normative pour l'âge et le profil morphologique du patient est affichée en superposition (zone grisée ou trait en pointillé)

**AC2 — Navigation et lisibilité**
**When** le graphe contient plus de 5 analyses
**Then** l'axe X est scrollable horizontalement sans dégrader la lisibilité
**And** tapper un point du graphe affiche une info-bulle avec la date et les valeurs exactes de cette analyse
**And** je peux naviguer vers le détail de l'analyse correspondante en 1 tap depuis l'info-bulle

**AC3 — Suppression patient avec confirmation (FR6)**
**Given** je consulte la fiche d'un patient
**When** j'appuie sur "Supprimer ce patient"
**Then** une alerte de confirmation native iOS (CupertinoAlertDialog) s'affiche avec le message :
_"Supprimer [Nom du patient] ? Cette action est irréversible. Toutes les analyses associées seront définitivement supprimées."_
**And** l'action destructive est en rouge (style destructive de CupertinoAlertDialog)
**And** un bouton "Annuler" est visible et permet de revenir sans suppression

**AC4 — Suppression atomique en transaction Drift (NFR-R2, NFR-R5)**
**When** je confirme la suppression
**Then** le patient ET toutes ses analyses associées sont supprimés en une seule transaction Drift atomique
**And** si la transaction échoue (ex. erreur base), aucune donnée partielle n'est supprimée — l'état de la base reste cohérent
**And** aucune donnée orpheline ne subsiste : ni enregistrements `analyses`, ni `articular_angles` liés à ce patient_id

**AC5 — Navigation post-suppression**
**And** après suppression réussie, le praticien est redirigé vers la liste des patients
**And** le patient supprimé n'apparaît plus dans la liste
**And** le compteur freemium et l'historique d'abonnement ne sont PAS affectés par la suppression patient

**AC6 — Performance**
**And** le chargement des données pour le graphe respecte NFR-P6 (< 1 seconde pour 500 patients)
**And** le graphe s'affiche correctement pour une série de 5 000+ analyses sans dégradation (NFR-C2)

---

## Tasks / Subtasks

- [ ] **T1 — Modèle de domaine et repository** (AC: 1, 4)
  - [ ] T1.1 — Vérifier que `Patient` (Freezed) et `Analysis` (Freezed) sont bien définis dans stories 2.1/2.3 — ne PAS dupliquer
  - [ ] T1.2 — Ajouter dans `PatientRepository` la méthode `deleteWithAnalyses(PatientId id)` retournant `Future<void>`
  - [ ] T1.3 — Implémenter `DriftPatientRepository.deleteWithAnalyses` : utiliser `transaction(() async { ... })` Drift pour supprimer dans l'ordre : `articular_angles` WHERE `analysis_id IN (SELECT id FROM analyses WHERE patient_id = ?)`, puis `analyses` WHERE `patient_id = ?`, puis `patients` WHERE `id = ?`
  - [ ] T1.4 — Ajouter dans `AnalysisRepository` la méthode `watchByPatientId(PatientId id)` retournant `Stream<List<Analysis>>` pour alimenter le graphe
  - [ ] T1.5 — Écrire les tests unitaires `drift_patient_repository_test.dart` pour `deleteWithAnalyses` : cas succès (vérification aucune donnée orpheline), cas rollback si erreur simulée

- [ ] **T2 — Notifier timeline** (AC: 1, 2, 3, 5)
  - [ ] T2.1 — Créer `lib/features/patients/application/patient_timeline_notifier.dart` : `AsyncNotifier<List<Analysis>>`
  - [ ] T2.2 — Implémenter `build()` : subscribe au stream `watchByPatientId(patientId)` via `ref.watch(analysisRepositoryProvider)`
  - [ ] T2.3 — Créer `lib/features/patients/application/patient_delete_notifier.dart` : `AsyncNotifier<void>` avec méthode `deletePatient(PatientId id)`
  - [ ] T2.4 — Implémenter `deletePatient` : appeler `patientRepository.deleteWithAnalyses(id)`, puis sur succès invalider les providers patients et naviguer vers la liste
  - [ ] T2.5 — Déclarer les providers dans `lib/features/patients/application/patients_provider.dart` (avec les providers existants des stories précédentes)
  - [ ] T2.6 — Écrire `patient_timeline_notifier_test.dart` et `patient_delete_notifier_test.dart` avec mocktail

- [ ] **T3 — Widget graphe temporel** (AC: 1, 2)
  - [ ] T3.1 — Créer `lib/features/patients/presentation/widgets/clinical_progression_chart.dart`
  - [ ] T3.2 — Utiliser `fl_chart` (package Flutter) pour le rendu du graphe linéaire — **NE PAS** implémenter de renderer custom (bundle size et complexité inutiles)
  - [ ] T3.3 — Mapper `List<Analysis>` → `List<FlSpot>` pour chaque articulation (genou → `kneeAngle`, hanche → `hipAngle`, cheville → `ankleAngle`)
  - [ ] T3.4 — Configurer les couleurs : genou = `AppColors.primary`, hanche = `AppColors.success`, cheville = `AppColors.warning` (palette design system)
  - [ ] T3.5 — Afficher la zone normative de référence (`ReferenceNorms` depuis `features/results/domain/reference_norms.dart`) en `BarAreaData` grisé
  - [ ] T3.6 — Implémenter le callback `LineTouchCallback` pour afficher l'info-bulle (date formatée + valeurs articulaires)
  - [ ] T3.7 — Ajouter `GestureDetector` sur l'info-bulle pour naviguer vers `ResultsScreen` avec l'ID d'analyse correspondant

- [ ] **T4 — Écran timeline** (AC: 1, 2)
  - [ ] T4.1 — Créer `lib/features/patients/presentation/patient_timeline_screen.dart`
  - [ ] T4.2 — Intégrer `ClinicalProgressionChart` avec un `ConsumerWidget` qui observe `patientTimelineProvider(patientId)`
  - [ ] T4.3 — Gérer les états AsyncValue avec switch exhaustif Dart 3 : loading → `LoadingSpinner`, error → widget d'erreur avec retry, data → `ClinicalProgressionChart`
  - [ ] T4.4 — Gérer le cas 0 ou 1 analyse : afficher message contextuel "Ajoutez au moins 2 analyses pour visualiser la progression"
  - [ ] T4.5 — Layout adaptatif : sur iPad (`context.isTablet`), afficher graphe en vue split (liste analyses à gauche, graphe à droite) — sur iPhone, graphe plein écran scrollable

- [ ] **T5 — UI suppression patient** (AC: 3, 4, 5)
  - [ ] T5.1 — Ajouter bouton "Supprimer ce patient" dans `patient_detail_screen.dart` (existant depuis story 2.3) — style danger, icône `CupertinoIcons.trash`
  - [ ] T5.2 — Au tap, afficher `CupertinoAlertDialog` avec texte de confirmation formaté avec le nom du patient
  - [ ] T5.3 — Action "Supprimer" : style `isDestructiveAction: true` (rouge iOS natif)
  - [ ] T5.4 — Sur confirmation, appeler `ref.read(patientDeleteProvider.notifier).deletePatient(patientId)`
  - [ ] T5.5 — Pendant la suppression, afficher un indicateur de chargement (désactiver le bouton pour éviter double-tap)
  - [ ] T5.6 — Sur succès, naviguer vers `PatientsScreen` via `context.go('/patients')` (go_router)
  - [ ] T5.7 — Sur erreur, afficher un `CupertinoAlertDialog` d'erreur avec message "Suppression impossible. Réessayez."

- [ ] **T6 — Routing** (AC: 2, 5)
  - [ ] T6.1 — Ajouter la route `/patients/:patientId/timeline` dans `app_router.dart`
  - [ ] T6.2 — Ajouter navigation depuis `patient_detail_screen.dart` vers la timeline (bouton ou onglet)
  - [ ] T6.3 — Vérifier que la navigation deep link depuis une info-bulle du graphe vers `ResultsScreen` fonctionne via `/results/:analysisId`

- [ ] **T7 — Dépendance fl_chart** (AC: 1)
  - [ ] T7.1 — Ajouter `fl_chart: ^0.69.0` (ou dernière stable) dans `pubspec.yaml`
  - [ ] T7.2 — Exécuter `flutter pub get` et vérifier l'absence de conflits
  - [ ] T7.3 — Vérifier que le bundle size reste < 150 MB (NFR-C4) — fl_chart est une lib Dart pure, pas d'impact natif

- [ ] **T8 — Validation finale**
  - [ ] T8.1 — `flutter test` : tous les tests patients passent
  - [ ] T8.2 — `flutter analyze` : 0 erreurs, 0 warnings
  - [ ] T8.3 — Test manuel : créer patient → ajouter 3 analyses manuelles en DB → vérifier graphe cohérent
  - [ ] T8.4 — Test suppression : vérifier via DB inspector (flavor dev, SQLite non-chiffré) qu'aucune ligne orpheline ne subsiste après suppression

---

## Dev Notes

### Contexte critique de la story

Cette story est **la dernière de l'Epic 2**. Elle dépend des entités `Patient`, `Analysis` et `ArticularAngles` créées dans les stories 2.1, 2.2 et 2.3. Le schéma Drift doit être considéré comme stable à ce stade.

La story comporte **deux fonctionnalités distinctes** intentionnellement groupées car elles partagent le même contexte (vue fiche patient détaillée) :

1. La visualisation graphique de la progression (lecture)
2. La suppression irréversible avec cascade (écriture destructive)

### Transaction Drift atomique — cascade delete (NFR-R2)

C'est le point architecturalement critique de cette story. La suppression doit être **strictement atomique**.

**Schéma de la transaction obligatoire :**

```dart
// lib/features/patients/data/drift_patient_repository.dart

@override
Future<void> deleteWithAnalyses(PatientId id) async {
  await _db.transaction(() async {
    // 1. Récupérer les IDs des analyses du patient
    final analysisIds = await (_db.select(_db.analyses)
      ..where((a) => a.patientId.equals(id.value)))
      .map((a) => a.id)
      .get();

    // 2. Supprimer les données articulaires liées (évite données orphelines)
    if (analysisIds.isNotEmpty) {
      await (_db.delete(_db.articularAngles)
        ..where((aa) => aa.analysisId.isIn(analysisIds)))
        .go();
    }

    // 3. Supprimer les analyses
    await (_db.delete(_db.analyses)
      ..where((a) => a.patientId.equals(id.value)))
      .go();

    // 4. Supprimer le patient
    await (_db.delete(_db.patients)
      ..where((p) => p.id.equals(id.value)))
      .go();
  });
}
```

**Garantie :** Si n'importe quelle étape lève une exception, Drift rollback automatiquement l'ensemble de la transaction. Aucune donnée partielle ne peut subsister.

**Note sur les index :** L'index `idx_analyses_patient` sur `analyses(patient_id, created_at DESC)` (défini en Story 1.3) accélère la sélection des analyses à supprimer.

### Graphe temporel — choix de librairie

**Utiliser `fl_chart`** — c'est la librairie de graphes Flutter la plus mature et maintenue (pub.dev : 10k+ likes, MIT license, Dart pure sans dépendances natives).

**Ne PAS utiliser :**

- `charts_flutter` (Google) — déprécié depuis 2022
- `syncfusion_flutter_charts` — licence commerciale, bundle lourd
- Implémentation custom Canvas — inutilement complexe pour ce cas d'usage

**Mapping données → graphe :**

```dart
// lib/features/patients/presentation/widgets/clinical_progression_chart.dart

List<FlSpot> _toFlSpots(List<Analysis> analyses, double Function(Analysis) angleSelector) {
  // Trier par date croissante
  final sorted = [...analyses]..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  return sorted.asMap().entries.map((e) {
    return FlSpot(e.key.toDouble(), angleSelector(e.value));
  }).toList();
}

// Usage :
LineChartBarData(
  spots: _toFlSpots(analyses, (a) => a.articularAngles.kneeAngle),
  color: AppColors.primary,
  dotData: const FlDotData(show: true),
  isCurved: true,
),
```

**Affichage des dates sur l'axe X :**

```dart
// Utiliser bottomTitles avec getTitlesWidget
AxisTitles(
  sideTitles: SideTitles(
    showTitles: true,
    getTitlesWidget: (value, meta) {
      final index = value.toInt();
      if (index >= 0 && index < sortedAnalyses.length) {
        final date = DateTime.parse(sortedAnalyses[index].createdAt);
        return Text('${date.day}/${date.month}', style: const TextStyle(fontSize: 10));
      }
      return const SizedBox.shrink();
    },
  ),
),
```

### Zone normative de référence

La classe `ReferenceNorms` (définie dans `lib/features/results/domain/reference_norms.dart` — Story 3.4) fournit les plages normatives par âge et profil morphologique. Cette story en a besoin pour l'affichage du contexte clinique.

**Pattern d'accès (cross-feature, lecture seule) :**

```dart
// Accès direct au domain model — PAS d'accès via le repository results
// (ReferenceNorms est une donnée statique de référence, pas une entité DB)
import 'package:bodyorthox/features/results/domain/reference_norms.dart';

final norms = ReferenceNorms.forProfile(
  ageYears: patient.ageYears,
  morphologicalProfile: patient.morphologicalProfile,
);
```

**Si Story 3.4 n'est pas encore implémentée :** créer un stub `ReferenceNorms` minimal dans `lib/features/results/domain/reference_norms.dart` avec des plages hardcodées temporaires. Ne PAS bloquer la story 2.4 sur l'implémentation complète des normes.

### Confirmation suppression — UX anti-pattern à éviter

L'architecture UX (doc UX spec) note : pas de confirmation "Êtes-vous sûr ?" pour les actions réversibles. Mais la suppression patient est **irréversible** — la confirmation est donc **obligatoire** et correcte ici.

**Formulation correcte :**

```dart
showCupertinoDialog(
  context: context,
  builder: (_) => CupertinoAlertDialog(
    title: const Text('Supprimer ce patient ?'),
    content: Text(
      'Cette action est irréversible. '
      '${patient.name} et toutes ses analyses associées '
      'seront définitivement supprimées.',
    ),
    actions: [
      CupertinoDialogAction(
        onPressed: () => Navigator.pop(context),
        child: const Text('Annuler'),
      ),
      CupertinoDialogAction(
        isDestructiveAction: true, // Rouge iOS natif
        onPressed: () {
          Navigator.pop(context);
          ref.read(patientDeleteProvider.notifier).deletePatient(patient.id);
        },
        child: const Text('Supprimer'),
      ),
    ],
  ),
);
```

### AsyncValue — switch exhaustif obligatoire

```dart
// ✅ CORRECT — switch exhaustif Dart 3
switch (timelineState) {
  case AsyncData(:final value) when value.length < 2 =>
    const _EmptyTimelineMessage(),
  case AsyncData(:final value) =>
    ClinicalProgressionChart(analyses: value, patient: patient),
  case AsyncLoading() =>
    const Center(child: LoadingSpinner()),
  case AsyncError(:final error, :final stackTrace) =>
    _TimelineErrorWidget(error: error, onRetry: () => ref.invalidate(patientTimelineProvider)),
}

// ❌ INTERDIT
timelineState.when(data: ..., loading: ..., error: ...);
```

### Interdiction d'accès DAO direct

```dart
// ❌ INTERDIT — accès DAO direct depuis le Notifier
await ref.read(driftDbProvider).patientDao.delete(id);

// ✅ CORRECT — via Repository
await ref.read(patientRepositoryProvider).deleteWithAnalyses(id);
```

### Accès base de données — flavor dev

Pour vérifier l'absence de données orphelines après suppression en flavor dev, utiliser **DB Browser for SQLite** sur le fichier SQLite non-chiffré (`AppConfig.dev().useEncryptedDatabase == false`). Le chemin du fichier DB est accessible via `getDatabasesPath()` du package `path_provider`.

### Structure des fichiers à créer dans cette story

```
lib/features/patients/
├── data/
│   ├── patient_repository.dart              # Ajouter deleteWithAnalyses() — modifié
│   ├── drift_patient_repository.dart        # Implémenter deleteWithAnalyses() — modifié
│   ├── patient_repository_test.dart         # Ajouter tests deleteWithAnalyses — modifié
│   └── drift_patient_repository_test.dart   # Ajouter tests transaction — modifié
├── application/
│   ├── patient_timeline_notifier.dart       # CRÉER
│   ├── patient_timeline_notifier_test.dart  # CRÉER
│   ├── patient_delete_notifier.dart         # CRÉER
│   ├── patient_delete_notifier_test.dart    # CRÉER
│   └── patients_provider.dart              # Ajouter nouveaux providers — modifié
└── presentation/
    ├── patient_detail_screen.dart           # Ajouter bouton suppression + lien timeline — modifié
    ├── patient_timeline_screen.dart         # CRÉER
    └── widgets/
        └── clinical_progression_chart.dart  # CRÉER
```

**Fichiers à modifier dans d'autres features :**

- `lib/features/capture/data/analysis_repository.dart` — ajouter `watchByPatientId(PatientId id)` si non présent
- `lib/core/router/app_router.dart` — ajouter route `/patients/:patientId/timeline`

### Project Structure Notes

**Alignement avec la structure Feature-First :**
Tous les fichiers respectent `data/domain/application/presentation`. Pas de déviation.

**Tests co-localisés obligatoires :**

```
lib/features/patients/data/drift_patient_repository_test.dart  ← co-localisé ✅
lib/features/patients/application/patient_timeline_notifier_test.dart  ← co-localisé ✅
```

Interdit : créer un dossier `test/` séparé miroir.

**Dépendance fl_chart — ajout dans pubspec.yaml :**

```yaml
# Graphes cliniques (Story 2.4)
fl_chart: ^0.69.0 # Dart pure — pas d'impact iOS natif
```

### Préoccupations potentielles

1. **Story 3.4 non encore implémentée** — `ReferenceNorms` peut ne pas exister encore. Solution : créer le stub comme indiqué ci-dessus. La story 2.4 ne doit pas être bloquée.

2. **`ArticularAngles` table** — Si la table `articular_angles` n'est pas encore définie dans `app_database.dart` (elle est attendue en Epic 3), la transaction de suppression cascade devra être adaptée pour ne supprimer que `analyses` et `patients` dans un premier temps. Documenter ce choix dans les Completion Notes.

3. **`Analysis` inclut-il `ArticularAngles` directement ?** — Selon l'architecture, `articular_angles` est une table séparée reliée par `analysis_id`. Si dans la Story 2.3 les angles sont stockés directement en JSON dans `analyses`, la cascade delete T1.3 n'a pas besoin du step "supprimer articular_angles". Vérifier le schéma Drift existant avant d'implémenter.

4. **Performance graphe iOS** — Impeller est actif sur iOS 16+ ; les animations fl_chart seront fluides. Aucune optimisation spécifique requise pour les cas normaux (< 100 analyses). Si le nombre d'analyses dépasse 200, envisager un sous-échantillonnage des points (garder 1 point tous les N analyses) pour la lisibilité.

---

### References

- [Source: docs/planning-artifacts/epics.md#Story-2.4] — User story, Acceptance Criteria, FR5, FR6, NFR-R2
- [Source: docs/planning-artifacts/architecture.md#Architecture-des-données] — Transactions Drift, NativeDatabase.createInBackground
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Structure feature-first data/domain/application/presentation
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — Switch exhaustif AsyncValue, interdiction AsyncValue.when
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites] — Interdiction DAO direct depuis Notifier
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-format] — Dates ISO 8601, IDs UUID v4, angles en degrés 1 décimale
- [Source: docs/planning-artifacts/architecture.md#Structure-du-Projet-Frontières-Architecturales] — Mapping FR1-FR6 → `features/patients/`, index idx_analyses_patient
- [Source: docs/planning-artifacts/architecture.md#Analyse-des-écarts-résolus] — Index Drift idx_analyses_patient
- [Source: docs/planning-artifacts/ux-design-specification.md] — Palette AppColors, Clinical White direction, Touch targets 44×44pt
- [Source: docs/planning-artifacts/ux-design-specification.md#UX-Patterns] — Confirmation suppression irréversible (action destructive)
- [Source: docs/planning-artifacts/epics.md#NonFunctional-Requirements] — NFR-P6 (< 1s patients), NFR-R2 (atomicité), NFR-R5 (cohérence), NFR-C2 (5000+ analyses)
- [Source: docs/implementation-artifacts/1-1-initialisation-du-projet-infrastructure-technique.md] — pubspec.yaml, stack dépendances, app_colors.dart, conventions

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

- `lib/features/patients/data/patient_repository.dart` — modified (ajout deleteWithAnalyses)
- `lib/features/patients/data/drift_patient_repository.dart` — modified (implémentation transaction cascade)
- `lib/features/patients/data/drift_patient_repository_test.dart` — modified (tests transaction)
- `lib/features/patients/application/patient_timeline_notifier.dart` — created
- `lib/features/patients/application/patient_timeline_notifier_test.dart` — created
- `lib/features/patients/application/patient_delete_notifier.dart` — created
- `lib/features/patients/application/patient_delete_notifier_test.dart` — created
- `lib/features/patients/application/patients_provider.dart` — modified (nouveaux providers)
- `lib/features/patients/presentation/patient_timeline_screen.dart` — created
- `lib/features/patients/presentation/patient_detail_screen.dart` — modified (bouton suppression + lien timeline)
- `lib/features/patients/presentation/widgets/clinical_progression_chart.dart` — created
- `lib/core/router/app_router.dart` — modified (route /patients/:patientId/timeline)
- `pubspec.yaml` — modified (ajout fl_chart)
