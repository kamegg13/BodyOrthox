# Story arch-1: Interface AnalysisModule

Status: done

## Story

As a developer building the BodyOrthox plugin architecture,
I want a common `AnalysisModule` abstract interface and an `AnalysisRegistry` that maps module IDs to their implementations,
so that adding a new analysis type (HKA, Cobb, femoral axis...) requires only creating a new module class — zero changes to the app core.

## Acceptance Criteria

1. **Given** `core/analysis/analysis_module.dart` est créé **When** le fichier est compilé **Then** la classe abstraite `AnalysisModule` expose exactement trois membres : `String get moduleId`, `String get displayName`, et `Future<AnalysisResult> analyze(XFile photo)`.

2. **Given** `core/analysis/analysis_registry.dart` est créé **When** `register(module)` est appelé avec un `AnalysisModule` **Then** le module est stocké dans la map interne indexée par `module.moduleId`.

3. **Given** un module est enregistré **When** `AnalysisRegistry.get('hka')` est appelé avec l'ID correspondant **Then** le module est retourné.

4. **Given** `AnalysisRegistry.get()` est appelé avec un ID non enregistré **When** la méthode s'exécute **Then** `null` est retourné (type de retour `AnalysisModule?`).

5. **Given** un module est enregistré **When** un second module avec le même `moduleId` est enregistré **Then** le second écrase le premier (last-write-wins — comportement intentionnel).

6. **Given** un `MockAnalysisModule` qui implémente `AnalysisModule` est créé dans les tests **When** les tests unitaires de `AnalysisRegistry` s'exécutent **Then** tous les tests passent.

7. **Given** `analysisRegistryProvider` est déclaré dans `core/analysis/analysis_provider.dart` **When** un `Notifier` dans une feature fait `ref.read(analysisRegistryProvider)` **Then** il obtient l'instance singleton du Registry.

8. **Given** `AnalysisResult` est une sealed class **When** elle est définie **Then** elle vit dans `core/analysis/analysis_result.dart` (et non dans `capture/domain/`) — car `AnalysisResult` est le type de retour commun à tous les modules d'analyse.

## Tasks / Subtasks

- [x] Tâche 1 — Créer `core/analysis/analysis_result.dart` : sealed class `AnalysisResult` (AC: #8)
  - [x] Définir `sealed class AnalysisResult`
  - [x] Implémenter `final class AnalysisSuccess extends AnalysisResult` avec `final Map<String, double> measurements` (générique, module-agnostic)
  - [x] Implémenter `final class AnalysisFailure extends AnalysisResult` avec `final AnalysisError error;`
  - [x] Implémenter `sealed class AnalysisError` + ses sous-classes : `MLLowConfidence(double score)`, `MLDetectionFailed()`, `PhotoProcessingError(String cause)`
  - [x] Écrire `core/analysis/analysis_result_test.dart` — valider pattern matching exhaustif

- [x] Tâche 2 — Créer `core/analysis/analysis_module.dart` : abstract class (AC: #1)
  - [x] Déclarer `abstract class AnalysisModule`
  - [x] Ajouter `String get moduleId` (identifiant unique, ex : `'hka'`)
  - [x] Ajouter `String get displayName` (label UI, ex : `'Analyse HKA'`)
  - [x] Ajouter `Future<AnalysisResult> analyze(XFile photo)` — importe `XFile` via `package:cross_file/cross_file.dart` (transitive dep disponible)

- [x] Tâche 3 — Créer `core/analysis/analysis_registry.dart` : Registry pattern (AC: #2, #3, #4, #5)
  - [x] Déclarer `class AnalysisRegistry`
  - [x] Implémenter `final Map<String, AnalysisModule> _modules = {}`
  - [x] Implémenter `void register(AnalysisModule module)` → `_modules[module.moduleId] = module`
  - [x] Implémenter `AnalysisModule? get(String moduleId)` → `_modules[moduleId]`
  - [x] Implémenter `List<AnalysisModule> get all` → `_modules.values.toList()` (pour lister les modules disponibles dans l'UI)

- [x] Tâche 4 — Créer `core/analysis/analysis_provider.dart` : Riverpod provider (AC: #7)
  - [x] Déclarer `final analysisRegistryProvider = Provider<AnalysisRegistry>((ref) => AnalysisRegistry())`
  - [x] **Note :** Les modules concrets (ex : `HKAModule`) sont enregistrés dans `app.dart` au lancement, pas dans ce provider — le provider expose uniquement le Registry vide. L'enregistrement est fait dans la couche de composition (Story arch-2).

- [x] Tâche 5 — Écrire les tests unitaires (AC: #6)
  - [x] Créer `core/analysis/analysis_registry_test.dart`
  - [x] Test : register + get retourne le bon module
  - [x] Test : get avec ID inconnu retourne null
  - [x] Test : register deux modules même ID → second écrase le premier
  - [x] Test : `all` retourne la liste de tous les modules enregistrés
  - [x] Créer un `MockAnalysisModule` dans le fichier de test (pas de dépendance externe)

## Dev Notes

### Contexte Architecture Plugin

Cette story implémente le fondement du pattern plugin décrit dans la `Section 4.3` du sprint-change-proposal. **L'invariant clé :** le core de l'app ne connaît jamais les modules concrets — il ne connaît que l'interface `AnalysisModule` et le `AnalysisRegistry`. Les modules concrets (`HKAModule`, futurs modules) sont injectés au lancement dans `app.dart`.

### Décision clé : AnalysisResult dans `core/`

L'architecture d'origine (`architecture.md`) place `analysis_result.dart` dans `features/capture/domain/`. Avec le pivot plugin, ce fichier **doit être déplacé dans `core/analysis/`** car :

- `AnalysisModule` (dans `core/`) retourne `AnalysisResult` → dépendance montante impossible si `AnalysisResult` est dans une `feature/`
- `AnalysisResult` est désormais le type de retour commun à tous les modules → c'est un type core, pas un type feature

**Les sealed classes `AnalysisError` connexes migrent aussi dans `core/analysis/`.**

### XFile — source de vérité

`XFile` vient du package `image_picker` (pas de `camera` plugin). À ajouter dans `pubspec.yaml` :

```yaml
dependencies:
  image_picker: ^1.1.2 # ou dernière version stable
```

Le `analyze(XFile photo)` transmet le fichier photo capturé par `image_picker` (Story 3.0) directement au module d'analyse.

### Enregistrement des modules — couche de composition

L'enregistrement des modules concrets se fait dans `app.dart` (ou `main_dev.dart`/`main_prod.dart`) **après** l'implémentation des modules concrets (Story arch-2). Pour cette story, le Registry est livré vide — les tests utilisent un `MockAnalysisModule` en ligne.

Exemple de composition prévu (Story arch-2) :

```dart
// Dans app.dart — ProviderScope overrides
ProviderScope(
  overrides: [
    analysisRegistryProvider.overrideWith((ref) {
      final registry = AnalysisRegistry();
      registry.register(HKAModule(poseDetector: GoogleMlKit.vision.poseDetector()));
      return registry;
    }),
  ],
  child: const BodyOrthoxApp(),
)
```

### Structure Feature-First — règle de nommage

Conformément à `architecture.md#Patterns de nommage` :

- Fichier : `analysis_module.dart` (snake_case) ✅
- Classe : `AnalysisModule` (PascalCase) ✅
- Provider : `analysisRegistryProvider` (camelCase + suffixe `Provider`) ✅

### Tests — co-location obligatoire

```
core/analysis/analysis_module.dart
core/analysis/analysis_registry.dart
core/analysis/analysis_registry_test.dart    ← co-localisé
core/analysis/analysis_result.dart
core/analysis/analysis_result_test.dart      ← co-localisé
core/analysis/analysis_provider.dart
```

Interdit : dossier `test/` séparé miroir.

### Dépendances de cette story

- **Prérequis :** Aucun (première story à implémenter post-reset codebase)
- **Bloque :** Story arch-2 (HKAModule — implémentation concrète), Story 3.0 (capture photo), Story 3.3 (pipeline ML HKA)

### Sealed classes Dart 3 — switch exhaustif

Le pattern de match sur `AnalysisResult` dans toute l'app suit obligatoirement ce format :

```dart
// ✅ OBLIGATOIRE
switch (result) {
  case AnalysisSuccess(:final angles) => showResults(angles),
  case AnalysisFailure(:final error)  => showError(error),
}

// ✅ AnalysisError — switch exhaustif aussi
switch (error) {
  case MLLowConfidence(:final score) => promptManualCorrection(score),
  case MLDetectionFailed()           => showRetryPrompt(),
  case PhotoProcessingError(:final cause) => showTechnicalError(cause),
}
```

### Project Structure Notes

**Nouveau répertoire à créer (ne figure pas dans l'arborescence originale `architecture.md`) :**

```
lib/
  core/
    analysis/                    ← NOUVEAU (Sprint Change 2026-03-08)
      analysis_module.dart
      analysis_registry.dart
      analysis_provider.dart
      analysis_result.dart       ← migré depuis capture/domain/ (voir décision ci-dessus)

test/
  core/
    analysis/                    ← Tests co-localisés en convention projet
      analysis_result_test.dart
      analysis_registry_test.dart
      analysis_provider_test.dart
```

> **Note (2026-03-08 — code review)** : Les tests ont été déplacés de `lib/core/analysis/` vers
> `test/core/analysis/` pour que `flutter test` les découvre automatiquement. Convention projet :
> miroir `test/` suivant la structure de `lib/` (et non co-location dans `lib/` qui les rendait
> invisibles à la discovery standard).

**Conflit avec `architecture.md` :** `analysis_result.dart` était prévu dans `features/capture/domain/`. Cette story corrige ce placement — documenter le changement dans `architecture.md` après implémentation.

### Imports requis

```dart
// analysis_module.dart
import 'package:cross_file/cross_file.dart'; // dep directe (cross_file ^0.3.5)
import 'analysis_result.dart';

// analysis_registry.dart
import 'analysis_module.dart';

// analysis_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'analysis_registry.dart';
```

> **Note (2026-03-08)** : l'import original documentait `package:image_picker/image_picker.dart`
> (non présent dans pubspec.yaml). Le Dev Agent a utilisé `cross_file` (transitive dep de `camera`).
> Suite au code review, `cross_file: ^0.3.5` est désormais déclaré comme dep directe dans `pubspec.yaml`.

### References

- [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section 4.3 Architecture] — définition de `AnalysisModule` et `AnalysisRegistry`
- [Source: docs/planning-artifacts/sprint-change-proposal-2026-03-08.md#Section 4.1 Epics & Stories] — Story A.1 description
- [Source: docs/planning-artifacts/architecture.md#Communication & Gestion des erreurs] — sealed classes `AnalysisResult`, `AnalysisError`
- [Source: docs/planning-artifacts/architecture.md#Patterns de nommage] — conventions snake_case / PascalCase / camelCase
- [Source: docs/planning-artifacts/architecture.md#Patterns de structure] — structure `data/domain/application/presentation`
- [Source: docs/planning-artifacts/architecture.md#Patterns de communication] — switch exhaustif AsyncValue
- [Source: docs/brainstorming/brainstorming-session-2026-03-08-1000.md#ARCH #1] — rationale architecture plugin
- [Source: docs/implementation-artifacts/sprint-status.yaml] — séquence : Epic 1 → Epic Architecture → Epic 3

## Mockup de référence

Aucun mockup UI pour cette story — implémentation purement technique (couche core, aucun composant UI).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `cross_file` disponible comme transitive dep de `camera` — `XFile` importable via `package:cross_file/cross_file.dart` sans ajouter `image_picker` à pubspec (différé à Story 3.0)
- `AnalysisSuccess.measurements` changé de `ArticularAngles` à `Map<String, double>` — décision architecturale pour généricité : toutes mesures en map nommée, compatible tous modules
- Régression pré-existante : 1 test `biometric_notifier_test.dart` (Story 1.2, retirée MVP) — non introduite par cette story

### Completion Notes List

- ✅ AC1 : `abstract class AnalysisModule` défini avec `moduleId`, `displayName`, `analyze(XFile)` — compilé sans erreur
- ✅ AC2, AC3 : `AnalysisRegistry.register()` + `get()` testés et verts
- ✅ AC4 : `get()` retourne `null` pour ID inconnu (type `AnalysisModule?`) — testé
- ✅ AC5 : last-write-wins pour même `moduleId` — testé
- ✅ AC6 : `_MockAnalysisModule` inline dans `analysis_registry_test.dart` — 8 tests verts
- ✅ AC7 : `analysisRegistryProvider` — Provider Riverpod, `ProviderScope.overrides` validé — 3 tests verts
- ✅ AC8 : `AnalysisResult` + `AnalysisError` dans `core/analysis/` — 11 tests verts
- **22/22 tests verts** dans `core/analysis/` — aucune régression introduite

### Change Log

- 2026-03-08 : Implémentation Story arch-1 — création `core/analysis/` avec interface plugin AnalysisModule, AnalysisRegistry, analysisRegistryProvider, AnalysisResult générique
- 2026-03-08 (code review) : 4 findings résolus — tests migrés `lib/` → `test/core/analysis/` (discovery `flutter test`), `cross_file ^0.3.5` déclaré dep directe, doc `Imports requis` corrigée, limitation mutabilité `measurements` documentée

### File List

- `bodyorthox/lib/core/analysis/analysis_result.dart` — CRÉÉ
- `bodyorthox/lib/core/analysis/analysis_module.dart` — CRÉÉ
- `bodyorthox/lib/core/analysis/analysis_registry.dart` — CRÉÉ
- `bodyorthox/lib/core/analysis/analysis_provider.dart` — CRÉÉ
- `bodyorthox/test/core/analysis/analysis_result_test.dart` — CRÉÉ (déplacé depuis lib/ — code review)
- `bodyorthox/test/core/analysis/analysis_registry_test.dart` — CRÉÉ (déplacé depuis lib/ — code review)
- `bodyorthox/test/core/analysis/analysis_provider_test.dart` — CRÉÉ (déplacé depuis lib/ — code review)
- `bodyorthox/pubspec.yaml` — MODIFIÉ : `cross_file: ^0.3.5` ajouté en dep directe
