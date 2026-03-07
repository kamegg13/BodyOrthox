# Story 2.1 : Créer un Profil Patient

Status: ready-for-dev

<!-- Validé contre checklist create-story — Story 2.1, Epic 2 (Gestion des Patients) -->

---

## Story

As a practitioner,
I want to create a patient profile with their name, date of birth, and morphological profile,
So that I can associate analyses to a named patient and provide age-appropriate reference norms.

---

## Acceptance Criteria

**AC1 — Persistance du patient**
**Given** l'écran de création patient est ouvert
**When** je saisis le nom, la date de naissance et le profil morphologique, puis confirme
**Then** le patient est persisté en base Drift (chiffré AES-256) avec un UUID v4 comme identifiant et un `created_at` au format ISO 8601

**AC2 — Apparition immédiate dans la liste**
**And** le patient apparaît immédiatement dans la liste patients sans rechargement manuel

**AC3 — Immutabilité du modèle Freezed**
**And** les données respectent le modèle Freezed `Patient` (immutabilité garantie — `copyWith`, `==`, `hashCode`, `toString` auto-générés)

**AC4 — Validation du nom obligatoire**
**And** la validation empêche la création d'un patient sans nom — une erreur de validation est affichée inline sous le champ nom

**AC5 — Interface via Repository**
**And** la persistance passe exclusivement par `PatientRepository` — aucun accès DAO direct depuis le Notifier

**AC6 — Accès hors-ligne**
**And** la création fonctionne intégralement sans connexion réseau (conformité NFR-S3, FR29)

---

## Tasks / Subtasks

- [ ] **T1 — Définir le modèle domaine `Patient` (Freezed)** (AC: 1, 3)
  - [ ] T1.1 — Créer `lib/features/patients/domain/patient.dart` avec la classe Freezed `Patient`
  - [ ] T1.2 — Déclarer les champs : `id` (String UUID v4), `name` (String), `dateOfBirth` (DateTime), `morphologicalProfile` (enum `MorphologicalProfile`), `createdAt` (DateTime ISO 8601)
  - [ ] T1.3 — Créer `lib/features/patients/domain/morphological_profile.dart` (enum : `standard`, `obese`, `pediatric`, `elderly`)
  - [ ] T1.4 — Exécuter `dart run build_runner build --delete-conflicting-outputs` pour générer `patient.freezed.dart`
  - [ ] T1.5 — Vérifier que `patient.freezed.dart` est généré sans erreur (co-localisé dans `domain/`)

- [ ] **T2 — Créer le schéma Drift `PatientsTable` et le DAO** (AC: 1)
  - [ ] T2.1 — Créer `lib/features/patients/data/patient_dao.dart` avec la table `Patients extends Table`
  - [ ] T2.2 — Définir les colonnes Drift : `TextColumn id` (UUID v4), `TextColumn name`, `TextColumn dateOfBirth` (ISO 8601 string), `TextColumn morphologicalProfile`, `TextColumn createdAt` (ISO 8601 string)
  - [ ] T2.3 — Ajouter la table `patients` dans `lib/core/database/app_database.dart` (@DriftDatabase tables)
  - [ ] T2.4 — Ajouter l'index `idx_patients_name` : `Index('idx_patients_name', 'patients (name)')` dans `allSchemaEntities`
  - [ ] T2.5 — Implémenter la méthode DAO `Future<void> insertPatient(PatientsCompanion patient)`
  - [ ] T2.6 — Implémenter la méthode DAO `Stream<List<Patient>> watchAllPatients()`
  - [ ] T2.7 — Exécuter `dart run build_runner build --delete-conflicting-outputs` pour générer le code Drift

- [ ] **T3 — Implémenter l'interface et la couche Repository** (AC: 1, 5)
  - [ ] T3.1 — Créer `lib/features/patients/data/patient_repository.dart` (interface abstraite)
  - [ ] T3.2 — Déclarer `Stream<List<Patient>> watchAll()` et `Future<void> save(Patient patient)` dans l'interface
  - [ ] T3.3 — Créer `lib/features/patients/data/drift_patient_repository.dart` (implémentation Drift)
  - [ ] T3.4 — Implémenter `save()` : générer UUID v4 via `const Uuid().v4()`, sérialiser `dateOfBirth` et `createdAt` en ISO 8601, insérer via DAO
  - [ ] T3.5 — Implémenter `watchAll()` : déléguer au DAO, mapper `PatientsRow` → `Patient` (Freezed)
  - [ ] T3.6 — Créer `lib/features/patients/data/drift_patient_repository_test.dart` (tests unitaires avec mock DAO)

- [ ] **T4 — Créer le Notifier et les providers Riverpod** (AC: 2, 5)
  - [ ] T4.1 — Créer `lib/features/patients/application/patients_notifier.dart` (`AsyncNotifier<List<Patient>>`)
  - [ ] T4.2 — Implémenter `build()` : retourner `ref.watch(patientRepositoryProvider).watchAll()` via `AsyncValue`
  - [ ] T4.3 — Implémenter `createPatient(String name, DateTime dateOfBirth, MorphologicalProfile profile)` : créer le `Patient` Freezed, appeler `repository.save()`, propager via stream
  - [ ] T4.4 — Créer `lib/features/patients/application/patients_provider.dart` : déclarer `patientRepositoryProvider` et `patientsNotifierProvider`
  - [ ] T4.5 — Créer `lib/features/patients/application/patients_notifier_test.dart` (tests avec `mocktail` + `ProviderContainer`)

- [ ] **T5 — Construire l'UI de création patient** (AC: 4)
  - [ ] T5.1 — Créer `lib/features/patients/presentation/create_patient_screen.dart` (écran de saisie)
  - [ ] T5.2 — Implémenter le champ nom : `CupertinoTextField` (ou `TextFormField` Material 3) avec validation inline "Nom requis"
  - [ ] T5.3 — Implémenter le sélecteur de date de naissance : `CupertinoDatePicker` en mode `date`, format d'affichage lisible
  - [ ] T5.4 — Implémenter le sélecteur de profil morphologique : `CupertinoSegmentedControl` ou `DropdownButton` avec les 4 valeurs de l'enum
  - [ ] T5.5 — Implémenter le bouton "Créer le patient" : `SizedBox(width: double.infinity, height: 44)` — respecter le touch target 44×44pt
  - [ ] T5.6 — Connecter le bouton à `patientsNotifier.createPatient(...)` — afficher `CircularProgressIndicator` pendant la persistance
  - [ ] T5.7 — Naviguer vers la liste patients après succès (via `go_router`)
  - [ ] T5.8 — Appliquer la palette : fond blanc (`AppColors.surface`), primary `AppColors.primary (#1B6FBF)`, erreur `AppColors.error (#FF3B30)`

- [ ] **T6 — Mettre à jour le routing go_router** (AC: 2)
  - [ ] T6.1 — Ajouter la route `/patients/create` dans `lib/core/router/app_router.dart`
  - [ ] T6.2 — Lier le bouton "+" de `patients_screen.dart` à cette route
  - [ ] T6.3 — Vérifier que la navigation retour (`pop`) ramène sur la liste sans bug

- [ ] **T7 — Tests et validation finale**
  - [ ] T7.1 — Tester `DriftPatientRepository` : `save()` persiste correctement l'UUID v4 et la date ISO 8601
  - [ ] T7.2 — Tester `PatientsNotifier` : `createPatient()` appelle bien `repository.save()` (mock via mocktail)
  - [ ] T7.3 — Tester la validation : `createPatient('')` lance une erreur de validation, ne persiste pas
  - [ ] T7.4 — Exécuter `flutter analyze` — 0 erreurs, 0 warnings
  - [ ] T7.5 — Exécuter `flutter test` — tous les tests passent

---

## Dev Notes

### Contexte et dépendances de story

Cette story est la **première story métier** de l'Epic 2 (Gestion des Patients). Elle pose la fondation de la feature `patients` : modèle Freezed, DAO Drift, interface Repository, Notifier Riverpod, et écran de création. Toutes les stories suivantes de l'Epic 2 (liste, historique, timeline) en dépendent.

**Pré-requis :** Story 1.1 complétée (structure Feature-First scaffoldée, `pubspec.yaml` configuré avec `sqlcipher_flutter_libs`, code generation fonctionnel).

**Impact sur les epics suivants :** Le modèle `Patient` (ID, `dateOfBirth`, `morphologicalProfile`) est consommé par l'Epic 3 (pipeline ML — calcul normes de référence par âge et profil) et l'Epic 4 (rapport PDF — métadonnées patient).

---

### Modèle Freezed `Patient`

```dart
// lib/features/patients/domain/patient.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'morphological_profile.dart';

part 'patient.freezed.dart';

@freezed
class Patient with _$Patient {
  const factory Patient({
    required String id,                        // UUID v4 — ex: '550e8400-e29b-41d4-a716-446655440000'
    required String name,                      // Nom complet du patient
    required DateTime dateOfBirth,             // Date de naissance — source du calcul des normes par âge
    required MorphologicalProfile morphologicalProfile,
    required DateTime createdAt,               // Horodatage ISO 8601 (FR30)
  }) = _Patient;
}
```

**Commande de génération :**

```bash
dart run build_runner build --delete-conflicting-outputs
```

Cela génère `patient.freezed.dart` co-localisé dans `lib/features/patients/domain/`.

---

### Enum `MorphologicalProfile`

```dart
// lib/features/patients/domain/morphological_profile.dart

/// Profil morphologique du patient.
/// Utilisé par le pipeline ML (Epic 3) pour sélectionner les normes de référence
/// par âge et profil appropriées (FR15).
enum MorphologicalProfile {
  standard,
  obese,
  pediatric,
  elderly,
}
```

---

### Schéma Drift `PatientsTable`

```dart
// lib/features/patients/data/patient_dao.dart
import 'package:drift/drift.dart';

// Table Drift — snake_case pluriel (règle architecture)
class Patients extends Table {
  // UUID v4 — TextColumn (règle architecture : IDs en UUID v4 string)
  TextColumn get id => text()();

  // Nom complet — index idx_patients_name pour les performances (NFR-P6)
  TextColumn get name => text()();

  // Date de naissance — ISO 8601 string (règle architecture)
  // Exemple : '1982-06-15' (date uniquement, pas d'heure)
  TextColumn get dateOfBirth => text()();

  // Profil morphologique — valeur enum sérialisée en string
  TextColumn get morphologicalProfile => text()();

  // Horodatage de création — ISO 8601 complet (FR30)
  // Exemple : '2026-03-05T14:30:00Z'
  TextColumn get createdAt => text()();

  @override
  Set<Column> get primaryKey => {id};
}
```

**Index obligatoire dans `app_database.dart` :**

```dart
// lib/core/database/app_database.dart
@DriftDatabase(tables: [Patients, /* autres tables */])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.e);

  @override
  int get schemaVersion => 1;

  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    patients,
    // Autres tables...
    Index('idx_patients_name', 'patients (name)'),           // NFR-P6 — liste < 1s pour 500 patients
    Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)'), // Pour Epic 2.3
  ];

  @override
  MigrationStrategy get migration =>
      MigrationStrategy.recreateTablesOnSchemaChanges(); // MVP uniquement
}
```

---

### Interface `PatientRepository`

```dart
// lib/features/patients/data/patient_repository.dart
import '../domain/patient.dart';

/// Interface abstraite — contrat Repository pour la feature patients.
/// L'implémentation Drift respecte ce contrat.
/// Rationale : migration PowerSync (cloud Phase 2) triviale sans refacto.
/// [Source: docs/planning-artifacts/architecture.md#Abstraction-Repository]
abstract class PatientRepository {
  /// Stream réactif — émet à chaque modification de la liste patients.
  Stream<List<Patient>> watchAll();

  /// Persiste un nouveau patient en base chiffrée.
  Future<void> save(Patient patient);

  /// Supprime un patient et toutes ses données associées.
  /// Réservé à Story 2.4 — déclarer maintenant pour compléter le contrat.
  Future<void> delete(String patientId);
}
```

---

### Implémentation `DriftPatientRepository`

```dart
// lib/features/patients/data/drift_patient_repository.dart
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../../../core/database/app_database.dart';
import '../domain/patient.dart';
import '../domain/morphological_profile.dart';
import 'patient_repository.dart';

class DriftPatientRepository implements PatientRepository {
  final AppDatabase _db;

  DriftPatientRepository(this._db);

  @override
  Stream<List<Patient>> watchAll() {
    return _db.select(_db.patients).watch().map(
      (rows) => rows.map(_rowToPatient).toList(),
    );
  }

  @override
  Future<void> save(Patient patient) async {
    await _db.into(_db.patients).insert(
      PatientsCompanion.insert(
        id: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth.toIso8601String().split('T').first, // 'YYYY-MM-DD'
        morphologicalProfile: patient.morphologicalProfile.name,
        createdAt: patient.createdAt.toUtc().toIso8601String(),              // 'YYYY-MM-DDTHH:MM:SSZ'
      ),
    );
  }

  @override
  Future<void> delete(String patientId) async {
    await (_db.delete(_db.patients)
      ..where((t) => t.id.equals(patientId)))
      .go();
  }

  // Mapping privé PatientsRow → Patient (Freezed)
  Patient _rowToPatient(PatientsRow row) {
    return Patient(
      id: row.id,
      name: row.name,
      dateOfBirth: DateTime.parse(row.dateOfBirth),
      morphologicalProfile: MorphologicalProfile.values.byName(row.morphologicalProfile),
      createdAt: DateTime.parse(row.createdAt),
    );
  }
}
```

**Génération de l'UUID côté Dart (règle architecture) :**

```dart
// Dans PatientsNotifier.createPatient()
final newPatient = Patient(
  id: const Uuid().v4(),         // UUID v4 — généré côté Dart, jamais AUTOINCREMENT SQL
  name: name.trim(),
  dateOfBirth: dateOfBirth,
  morphologicalProfile: profile,
  createdAt: DateTime.now().toUtc(),
);
await repository.save(newPatient);
```

---

### Notifier Riverpod

```dart
// lib/features/patients/application/patients_notifier.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../domain/patient.dart';
import '../domain/morphological_profile.dart';
import '../data/patient_repository.dart';
import 'patients_provider.dart';

part 'patients_notifier.g.dart';

@riverpod
class PatientsNotifier extends _$PatientsNotifier {
  PatientRepository get _repository => ref.read(patientRepositoryProvider);

  @override
  Stream<List<Patient>> build() {
    // Stream réactif — la liste se met à jour automatiquement après save()
    return ref.watch(patientRepositoryProvider).watchAll();
  }

  /// Crée un nouveau patient et le persiste.
  /// Lance une [ArgumentError] si le nom est vide.
  Future<void> createPatient({
    required String name,
    required DateTime dateOfBirth,
    required MorphologicalProfile morphologicalProfile,
  }) async {
    if (name.trim().isEmpty) {
      throw ArgumentError('Le nom du patient est requis.');
    }

    final patient = Patient(
      id: const Uuid().v4(),
      name: name.trim(),
      dateOfBirth: dateOfBirth,
      morphologicalProfile: morphologicalProfile,
      createdAt: DateTime.now().toUtc(),
    );

    await _repository.save(patient);
    // Le stream watchAll() émet automatiquement — pas de ref.invalidateSelf() nécessaire
  }
}
```

---

### Providers

```dart
// lib/features/patients/application/patients_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/database_provider.dart';
import '../data/drift_patient_repository.dart';
import '../data/patient_repository.dart';

/// Provider du Repository — retourne l'implémentation Drift.
/// RÈGLE : tous les providers dans {feature}_provider.dart UNIQUEMENT.
/// [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping]
final patientRepositoryProvider = Provider<PatientRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return DriftPatientRepository(db);
});
```

---

### Écran `CreatePatientScreen` — UI

```dart
// lib/features/patients/presentation/create_patient_screen.dart
// Éléments UX obligatoires :
// - Fond blanc (AppColors.surface)
// - Typographie SF Pro (AppTypography)
// - Marges 16pt (AppSpacing.margin)
// - Touch targets ≥ 44×44pt (AppSpacing.touchTarget)
// - Palette : primary #1B6FBF, error #FF3B30

// Champ nom
CupertinoTextField(
  placeholder: 'Nom complet',
  onChanged: (v) => setState(() => _name = v),
),
// Message d'erreur inline (AC4)
if (_showNameError)
  Text('Nom requis', style: TextStyle(color: AppColors.error, fontSize: 12)),

// Sélecteur date de naissance
CupertinoDatePicker(
  mode: CupertinoDatePickerMode.date,
  onDateTimeChanged: (date) => setState(() => _dateOfBirth = date),
  maximumDate: DateTime.now(),
),

// Sélecteur profil morphologique
CupertinoSegmentedControl<MorphologicalProfile>(
  children: const {
    MorphologicalProfile.standard:  Text('Standard'),
    MorphologicalProfile.obese:     Text('Obèse'),
    MorphologicalProfile.pediatric: Text('Pédiatrique'),
    MorphologicalProfile.elderly:   Text('Sénior'),
  },
  onValueChanged: (v) => setState(() => _profile = v),
  groupValue: _profile,
),

// Bouton de confirmation — touch target 44pt minimum
SizedBox(
  width: double.infinity,
  height: AppSpacing.touchTarget, // 44.0
  child: CupertinoButton.filled(
    child: const Text('Créer le patient'),
    onPressed: _isLoading ? null : _onConfirm,
  ),
),
```

**Gestion de l'état dans l'UI (switch exhaustif Dart 3 obligatoire) :**

```dart
// Dans le widget ConsumerWidget, pour afficher l'état de la liste après création
final patientsState = ref.watch(patientsNotifierProvider);

switch (patientsState) {
  case AsyncData(:final value) => PatientListWidget(patients: value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error: error),
}

// ❌ INTERDIT — ne jamais utiliser .when()
// patientsState.when(data: ..., loading: ..., error: ...)
```

---

### Règles d'architecture OBLIGATOIRES pour cette story

1. **UUID v4 côté Dart** — `const Uuid().v4()` — jamais `AUTOINCREMENT` ni séquence SQL
2. **Dates ISO 8601 en Drift** — `TextColumn`, valeur `'2026-03-05T14:30:00Z'` (UTC) — interdit : Unix timestamp entier
3. **Repository uniquement** — `PatientsNotifier` n'accède jamais à `_db.patientDao.findAll()` directement
4. **Providers dans `patients_provider.dart`** — jamais de `Provider` déclaré dans le Notifier ou l'écran
5. **Switch exhaustif** — sur `AsyncValue` et sealed classes — interdit : `.when()`, `.maybeWhen()`, `if (state.isLoading)`
6. **Tests co-localisés** — `drift_patient_repository_test.dart` dans `data/`, `patients_notifier_test.dart` dans `application/`
7. **MorphologicalProfile sérialisé en string** — `.name` pour l'écriture, `MorphologicalProfile.values.byName()` pour la lecture

---

### Anti-patterns explicites

```dart
// ❌ INTERDIT — accès DAO direct depuis le Notifier
class PatientsNotifier extends AsyncNotifier<List<Patient>> {
  Future<void> create(...) async {
    await ref.read(appDatabaseProvider).patientsDao.insert(...); // INTERDIT
  }
}

// ✅ CORRECT — via Repository
Future<void> createPatient(...) async {
  await _repository.save(patient); // via patientRepositoryProvider
}

// ❌ INTERDIT — AsyncValue.when()
patientsState.when(data: ..., loading: ..., error: ...);

// ✅ CORRECT — switch exhaustif Dart 3
switch (patientsState) {
  case AsyncData(:final value) => ...,
  case AsyncLoading()          => ...,
  case AsyncError(:final error) => ...,
}

// ❌ INTERDIT — Unix timestamp
createdAt: DateTime.now().millisecondsSinceEpoch // INTERDIT

// ✅ CORRECT — ISO 8601
createdAt: DateTime.now().toUtc().toIso8601String() // '2026-03-05T14:30:00.000Z'
```

---

### Structure des fichiers à créer / modifier

```
lib/features/patients/
├── data/
│   ├── patient_dao.dart                    ← NOUVEAU (table Drift + méthodes)
│   ├── patient_repository.dart             ← NOUVEAU (interface abstraite)
│   ├── patient_repository_test.dart        ← NOUVEAU (tests interface)
│   ├── drift_patient_repository.dart       ← NOUVEAU (implémentation Drift)
│   └── drift_patient_repository_test.dart  ← NOUVEAU (tests unitaires)
├── domain/
│   ├── patient.dart                        ← NOUVEAU (Freezed)
│   ├── patient.freezed.dart                ← GÉNÉRÉ (build_runner)
│   └── morphological_profile.dart         ← NOUVEAU (enum)
├── application/
│   ├── patients_notifier.dart              ← NOUVEAU (AsyncNotifier)
│   ├── patients_notifier.g.dart            ← GÉNÉRÉ (riverpod_generator)
│   ├── patients_notifier_test.dart         ← NOUVEAU (tests)
│   └── patients_provider.dart             ← NOUVEAU (providers)
└── presentation/
    ├── create_patient_screen.dart          ← NOUVEAU (écran création)
    ├── patients_screen.dart                ← À CRÉER (liste patients — stub si Story 2.2 pas commencée)
    └── widgets/
        └── patient_list_tile.dart          ← À CRÉER (stub vide)

lib/core/database/
└── app_database.dart                       ← MODIFIER (ajouter Patients table + index)
```

**Ne PAS implémenter dans cette story :**

- Recherche / filtrage par nom (Story 2.2)
- Sélection patient pour analyse (Story 2.2)
- Historique des analyses d'un patient (Story 2.3)
- Suppression patient (Story 2.4)
- Timeline de progression (Story 2.4)

---

### Testing — Exemples de tests attendus

```dart
// drift_patient_repository_test.dart
void main() {
  late AppDatabase db;
  late DriftPatientRepository repository;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory()); // Base en mémoire pour les tests
    repository = DriftPatientRepository(db);
  });

  tearDown(() => db.close());

  test('save() persiste un patient avec UUID v4 et createdAt ISO 8601', () async {
    final patient = Patient(
      id: const Uuid().v4(),
      name: 'Jean Dupont',
      dateOfBirth: DateTime(1975, 6, 15),
      morphologicalProfile: MorphologicalProfile.standard,
      createdAt: DateTime.utc(2026, 3, 5, 14, 30),
    );

    await repository.save(patient);

    final patients = await repository.watchAll().first;
    expect(patients, hasLength(1));
    expect(patients.first.id, matches(RegExp(r'^[0-9a-f-]{36}$'))); // UUID v4 format
    expect(patients.first.name, equals('Jean Dupont'));
    expect(patients.first.createdAt.isUtc, isTrue);
  });

  test('save() avec nom vide n\'est pas persisté', () async {
    expect(
      () => repository.save(Patient(id: const Uuid().v4(), name: '', ...)),
      // La validation se fait dans le Notifier — ici on peut tester le guard du Notifier
    );
  });
}
```

```dart
// patients_notifier_test.dart
void main() {
  test('createPatient() avec nom vide lance ArgumentError', () async {
    final container = ProviderContainer(
      overrides: [
        patientRepositoryProvider.overrideWith((ref) => MockPatientRepository()),
      ],
    );

    expect(
      () => container.read(patientsNotifierProvider.notifier).createPatient(
        name: '',
        dateOfBirth: DateTime(1975, 6, 15),
        morphologicalProfile: MorphologicalProfile.standard,
      ),
      throwsA(isA<ArgumentError>()),
    );
  });
}
```

---

### Conformité NFR

| NFR    | Critère                            | Couverture dans cette story                     |
| ------ | ---------------------------------- | ----------------------------------------------- |
| NFR-P6 | Chargement liste < 1s pour 500 pts | Index `idx_patients_name` défini dans le schéma |
| NFR-S1 | AES-256 pour toutes les données    | Drift + SQLCipher via `app_database.dart`       |
| NFR-S3 | Zéro requête réseau                | Architecture locale-first — aucun appel externe |
| NFR-R2 | Atomicité des écritures            | `into().insert()` Drift atomique par défaut     |
| NFR-R3 | Durabilité des données             | SQLite persisté — survit aux crashes            |

---

### Project Structure Notes

**Alignement avec la structure Feature-First définie en Story 1.1 :**

- Le dossier `lib/features/patients/` a été scaffoldé avec ses sous-dossiers `data/`, `domain/`, `application/`, `presentation/widgets/` lors de la Story 1.1 (T2.2 et T2.3). Les fichiers créés dans cette story s'insèrent dans cette structure existante sans modification structurelle.

**Modification de `app_database.dart` :**

- Ce fichier appartient à `core/database/` (cross-cutting). L'ajout de la table `Patients` et des index dans `allSchemaEntities` est la seule modification sur un fichier `core/` dans cette story.

**Schéma version :**

- `schemaVersion` reste à `1` (première table réelle créée). La stratégie MVP `MigrationStrategy.recreateTablesOnSchemaChanges()` est maintenue.

**Vérification de conflits :**

- Aucun conflit attendu avec Story 1.1 (pas de table créée en 1.1 — seulement des stubs).
- Aucun conflit avec Story 1.2 (biométrie — `core/auth/`) et 1.3 (SQLCipher init — `core/database/`). **Attention :** Si Story 1.3 n'est pas encore complétée, la base Drift sera non-chiffrée en dev (comportement attendu : `AppConfig.dev().useEncryptedDatabase == false`).

---

### References

- [Source: docs/planning-artifacts/epics.md#Story-2.1] — User story statement et Acceptance Criteria originaux
- [Source: docs/planning-artifacts/epics.md#FR1] — FR1 : création de profil patient (nom, date de naissance, profil morphologique)
- [Source: docs/planning-artifacts/epics.md#FR30] — FR30 : horodatage ISO 8601 obligatoire (`created_at`)
- [Source: docs/planning-artifacts/epics.md#NFR-P6] — NFR-P6 : liste patients < 1s pour 500 patients → index `idx_patients_name`
- [Source: docs/planning-artifacts/architecture.md#Architecture-des-données] — Drift + SQLCipher, `NativeDatabase.createInBackground`
- [Source: docs/planning-artifacts/architecture.md#Modèles-de-domaine-Freezed] — Freezed obligatoire pour toutes les entités
- [Source: docs/planning-artifacts/architecture.md#Abstraction-Repository] — Interface `PatientRepository` dès le MVP
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-format] — UUID v4 `TextColumn`, dates ISO 8601 string
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-nommage] — snake_case fichiers, PascalCase classes, camelCase variables
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-structure] — Structure `data/domain/application/presentation` obligatoire
- [Source: docs/planning-artifacts/architecture.md#Patterns-de-communication] — `switch` exhaustif sur `AsyncValue`, interdit `.when()`
- [Source: docs/planning-artifacts/architecture.md#Riverpod-règles-de-scoping] — `AsyncNotifier`, providers dans `{feature}_provider.dart`
- [Source: docs/planning-artifacts/architecture.md#Anti-patterns-explicites] — Accès DAO direct depuis Notifier interdit
- [Source: docs/planning-artifacts/architecture.md#Gap-critique-2-résolu] — Index Drift `idx_patients_name` et `idx_analyses_patient`
- [Source: docs/planning-artifacts/architecture.md#Arborescence-complète-du-projet] — Chemins exacts des fichiers à créer
- [Source: docs/planning-artifacts/ux-design-specification.md] — Palette Clinical White, touch target 44pt, marges 16pt, SF Pro

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

Exemples attendus (non-exhaustif) :

- `lib/features/patients/domain/patient.dart` — created
- `lib/features/patients/domain/patient.freezed.dart` — generated
- `lib/features/patients/domain/morphological_profile.dart` — created
- `lib/features/patients/data/patient_dao.dart` — created
- `lib/features/patients/data/patient_repository.dart` — created
- `lib/features/patients/data/drift_patient_repository.dart` — created
- `lib/features/patients/data/drift_patient_repository_test.dart` — created
- `lib/features/patients/application/patients_notifier.dart` — created
- `lib/features/patients/application/patients_notifier.g.dart` — generated
- `lib/features/patients/application/patients_notifier_test.dart` — created
- `lib/features/patients/application/patients_provider.dart` — created
- `lib/features/patients/presentation/create_patient_screen.dart` — created
- `lib/features/patients/presentation/patients_screen.dart` — created (stub)
- `lib/core/database/app_database.dart` — modified (Patients table + indexes)
