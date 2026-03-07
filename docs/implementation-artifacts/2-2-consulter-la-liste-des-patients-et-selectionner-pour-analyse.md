# Story 2.2 : Consulter la Liste des Patients et Sélectionner pour Analyse

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 2.2, Epic 2 (Gestion des Patients) -->

---

## Story

As a practitioner,
I want to browse my patient list and select a patient to start a new analysis,
So that I can quickly find the right patient during a consultation.

---

## Acceptance Criteria

**AC1 — Chargement initial performant**
**Given** au moins un patient existe en base Drift
**When** j'ouvre l'écran patients (`/patients`)
**Then** la liste se charge en < 1 seconde pour 500+ patients (NFR-P6)
**And** l'index Drift `idx_patients_name` sur `patients(name)` est utilisé pour la requête (défini dans `app_database.dart`)

**AC2 — Stream réactif Riverpod**
**And** la liste est alimentée par un `watchAll()` stream du `PatientRepository`
**And** tout changement en base (ajout via Story 2.1, suppression via Story 2.4) est reflété instantanément sans rechargement manuel

**AC3 — Recherche temps réel par nom**
**When** je saisis du texte dans le champ de recherche
**Then** la liste est filtrée en temps réel par nom de patient
**And** le filtrage est insensible à la casse
**And** le champ de recherche est debounced (200ms) pour éviter les requêtes excessives
**And** si aucun patient ne correspond, un état vide explicite est affiché

**AC4 — Navigation vers la fiche patient**
**When** je sélectionne un patient dans la liste
**Then** je suis navigué vers la fiche patient (`/patients/:patientId`) via go_router
**And** la fiche patient affiche les informations du patient sélectionné et propose de lancer une analyse (FR3)

**AC5 — État vide (aucun patient)**
**Given** aucun patient n'existe en base
**When** j'ouvre l'écran patients
**Then** un état vide est affiché avec un CTA "Créer un patient" (naviguer vers le flux de création — Story 2.1)

**AC6 — AsyncValue switch exhaustif**
**And** l'état du stream est géré par un `switch` exhaustif Dart 3 sur `AsyncValue` (jamais `.when()`)
**And** les états `AsyncLoading`, `AsyncData`, `AsyncError` sont tous couverts avec des widgets appropriés

---

## Tasks / Subtasks

- [ ] **T1 — Définir l'index Drift `idx_patients_name`** (AC: 1)
  - [ ] T1.1 — Ouvrir `lib/core/database/app_database.dart`
  - [ ] T1.2 — Vérifier que `Index('idx_patients_name', 'patients (name)')` est présent dans `allSchemaEntities`
  - [ ] T1.3 — Vérifier que `Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)')` est présent (requis pour Story 2.3 — ne pas omettre)
  - [ ] T1.4 — Relancer `dart run build_runner build --delete-conflicting-outputs` pour régénérer `app_database.g.dart`

- [ ] **T2 — Implémenter `watchAll()` dans le `PatientRepository`** (AC: 2)
  - [ ] T2.1 — Ouvrir `lib/features/patients/data/patient_repository.dart` (interface abstraite)
  - [ ] T2.2 — S'assurer que la méthode `Stream<List<Patient>> watchAll()` est déclarée
  - [ ] T2.3 — Implémenter `watchAll()` dans `lib/features/patients/data/drift_patient_repository.dart`
    - Utiliser `select(patients).watch()` de Drift pour un stream natif
    - Mapper les `PatientCompanion` → `Patient` (Freezed)
  - [ ] T2.4 — Écrire le test unitaire `drift_patient_repository_test.dart` : vérifier que `watchAll()` émet une nouvelle valeur après insertion

- [ ] **T3 — Implémenter `PatientsNotifier`** (AC: 2, 3, 6)
  - [ ] T3.1 — Ouvrir `lib/features/patients/application/patients_notifier.dart`
  - [ ] T3.2 — Implémenter `PatientsNotifier` comme `AsyncNotifier<List<Patient>>`
  - [ ] T3.3 — Dans `build()`, s'abonner au stream `patientRepository.watchAll()` via `ref.listen`
  - [ ] T3.4 — Ajouter la méthode `filterByName(String query)` :
    - Si `query.isEmpty` → émettre la liste complète
    - Sinon → filtrer localement (case-insensitive) la liste en mémoire
    - Debounce 200ms implémenté dans le widget (pas dans le Notifier)
  - [ ] T3.5 — Écrire `patients_notifier_test.dart` :
    - Test : état initial est `AsyncLoading` puis `AsyncData(patients)`
    - Test : `filterByName('marc')` retourne uniquement les patients dont le nom contient "marc" (case-insensitive)
    - Test : `filterByName('')` retourne la liste complète
  - [ ] T3.6 — Déclarer `patientsProvider` dans `lib/features/patients/application/patients_provider.dart`

- [ ] **T4 — Implémenter `PatientsScreen`** (AC: 1, 2, 3, 5, 6)
  - [ ] T4.1 — Ouvrir `lib/features/patients/presentation/patients_screen.dart`
  - [ ] T4.2 — Implémenter un `ConsumerWidget` avec `CupertinoNavigationBar` (titre : "Patients")
  - [ ] T4.3 — Ajouter le champ de recherche en `CupertinoSearchTextField` sous la nav bar
    - Debounce 200ms via `Timer` ou package `rxdart` si disponible
    - Appeler `ref.read(patientsProvider.notifier).filterByName(query)` à chaque changement
  - [ ] T4.4 — Afficher la liste via `switch` exhaustif sur `ref.watch(patientsProvider)` :
    ```dart
    switch (patientsState) {
      case AsyncLoading() => const LoadingSpinner(),
      case AsyncError(:final error) => ErrorWidget(error),
      case AsyncData(:final value) when value.isEmpty => _EmptyPatientsView(),
      case AsyncData(:final value) => _PatientListView(patients: value),
    }
    ```
  - [ ] T4.5 — Implémenter `_EmptyPatientsView` : texte "Aucun patient" + `CupertinoButton` "Créer un patient" qui navigue vers `/patients/new`
  - [ ] T4.6 — Implémenter `_PatientListView` : `ListView.builder` + `PatientListTile` pour chaque patient

- [ ] **T5 — Implémenter `PatientListTile`** (AC: 4)
  - [ ] T5.1 — Ouvrir `lib/features/patients/presentation/widgets/patient_list_tile.dart`
  - [ ] T5.2 — Implémenter un `CupertinoListTile` (ou `ListTile` Material thémé) avec :
    - **Titre** : `patient.name` (Headline 17pt Semibold, `#1C1C1E`)
    - **Sous-titre** : date de naissance formatée (`DateFormat('dd/MM/yyyy')`) + profil morphologique
    - **Trailing** : chevron iOS (`CupertinoIcons.chevron_right`, couleur `#8E8E93`)
    - **Touch target** : hauteur ≥ 44pt (Apple HIG)
  - [ ] T5.3 — Sur `onTap`, appeler `context.go('/patients/${patient.id}')` via go_router

- [ ] **T6 — Configurer la route go_router `/patients`** (AC: 4)
  - [ ] T6.1 — Ouvrir `lib/core/router/app_router.dart`
  - [ ] T6.2 — Ajouter la route `GoRoute(path: '/patients', builder: (ctx, state) => const PatientsScreen())`
  - [ ] T6.3 — Ajouter la route enfant `GoRoute(path: ':patientId', builder: (ctx, state) => PatientDetailScreen(patientId: state.pathParameters['patientId']!))`
  - [ ] T6.4 — Relancer `dart run build_runner build --delete-conflicting-outputs` si `go_router_builder` est utilisé
  - [ ] T6.5 — Vérifier que le redirect biométrique `biometric_guard.dart` protège bien la route `/patients` (aucun accès sans auth)

- [ ] **T7 — Validation et tests d'intégration** (AC: 1 à 6)
  - [ ] T7.1 — `flutter analyze` → 0 erreurs, 0 warnings
  - [ ] T7.2 — `flutter test lib/features/patients/` → tous les tests passent
  - [ ] T7.3 — Test manuel sur simulateur : ouvrir l'écran patients avec 0 patient → état vide visible
  - [ ] T7.4 — Test manuel : créer 1 patient (Story 2.1 doit être disponible ou mocker en base), vérifier l'apparition dans la liste sans rechargement
  - [ ] T7.5 — Test manuel de performance : seeder 500 patients en base dev, chronométrer le chargement (objectif < 1s)
  - [ ] T7.6 — Test de recherche : taper "marc" → filtrage immédiat, effacer → liste complète restaurée

---

## Dev Notes

### Vue d'ensemble

Cette story implémente l'écran central de la feature `patients` — c'est le hub depuis lequel le praticien sélectionne un patient pour lancer le flux d'analyse. Deux dépendances directes :

- **Story 2.1** (Créer un profil patient) : fournit les patients persistés en base. Cette story peut être développée en parallèle si la DAO et le `Patient` Freezed sont disponibles depuis les stubs de Story 2.1.
- **Story 1.3** (Chiffrement AES-256) : le schéma Drift doit être initialisé avec les index avant que cette story puisse fonctionner en prod.

### Index Drift obligatoires — NFR-P6

L'architecture définit deux index obligatoires dans `app_database.dart`. Les deux doivent être présents dès cette story pour ne pas casser NFR-P6 et préparer Story 2.3 :

```dart
// lib/core/database/app_database.dart
@override
List<DatabaseSchemaEntity> get allSchemaEntities => [
  patients,
  analyses,
  articularAngles,
  Index('idx_patients_name', 'patients (name)'),            // NFR-P6 — requis ICI
  Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)'), // requis pour Story 2.3
];
```

**Rationale :** Sans `idx_patients_name`, SQLite fait un full table scan pour chaque requête `SELECT * FROM patients ORDER BY name`. À 500 patients, la latence dépasse 1s en mode chiffré SQLCipher (NFR-P6 violé).

### Pattern Repository — watchAll() stream

La méthode `watchAll()` retourne un `Stream<List<Patient>>` (stream Drift natif) qui émet à chaque modification de la table `patients`. C'est le pattern Riverpod correct pour une liste réactive :

```dart
// lib/features/patients/data/patient_repository.dart
abstract class PatientRepository {
  Stream<List<Patient>> watchAll();
  Future<void> save(Patient patient);
  Future<void> delete(PatientId id);
}

// lib/features/patients/data/drift_patient_repository.dart
class DriftPatientRepository implements PatientRepository {
  final AppDatabase _db;

  DriftPatientRepository(this._db);

  @override
  Stream<List<Patient>> watchAll() {
    return _db.select(_db.patients)
        .watch()
        .map((rows) => rows.map(_mapToPatient).toList());
  }

  Patient _mapToPatient(PatientsData row) {
    return Patient(
      id: row.id,
      name: row.name,
      birthDate: DateTime.parse(row.birthDate),
      morphologicalProfile: row.morphologicalProfile,
      createdAt: DateTime.parse(row.createdAt),
    );
  }
}
```

### PatientsNotifier — Pattern AsyncNotifier avec stream

Le `PatientsNotifier` doit s'abonner au stream et maintenir la liste filtrée :

```dart
// lib/features/patients/application/patients_notifier.dart
@riverpod
class PatientsNotifier extends _$PatientsNotifier {
  List<Patient> _allPatients = [];

  @override
  Stream<List<Patient>> build() {
    // Le stream Drift émet automatiquement à chaque changement en base
    return ref.watch(patientRepositoryProvider).watchAll()
      ..listen((patients) {
        _allPatients = patients;
      });
  }

  void filterByName(String query) {
    if (query.isEmpty) {
      state = AsyncData(_allPatients);
      return;
    }
    final lower = query.toLowerCase();
    state = AsyncData(
      _allPatients
          .where((p) => p.name.toLowerCase().contains(lower))
          .toList(),
    );
  }
}
```

**Note :** Si `riverpod_generator` est utilisé (annotation `@riverpod`), relancer `build_runner`. Si le code est écrit manuellement, utiliser `StreamNotifierProvider`.

### Règle switch exhaustif AsyncValue — OBLIGATOIRE

```dart
// ✅ CORRECT — switch exhaustif Dart 3
switch (ref.watch(patientsProvider)) {
  case AsyncLoading() => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error),
  case AsyncData(:final value) when value.isEmpty => const _EmptyPatientsView(),
  case AsyncData(:final value) => _PatientListView(patients: value),
}

// ❌ INTERDIT — state.when() / state.maybeWhen()
ref.watch(patientsProvider).when(
  data: (patients) => ...,
  loading: () => ...,
  error: (e, _) => ...,
)
```

### UX — Clinical White direction A

L'écran patients respecte strictement la direction "Clinical White" (UX Spec) :

| Élément                | Valeur                                           |
| ---------------------- | ------------------------------------------------ |
| Background             | `#F2F2F7` (iOS systemGroupedBackground)          |
| Cards / Tiles          | `#FFFFFF` (iOS secondarySystemGroupedBackground) |
| Texte nom patient      | `#1C1C1E`, 17pt Semibold (Headline)              |
| Texte sous-titre       | `#8E8E93`, 14pt Regular (Footnote)               |
| Chevron trailing       | `CupertinoIcons.chevron_right`, `#8E8E93`        |
| Touch target tiles     | ≥ 44pt hauteur (Apple HIG + WCAG)                |
| Search field           | `CupertinoSearchTextField` — iOS natif           |
| Nav bar                | `CupertinoNavigationBar`, titre "Patients"       |
| Marges horizontales    | 16pt (`AppSpacing.margin`)                       |
| Espacement entre tiles | 0pt (liste groupée iOS)                          |

**CTA "Nouvelle analyse" :** Le bouton principal d'action sur cet écran est la sélection d'un patient existant. Le bouton de création d'un nouveau patient (Story 2.1) peut être placé en trailing de la nav bar (`CupertinoIcons.add`) ou dans l'état vide.

### Navigation go_router — Routes patients

```dart
// lib/core/router/app_router.dart
GoRoute(
  path: '/patients',
  builder: (context, state) => const PatientsScreen(),
  routes: [
    GoRoute(
      path: ':patientId',
      builder: (context, state) {
        final patientId = state.pathParameters['patientId']!;
        return PatientDetailScreen(patientId: patientId);
      },
    ),
  ],
),
```

Navigation depuis `PatientListTile` :

```dart
// Dans le onTap du tile
onTap: () => context.go('/patients/${patient.id}'),
```

La route `/patients/:patientId` sera la fiche patient (Story 2.3 pour l'historique). Pour cette story, `PatientDetailScreen` peut être un stub avec le nom du patient et le bouton "Lancer une analyse" qui naviguera vers `/capture` (Epic 3).

### Debounce de la recherche — implémentation widget

Le debounce de 200ms se fait dans le widget, pas dans le Notifier, pour respecter la séparation des responsabilités :

```dart
// Dans PatientsScreen — StatefulWidget si debounce Timer
Timer? _debounceTimer;

void _onSearchChanged(String query) {
  _debounceTimer?.cancel();
  _debounceTimer = Timer(const Duration(milliseconds: 200), () {
    ref.read(patientsProvider.notifier).filterByName(query);
  });
}

@override
void dispose() {
  _debounceTimer?.cancel();
  super.dispose();
}
```

**Alternative :** Si `rxdart` est dans les dépendances (vérifier pubspec.yaml), utiliser `BehaviorSubject` + `debounceTime`. Sinon, le `Timer` Dart natif est suffisant.

### Performance — NFR-P6 validation

Pour valider NFR-P6 en development :

```dart
// Seeder dev — à placer dans main_dev.dart ou un bouton debug
Future<void> seedPatientsForPerfTest(PatientRepository repo) async {
  for (int i = 0; i < 500; i++) {
    await repo.save(Patient(
      id: const Uuid().v4(),
      name: 'Patient Test $i',
      birthDate: DateTime(1970 + (i % 50)),
      morphologicalProfile: 'standard',
      createdAt: DateTime.now(),
    ));
  }
}
```

Chronométrer le chargement initial :

```dart
// Dans DriftPatientRepository.watchAll() — mesure dev uniquement
final stopwatch = Stopwatch()..start();
final result = await _db.select(_db.patients).get();
debugPrint('watchAll() took: ${stopwatch.elapsedMilliseconds}ms for ${result.length} patients');
```

Objectif : < 1000ms avec `idx_patients_name` sur device physique iPhone 12+.

### Schéma Drift attendu — table `patients`

La table `patients` doit être définie dans `app_database.dart` avec au minimum :

```dart
class Patients extends Table {
  TextColumn get id => text()();           // UUID v4
  TextColumn get name => text()();         // Nom du patient — INDEXÉ (idx_patients_name)
  TextColumn get birthDate => text()();    // ISO 8601 string — ex: '1968-03-15'
  TextColumn get morphologicalProfile => text()();  // 'standard', 'obese', 'athlétique'
  TextColumn get createdAt => text()();    // ISO 8601 string — ex: '2026-03-05T14:30:00Z'

  @override
  Set<Column> get primaryKey => {id};
}
```

**Format des dates obligatoire :** ISO 8601 string (`TextColumn`). Jamais Unix timestamp entier.
**Format des IDs obligatoire :** UUID v4 string. `const Uuid().v4()` généré côté Dart.

### Modèle Freezed `Patient`

```dart
// lib/features/patients/domain/patient.dart
@freezed
class Patient with _$Patient {
  const factory Patient({
    required String id,
    required String name,
    required DateTime birthDate,
    required String morphologicalProfile,
    required DateTime createdAt,
  }) = _Patient;

  factory Patient.fromJson(Map<String, dynamic> json) => _$PatientFromJson(json);
}
```

Généré par `freezed` + `build_runner`. Le fichier `patient.freezed.dart` ne doit **jamais** être édité manuellement.

### Structure de fichiers à créer/modifier

```
lib/features/patients/
├── data/
│   ├── patient_repository.dart              ← modifier : vérifier watchAll() déclaré
│   ├── patient_repository_test.dart         ← créer si absent
│   ├── drift_patient_repository.dart        ← implémenter watchAll()
│   └── drift_patient_repository_test.dart   ← test watchAll() stream
├── domain/
│   ├── patient.dart                         ← vérifier (créé en Story 2.1)
│   └── patient.freezed.dart                 ← généré, ne pas éditer
├── application/
│   ├── patients_notifier.dart               ← implémenter PatientsNotifier
│   ├── patients_notifier_test.dart          ← créer
│   └── patients_provider.dart              ← déclarer patientsProvider
└── presentation/
    ├── patients_screen.dart                 ← implémenter PatientsScreen
    ├── patient_detail_screen.dart           ← stub suffisant pour cette story
    └── widgets/
        └── patient_list_tile.dart           ← implémenter PatientListTile

lib/core/
├── database/
│   └── app_database.dart                   ← vérifier/ajouter les 2 index
└── router/
    └── app_router.dart                     ← ajouter routes /patients et /patients/:id
```

### Project Structure Notes

**Alignement avec l'arborescence architecturale :**

- Tous les fichiers respectent la convention `data/domain/application/presentation`
- `patients_notifier.dart` est dans `application/` — jamais dans `presentation/`
- `patientsProvider` déclaré dans `patients_provider.dart` uniquement — jamais inline dans un widget
- Accès aux données uniquement via `PatientRepository` — accès direct à `PatientDao` depuis le `Notifier` **interdit**
- Tests co-localisés avec leurs fichiers source (`drift_patient_repository_test.dart` dans `data/`, `patients_notifier_test.dart` dans `application/`)

**Dépendances entre stories :**

| Story     | Dépendance                                           | Nature                                             |
| --------- | ---------------------------------------------------- | -------------------------------------------------- |
| Story 1.3 | Drift schema + SQLCipher initialisé                  | Bloquant pour prod, simulable en dev               |
| Story 2.1 | Modèle `Patient` Freezed + `save()` Repository       | Bloquant — les patients doivent pouvoir être créés |
| Story 2.3 | Route `/patients/:patientId` → `PatientDetailScreen` | Non-bloquant — stub suffisant                      |
| Epic 3    | Bouton "Lancer une analyse" navigue vers `/capture`  | Non-bloquant — stub de navigation                  |

**Précautions Riverpod :**

- Provider global autorisé : `patientRepositoryProvider` est dans `features/patients/application/patients_provider.dart` (feature-scoped)
- Le `databaseProvider` est dans `core/database/database_provider.dart` (global autorisé — cross-cutting)
- `PatientsNotifier` consomme `patientRepositoryProvider`, jamais `driftDbProvider` directement

### Accessibilité

- **VoiceOver** : `PatientListTile` doit avoir un `Semantics` wrapper : `"Patient : ${patient.name}, né le ${formattedDate}. Bouton : ouvrir la fiche patient."`
- **Dynamic Type** : utiliser `TextStyle` iOS natifs via `CupertinoTheme` ou `Theme.of(context).textTheme` — ne pas hardcoder les tailles
- **Daltonisme** : le chevron trailing est informatif, pas sémantique — aucun état couleur sur les tiles de liste (pas de rouge/vert sur le tile)
- **Touch target** : `ListTile` Material a une hauteur minimale de 48pt par défaut — vérifie que `minVerticalPadding` respecte les 44pt HIG

### References

- [Source: docs/planning-artifacts/epics.md#Story-2.2] — User story + AC originaux (FR2, FR3, NFR-P6)
- [Source: docs/planning-artifacts/architecture.md#Architecture-des-données] — `PatientRepository` interface abstraite, `watchAll()` stream
- [Source: docs/planning-artifacts/architecture.md#Gap-critique-2] — Index Drift `idx_patients_name` + `idx_analyses_patient` obligatoires
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — Switch exhaustif `AsyncValue` (interdiction de `.when()`)
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Structure `data/domain/application/presentation`
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes, camelCase providers
- [Source: docs/planning-artifacts/architecture.md#Frontières-architecturales] — Accès données uniquement via Repository
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites] — DAO direct depuis Notifier interdit
- [Source: docs/planning-artifacts/architecture.md#Routing-go_router-17.x] — go_router déclaratif, deep links type-safe
- [Source: docs/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation] — Palette Clinical White, spacing 8pt, touch targets 44pt
- [Source: docs/planning-artifacts/ux-design-specification.md#Design-Direction-Decision] — CupertinoNavigationBar, CupertinoSearchTextField
- [Source: docs/planning-artifacts/ux-design-specification.md#Experience-Mechanics] — Patient existant → sélection dans liste (recherche + récents)
- [Source: docs/implementation-artifacts/1-1-initialisation-du-projet-infrastructure-technique.md] — Patterns de code validés Story 1.1

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

- `bodyorthox/lib/core/database/app_database.dart` — modified (index `idx_patients_name` + `idx_analyses_patient`)
- `bodyorthox/lib/features/patients/data/patient_repository.dart` — modified (watchAll() déclaré)
- `bodyorthox/lib/features/patients/data/drift_patient_repository.dart` — created/modified (watchAll() implémenté)
- `bodyorthox/lib/features/patients/data/drift_patient_repository_test.dart` — created
- `bodyorthox/lib/features/patients/application/patients_notifier.dart` — created
- `bodyorthox/lib/features/patients/application/patients_notifier_test.dart` — created
- `bodyorthox/lib/features/patients/application/patients_provider.dart` — created/modified
- `bodyorthox/lib/features/patients/presentation/patients_screen.dart` — created
- `bodyorthox/lib/features/patients/presentation/patient_detail_screen.dart` — created (stub)
- `bodyorthox/lib/features/patients/presentation/widgets/patient_list_tile.dart` — created
- `bodyorthox/lib/core/router/app_router.dart` — modified (routes /patients)
