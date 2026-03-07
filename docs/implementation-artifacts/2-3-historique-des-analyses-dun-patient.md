# Story 2.3 : Historique des Analyses d'un Patient

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 2.3, Epic 2 (Gestion des Patients) -->

---

## Story

As a practitioner,
I want to view the complete history of analyses for a patient,
So that I can track changes over time and prepare for a consultation with full context.

---

## Acceptance Criteria

**AC1 — Liste chronologique décroissante**
**Given** un patient a au moins une analyse enregistrée
**When** j'ouvre la fiche patient (`PatientDetailScreen`)
**Then** toutes ses analyses sont listées par ordre chronologique décroissant (la plus récente en premier), portées par l'index Drift `idx_analyses_patient` sur `(patient_id, created_at DESC)`

**AC2 — Contenu de chaque entrée**
**And** chaque `PatientHistoryTile` affiche :

- la date de l'analyse au format lisible (ex. : "5 mars 2026 à 14:30")
- les angles principaux : genou, hanche, cheville en degrés (1 décimale, ex. : "42.3°")
- le score de confiance ML global (ex. : "Confiance : 94%")

**AC3 — Performance NFR-C2**
**And** la liste se charge et défile sans dégradation visible pour 5 000+ analyses stockées (NFR-C2) — aucun lag UI perceptible sur iPhone 12+

**AC4 — État vide**
**Given** un patient n'a aucune analyse enregistrée
**When** j'ouvre sa fiche patient
**Then** un état vide est affiché avec un message invitant à lancer la première analyse

**AC5 — Navigation vers le résultat**
**When** je tape sur une entrée de l'historique
**Then** je suis navigué vers l'écran de résultats de cette analyse spécifique (`ResultsScreen`)

---

## Tasks / Subtasks

- [ ] **T1 — Schéma Drift & index `idx_analyses_patient`** (AC: 1, 3)
  - [ ] T1.1 — Vérifier que la table `analyses` est bien définie dans `lib/core/database/app_database.dart` avec les colonnes : `id TEXT PK`, `patient_id TEXT`, `created_at TEXT (ISO 8601)`, `knee_angle REAL`, `hip_angle REAL`, `ankle_angle REAL`, `confidence_score REAL`
  - [ ] T1.2 — Ajouter l'index `Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)')` dans `allSchemaEntities` si absent
  - [ ] T1.3 — Régénérer avec `dart run build_runner build --delete-conflicting-outputs`
  - [ ] T1.4 — Vérifier que l'index est effectif via `EXPLAIN QUERY PLAN SELECT * FROM analyses WHERE patient_id = ? ORDER BY created_at DESC`

- [ ] **T2 — Modèle de domaine `Analysis`** (AC: 1, 2)
  - [ ] T2.1 — Créer ou compléter `lib/features/capture/domain/analysis.dart` (Freezed) :
    ```dart
    @freezed
    class Analysis with _$Analysis {
      const factory Analysis({
        required String id,
        required String patientId,
        required DateTime createdAt,
        required double kneeAngle,
        required double hipAngle,
        required double ankleAngle,
        required double confidenceScore, // 0.0 → 1.0
      }) = _Analysis;
    }
    ```
  - [ ] T2.2 — Régénérer le code Freezed

- [ ] **T3 — DAO `AnalysisDao`** (AC: 1, 3)
  - [ ] T3.1 — Créer `lib/features/capture/data/analysis_dao.dart` avec la méthode :
    ```dart
    Stream<List<AnalysisData>> watchAnalysesForPatient(String patientId);
    // Requête : SELECT * FROM analyses WHERE patient_id = ? ORDER BY created_at DESC
    ```
  - [ ] T3.2 — S'assurer que la requête exploite bien `idx_analyses_patient`

- [ ] **T4 — Repository `AnalysisRepository`** (AC: 1, 3, 5)
  - [ ] T4.1 — Ajouter la méthode à l'interface `lib/features/capture/data/analysis_repository.dart` :
    ```dart
    Stream<List<Analysis>> watchAnalysesForPatient(String patientId);
    ```
  - [ ] T4.2 — Implémenter dans `lib/features/capture/data/drift_analysis_repository.dart` en délégant au DAO

- [ ] **T5 — `AnalysisHistoryNotifier`** (AC: 1, 3, 4)
  - [ ] T5.1 — Créer `lib/features/patients/application/analysis_history_notifier.dart` :
    ```dart
    @riverpod
    class AnalysisHistoryNotifier extends _$AnalysisHistoryNotifier {
      @override
      Stream<List<Analysis>> build(String patientId) {
        return ref.read(analysisRepositoryProvider).watchAnalysesForPatient(patientId);
      }
    }
    ```
  - [ ] T5.2 — Déclarer le provider dans `lib/features/patients/application/patients_provider.dart`
  - [ ] T5.3 — Écrire les tests unitaires dans `lib/features/patients/application/analysis_history_notifier_test.dart` avec `mocktail` + `riverpod_test`

- [ ] **T6 — Widget `PatientHistoryTile`** (AC: 2, 5)
  - [ ] T6.1 — Créer `lib/features/patients/presentation/widgets/patient_history_tile.dart`
  - [ ] T6.2 — Afficher : date formatée, angles (genou, hanche, cheville) avec unité "°", score de confiance en pourcentage
  - [ ] T6.3 — Touch target ≥ 44×44pt, `InkWell` avec `onTap` → navigation `ResultsScreen`
  - [ ] T6.4 — Respecter la palette : texte secondaire `#8E8E93` (iOS systemGray), valeurs numériques en `Title 3 Semibold` (#1C1C1E)

- [ ] **T7 — `PatientDetailScreen`** (AC: 1, 2, 3, 4, 5)
  - [ ] T7.1 — Créer `lib/features/patients/presentation/patient_detail_screen.dart`
  - [ ] T7.2 — Utiliser `ConsumerWidget`, consumer de `analysisHistoryNotifierProvider(patientId)`
  - [ ] T7.3 — Implémenter le switch exhaustif sur `AsyncValue` :
    ```dart
    switch (state) {
      case AsyncData(:final value) => value.isEmpty
          ? const _EmptyHistoryView()
          : ListView.builder(itemBuilder: (ctx, i) => PatientHistoryTile(analysis: value[i])),
      case AsyncLoading()          => const LoadingSpinner(),
      case AsyncError(:final error) => ErrorWidget(error),
    }
    ```
  - [ ] T7.4 — `CupertinoNavigationBar` avec titre = nom du patient, bouton "Nouvelle analyse" en `trailingWidget`
  - [ ] T7.5 — Implémenter `_EmptyHistoryView` : icône, message "Aucune analyse pour ce patient", bouton "Lancer la première analyse"

- [ ] **T8 — Route go_router** (AC: 5)
  - [ ] T8.1 — Ajouter la route `/patients/:patientId` → `PatientDetailScreen` dans `lib/core/router/app_router.dart`
  - [ ] T8.2 — Ajouter la route `/patients/:patientId/analyses/:analysisId` → `ResultsScreen` (deep link depuis tap sur une entrée)
  - [ ] T8.3 — Vérifier que la protection biométrique `biometric_guard.dart` s'applique à ces routes

- [ ] **T9 — Tests** (AC: 1, 2, 3, 4)
  - [ ] T9.1 — Tests unitaires `AnalysisHistoryNotifier` : liste vide, liste avec n analyses, ordre chronologique décroissant, gestion erreur
  - [ ] T9.2 — Tests widget `PatientHistoryTile` : formatage date, affichage angles, score de confiance, tap → navigation
  - [ ] T9.3 — Tests widget `PatientDetailScreen` : état vide, état chargé (mock analyses), état erreur

- [ ] **T10 — Validation finale**
  - [ ] T10.1 — `flutter analyze` : 0 erreur, 0 warning
  - [ ] T10.2 — `flutter test` : tous les tests passent
  - [ ] T10.3 — Vérification manuelle sur simulateur : liste affichée, scroll fluide, tap → résultat

---

## Dev Notes

### Contexte de la Story

Cette story est la **troisième story de l'Epic 2 (Gestion des Patients)**. Elle construit sur :

- **Story 2.1** (Créer un Profil Patient) : la table `patients` et le modèle `Patient` Freezed existent
- **Story 2.2** (Liste des Patients) : `PatientsScreen`, `PatientsNotifier`, `patient_repository.dart` existent

Elle prépare :

- **Story 2.4** (Timeline + Suppression) : la timeline réutilisera `watchAnalysesForPatient`
- **Story 3.x** (Capture) : `DriftAnalysisRepository` sera complété avec les méthodes d'écriture

**Dépendance critique :** Les analyses sont créées par les stories de l'Epic 3. Pour tester cette story sans Epic 3 complété, des données de test doivent être insérées manuellement en base via le flavor dev (SQLite non chiffré autorisé en dev).

---

### Composant central : `AnalysisHistoryNotifier`

Le Notifier **ne doit PAS** accéder au DAO directement. Il passe **obligatoirement** par le Repository :

```dart
// lib/features/patients/application/analysis_history_notifier.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../capture/data/analysis_repository.dart';
import '../../capture/domain/analysis.dart';

part 'analysis_history_notifier.g.dart';

@riverpod
class AnalysisHistoryNotifier extends _$AnalysisHistoryNotifier {
  @override
  Stream<List<Analysis>> build(String patientId) {
    // Via repository UNIQUEMENT — jamais de DAO direct
    return ref.read(analysisRepositoryProvider).watchAnalysesForPatient(patientId);
  }
}
```

**Anti-pattern à bannir :**

```dart
// ❌ INTERDIT — accès DAO direct depuis le Notifier
ref.read(driftDbProvider).analysisDao.watchAnalysesForPatient(patientId);
```

---

### Index Drift obligatoire

L'index `idx_analyses_patient` est **le levier de performance critique** pour NFR-C2 (5 000+ analyses sans dégradation). Il doit être déclaré dans `app_database.dart` :

```dart
// lib/core/database/app_database.dart

@override
List<DatabaseSchemaEntity> get allSchemaEntities => [
  patients,
  analyses,
  // ... autres tables
  Index('idx_patients_name', 'patients (name)'),       // Story 2.2 — déjà présent
  Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)'), // ← CRITIQUE Story 2.3
];
```

**Pourquoi `created_at DESC` dans l'index ?** L'index composite couvre à la fois le filtre `WHERE patient_id = ?` ET le tri `ORDER BY created_at DESC`, évitant un tri en mémoire sur 5 000+ lignes.

**Stratégie de migration MVP :** `MigrationStrategy.recreateTablesOnSchemaChanges()` — acceptable en développement. La migration manuelle versionnée sera introduite en Phase 2.

---

### Schéma Drift — Table `analyses`

La table doit avoir ces colonnes minimales pour cette story :

```dart
class Analyses extends Table {
  TextColumn get id => text()();
  TextColumn get patientId => text().references(Patients, #id)();
  TextColumn get createdAt => text()(); // ISO 8601 : '2026-03-05T14:30:00Z'
  RealColumn get kneeAngle => real()();   // degrés, 1 décimale
  RealColumn get hipAngle => real()();    // degrés, 1 décimale
  RealColumn get ankleAngle => real()();  // degrés, 1 décimale
  RealColumn get confidenceScore => real()(); // 0.0 → 1.0

  @override
  Set<Column> get primaryKey => {id};
}
```

**Règles de format :**

- `createdAt` : ISO 8601 string **obligatoire** (`'2026-03-05T14:30:00Z'`) — jamais Unix timestamp entier
- `id` : UUID v4 string (`const Uuid().v4()`) — généré côté Dart, jamais AUTOINCREMENT SQL
- Angles : `double` en degrés, 1 décimale à l'affichage (`'42.3°'`)
- `confidenceScore` : valeur entre 0.0 et 1.0 — affiché en % à l'écran (`'94%'`)

---

### `AnalysisDao` — Requête optimisée

```dart
// lib/features/capture/data/analysis_dao.dart

part of 'app_database.dart'; // ou import selon organisation choisie

@DriftAccessor(tables: [Analyses])
class AnalysisDao extends DatabaseAccessor<AppDatabase> with _$AnalysisDaoMixin {
  AnalysisDao(super.db);

  /// Retourne un Stream réactif, trié par created_at DESC.
  /// Exploite l'index idx_analyses_patient pour NFR-C2.
  Stream<List<AnalysisData>> watchAnalysesForPatient(String patientId) {
    return (select(analyses)
          ..where((a) => a.patientId.equals(patientId))
          ..orderBy([(a) => OrderingTerm.desc(a.createdAt)]))
        .watch();
  }
}
```

---

### `DriftAnalysisRepository` — Mapping domaine

```dart
// lib/features/capture/data/drift_analysis_repository.dart

class DriftAnalysisRepository implements AnalysisRepository {
  final AnalysisDao _dao;

  DriftAnalysisRepository(this._dao);

  @override
  Stream<List<Analysis>> watchAnalysesForPatient(String patientId) {
    return _dao
        .watchAnalysesForPatient(patientId)
        .map((rows) => rows.map(_mapToDomain).toList());
  }

  Analysis _mapToDomain(AnalysisData row) => Analysis(
        id: row.id,
        patientId: row.patientId,
        createdAt: DateTime.parse(row.createdAt), // ISO 8601 → DateTime
        kneeAngle: row.kneeAngle,
        hipAngle: row.hipAngle,
        ankleAngle: row.ankleAngle,
        confidenceScore: row.confidenceScore,
      );
}
```

---

### `PatientHistoryTile` — Spécification UI

**Palette obligatoire** (Clinical White — Direction A) :

- Fond card : `#FFFFFF` (iOS secondarySystemGroupedBackground)
- Titre date : `#1C1C1E` (Text), typographie `Title 3 Semibold` (SF Pro)
- Valeurs angles : `#1C1C1E`, `Title 3 Semibold`
- Label "Confiance" : `#8E8E93` (iOS systemGray), `Subheadline Regular`
- Séparateur : `#E5E5EA` (iOS separator)
- Touch target : ≥ 44×44pt (obligatoire WCAG + Apple HIG)

**Formatage date (ISO 8601 → affichage lisible) :**

```dart
// Utiliser DateFormat de intl, ou implémentation custom
// Exemple attendu : "5 mars 2026 à 14:30"
// PAS de format ambigu type "05/03/26" ou timestamp brut
```

**Formatage angles :**

```dart
// 1 décimale obligatoire
'${analysis.kneeAngle.toStringAsFixed(1)}°'
// Affichage sur la tile : "G: 42.3° | H: 67.0° | C: 41.5°"
// ou en colonnes selon le layout disponible
```

**Formatage score de confiance :**

```dart
// Multiplier par 100, pas de décimales
'${(analysis.confidenceScore * 100).round()}%'
```

---

### `PatientDetailScreen` — Architecture widget

```
PatientDetailScreen (ConsumerWidget)
├── CupertinoPageScaffold
│   ├── CupertinoNavigationBar
│   │   ├── middle: Text(patient.name)
│   │   └── trailing: CupertinoButton("Nouvelle analyse" → CaptureScreen)
│   └── SafeArea
│       └── switch (analysisHistoryState)
│           ├── AsyncData (vide)  → _EmptyHistoryView
│           ├── AsyncData (liste) → CustomScrollView + SliverList<PatientHistoryTile>
│           ├── AsyncLoading     → LoadingSpinner (centré)
│           └── AsyncError       → ErrorWidget (message + retry)
```

**Switch exhaustif obligatoire (jamais `.when()`) :**

```dart
switch (ref.watch(analysisHistoryNotifierProvider(patient.id))) {
  case AsyncData(:final value) when value.isEmpty => const _EmptyHistoryView(),
  case AsyncData(:final value) => _AnalysisList(analyses: value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error),
}
```

---

### Routing go_router

```dart
// lib/core/router/app_router.dart — ajouts pour cette story

GoRoute(
  path: '/patients/:patientId',
  name: 'patientDetail',
  builder: (context, state) {
    final patientId = state.pathParameters['patientId']!;
    return PatientDetailScreen(patientId: patientId);
  },
  routes: [
    GoRoute(
      path: 'analyses/:analysisId',
      name: 'analysisResults',
      builder: (context, state) {
        final analysisId = state.pathParameters['analysisId']!;
        return ResultsScreen(analysisId: analysisId);
      },
    ),
  ],
),
```

**Note :** La protection biométrique via `biometric_guard.dart` (redirect) doit couvrir ces routes. Ne pas ajouter de vérification biométrique inline dans le widget — la sécurité est centralisée dans `core/auth/`.

---

### Tests à implémenter

**`analysis_history_notifier_test.dart` (tests unitaires) :**

```dart
// Scénarios obligatoires :
// 1. build() retourne un Stream vide si aucune analyse
// 2. build() retourne les analyses triées par created_at DESC
// 3. Une nouvelle analyse insérée en base est émise dans le Stream
// 4. Erreur du repository propagée comme AsyncError

// Pattern avec mocktail + riverpod_test :
final mockRepo = MockAnalysisRepository();
when(() => mockRepo.watchAnalysesForPatient(any()))
    .thenAnswer((_) => Stream.value([analysis1, analysis2]));
```

**`patient_history_tile_test.dart` (tests widget) :**

```dart
// Scénarios :
// 1. Date affichée correctement depuis ISO 8601
// 2. Angles affichés avec 1 décimale + "°"
// 3. Confidence score affiché en %
// 4. onTap déclenche la navigation vers ResultsScreen
// 5. Touch target ≥ 44 logical pixels
```

---

### Localisation des fichiers dans l'arborescence

```
lib/
├── core/
│   ├── database/
│   │   └── app_database.dart          ← MODIFIER : ajouter idx_analyses_patient si absent
│   └── router/
│       └── app_router.dart            ← MODIFIER : ajouter routes patient detail + analysis results
├── features/
│   ├── capture/
│   │   ├── data/
│   │   │   ├── analysis_dao.dart      ← CRÉER (si absent de Story 2.x précédentes)
│   │   │   ├── analysis_repository.dart          ← MODIFIER : ajouter watchAnalysesForPatient
│   │   │   └── drift_analysis_repository.dart    ← MODIFIER : implémenter watchAnalysesForPatient
│   │   └── domain/
│   │       └── analysis.dart          ← CRÉER ou COMPLÉTER (modèle Freezed)
│   └── patients/
│       ├── application/
│       │   ├── analysis_history_notifier.dart    ← CRÉER
│       │   ├── analysis_history_notifier_test.dart ← CRÉER
│       │   └── patients_provider.dart            ← MODIFIER : déclarer analysisHistoryNotifierProvider
│       └── presentation/
│           ├── patient_detail_screen.dart        ← CRÉER
│           └── widgets/
│               ├── patient_history_tile.dart     ← CRÉER
│               └── patient_history_tile_test.dart ← CRÉER
```

**Fichiers déjà existants (ne pas recréer de zéro, compléter uniquement) :**

- `lib/core/database/app_database.dart` — Story 1.3
- `lib/core/router/app_router.dart` — Story 1.1 (stub)
- `lib/features/capture/data/analysis_repository.dart` — stub prévu Story 1.1
- `lib/features/patients/application/patients_provider.dart` — Story 2.1/2.2

---

### Performance NFR-C2 — Stratégie pagination

Pour supporter 5 000+ analyses sans dégradation, utiliser `ListView.builder` (lazy rendering) :

```dart
ListView.builder(
  itemCount: analyses.length,
  itemBuilder: (context, index) => PatientHistoryTile(analysis: analyses[index]),
)
```

**Ne pas utiliser `ListView(children: [...])` qui matérialise tous les widgets en mémoire.**

Si des tests de performance montrent des lags au-delà de 1 000 analyses, envisager une pagination côté Drift (`LIMIT` / `OFFSET`), mais le `ListView.builder` suffit pour le MVP (données légères, pas de médias).

---

### Project Structure Notes

**Alignement avec l'arborescence définie en architecture :**

| Fichier créé                     | Chemin attendu (architecture.md)          | Conforme |
| -------------------------------- | ----------------------------------------- | -------- |
| `analysis_history_notifier.dart` | `features/patients/application/`          | ✅       |
| `patient_detail_screen.dart`     | `features/patients/presentation/`         | ✅       |
| `patient_history_tile.dart`      | `features/patients/presentation/widgets/` | ✅       |
| `analysis_dao.dart`              | `features/capture/data/`                  | ✅       |
| `analysis.dart` (Freezed)        | `features/capture/domain/`                | ✅       |

**Conflicts détectés :**

- `AnalysisHistoryNotifier` est placé dans `features/patients/application/` (pas dans `features/capture/`) car il sert la **vue patient** et non la feature capture. Justification : le Notifier porte la responsabilité de présenter l'historique d'un patient — sa home feature est `patients`, même si il consomme le `AnalysisRepository` de `capture`. Cette décision préserve la cohésion fonctionnelle.

- Les données de test (seed analyses en flavor dev) sont à créer manuellement via Dart direct en base non-chiffrée — aucun scaffolding de données prévu dans le code de production.

### References

- [Source: docs/planning-artifacts/epics.md#Story-2.3] — Acceptance Criteria originaux, FR4 couverture
- [Source: docs/planning-artifacts/epics.md#Requirements-Inventory] — NFR-C2 (5 000+ analyses), NFR-P6 (performance), FR4
- [Source: docs/planning-artifacts/architecture.md#Architecture-des-données] — Drift + SQLCipher, Index Drift obligatoires
- [Source: docs/planning-artifacts/architecture.md#Gap-critique-2] — `idx_analyses_patient` sur `(patient_id, created_at DESC)`
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Structure feature data/domain/application/presentation
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes, camelCase variables/providers
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — Switch exhaustif AsyncValue obligatoire
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites] — Accès DAO direct depuis Notifier interdit
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-format] — ISO 8601 dates, UUID v4 IDs, angles 1 décimale
- [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales] — Repository comme seule couche d'accès données
- [Source: docs/planning-artifacts/ux-design-specification.md#Implementation-Approach] — CupertinoNavigationBar, palette Clinical White
- [Source: docs/planning-artifacts/ux-design-specification.md#Component-Strategy] — Touch targets 44×44pt, typography SF Pro

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

- `lib/core/database/app_database.dart` — modified (index idx_analyses_patient)
- `lib/core/router/app_router.dart` — modified (routes patient detail + analysis results)
- `lib/features/capture/domain/analysis.dart` — created (Freezed model)
- `lib/features/capture/domain/analysis.freezed.dart` — generated
- `lib/features/capture/data/analysis_dao.dart` — created
- `lib/features/capture/data/analysis_repository.dart` — modified (watchAnalysesForPatient)
- `lib/features/capture/data/drift_analysis_repository.dart` — modified (implementation)
- `lib/features/patients/application/analysis_history_notifier.dart` — created
- `lib/features/patients/application/analysis_history_notifier.g.dart` — generated
- `lib/features/patients/application/analysis_history_notifier_test.dart` — created
- `lib/features/patients/application/patients_provider.dart` — modified
- `lib/features/patients/presentation/patient_detail_screen.dart` — created
- `lib/features/patients/presentation/widgets/patient_history_tile.dart` — created
- `lib/features/patients/presentation/widgets/patient_history_tile_test.dart` — created
