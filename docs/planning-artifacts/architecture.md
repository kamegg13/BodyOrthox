---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: "complete"
completedAt: "2026-03-05"
inputDocuments:
  - docs/planning-artifacts/prd.md
  - docs/planning-artifacts/product-brief-BodyOrthox-2026-03-03.md
  - docs/planning-artifacts/ux-design-specification.md
  - docs/planning-artifacts/research/technical-bodyorthox-stack-research-2026-03-02.md
  - docs/planning-artifacts/prd-validation-report.md
workflowType: "architecture"
project_name: "BodyOrthox"
user_name: "Karimmeguenni-tani"
date: "2026-03-04"
---

# Architecture Decision Document

_Ce document se construit collaborativement étape par étape. Les sections sont ajoutées au fur et à mesure de nos décisions architecturales communes._

## Analyse du Contexte Projet

### Vue d'ensemble des exigences

**Exigences Fonctionnelles :**
40 FRs organisées en 7 catégories : Gestion Patients (FR1-FR6), Capture & Guidage (FR7-FR12), Analyse ML On-Device (FR13-FR19), Rapport & Export (FR20-FR25), Sécurité & Confidentialité (FR26-FR30), Monétisation & Accès (FR31-FR35), Onboarding & UX (FR36-FR40).

Le cœur fonctionnel est le pipeline ML : capture vidéo → extraction pose (Google ML Kit 97.2% PCK) → calcul angles articulaires (genou, hanche, cheville) → score de confiance → affichage résultats → export PDF. Ce flux doit s'exécuter en <30s, 100% on-device, sans aucune transmission de données.

**Exigences Non-Fonctionnelles critiques :**

| NFR    | Critère                         | Impact architectural                |
| ------ | ------------------------------- | ----------------------------------- |
| NFR-P1 | Analyse < 30s (95% des cas)     | Pipeline ML en isolate Flutter      |
| NFR-P2 | ≥ 58 FPS UI constant            | Impeller activé, UI thread isolé    |
| NFR-P5 | Latence overlay caméra < 100ms  | Traitement frame temps réel         |
| NFR-S1 | AES-256 pour toutes les données | Drift + SQLCipher, clé Keychain iOS |
| NFR-S5 | Vidéo brute jamais sur disque   | Traitement en mémoire uniquement    |
| NFR-R2 | Atomicité analyses              | Transactions Drift obligatoires     |
| NFR-R4 | Taux d'échec ML < 5%            | Mode correction manuelle (fallback) |

**Échelle & Complexité :**

- Domaine primaire : Application mobile iOS (Flutter)
- Niveau de complexité : **Haute** — ML médical réglementé, sécurité forte, UX temps réel, pipeline asynchrone
- Composants architecturaux estimés : 6-8 feature modules distincts
- Contexte : Greenfield, solo developer + Claude Code

### Contraintes Techniques & Dépendances

| Contrainte                  | Détail                                    | Implication                                                 |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| **100% Offline**            | Zéro réseau MVP — aucune requête sortante | Pas de BaaS, pas d'APNs, tout local                         |
| **iOS 16+ uniquement**      | Impeller stable, ML Kit performant        | Pas de support Android MVP                                  |
| **Vidéo en mémoire**        | Jamais écrite sur disque non chiffré      | Memory management critique pendant l'analyse                |
| **Modèles ML embarqués**    | ML Kit bundlé dans l'app (~40-60 MB)      | App bundle cible < 150 MB total                             |
| **Distribution TestFlight** | MVP uniquement — pas App Store            | Pas de contrainte catégorie Medical/Productivity en Phase 1 |
| **IAP RevenueCat**          | Freemium 10 analyses/mois → 39-49€/mois   | Gestion état abonnement local + vérification RevenueCat     |

**Stack technique validée par la recherche :**
Flutter 3.x + Impeller · Google ML Kit (pose detection) · Drift + SQLCipher (AES-256) · Riverpod 3.0 (AsyncNotifier) · RevenueCat (flutter_purchases) · local_auth (biométrie) · flutter_local_notifications · pdf package

### Cross-Cutting Concerns Identifiés

1. **Sécurité & confidentialité** — traverse tout : authentification biométrique, stockage chiffré, capture vidéo en mémoire, export PDF avec disclaimer
2. **State machine du pipeline ML** — état global `idle → capturing → processing → results → exported` accessible depuis UI et background isolate
3. **Performance dual-thread** — 58 FPS UI maintenu pendant que le pipeline ML tourne en background (deux contraintes en tension)
4. **Conformité réglementaire EU MDR** — disclaimer non-modifiable sur chaque rapport, formulations UI contrôlées, horodatage traçable
5. **Atomicité des données** — aucune analyse partielle persistée (transactions Drift), cohérence garantie même en cas de crash

## Évaluation du Starter Template

### Domaine Primaire

Application mobile iOS (Flutter) — stack ML on-device spécialisée, architecture locale-first.

### Options Considérées

| Option                                           | Inclus             | Manque                                     | Verdict        |
| ------------------------------------------------ | ------------------ | ------------------------------------------ | -------------- |
| `flutter create --platforms ios`                 | Minimal iOS clean  | Architecture, packages                     | ✅ Recommandé  |
| Very Good CLI                                    | Flavors, tests, CI | BLoC au lieu de Riverpod, multi-plateforme | ⚠️ Trop opinié |
| Community starters (Erengun, SimpleBoilerplates) | Riverpod + Freezed | Drift, maintenance incertaine              | ❌ Écarté      |

### Starter Sélectionné : `flutter create` minimal iOS

**Rationale :** La stack BodyOrthox est entièrement définie par la recherche technique préalable (Riverpod 3.0, Drift + SQLCipher, Google ML Kit, go_router). Un starter générique imposerait des décisions à remplacer plutôt qu'à utiliser. L'architecture Feature-First est scaffoldée manuellement.

**Commande d'initialisation :**

```bash
flutter create \
  --org com.bodyorthox \
  --platforms ios \
  --project-name bodyorthox \
  bodyorthox
```

**Décisions architecturales fournies par le starter :**

**Langage & Runtime :** Dart 3.x, null safety activé, targets iOS 16+ via Podfile

**Structure de base :** `lib/main.dart` + dossiers iOS natifs — à restructurer immédiatement en Feature-First

**Tooling de build :** Xcode toolchain, Impeller activé par défaut sur iOS 16+

**Testing :** `flutter_test` inclus par défaut, à étendre avec `mocktail` + `riverpod_test`

**Flavors (ajout manuel prioritaire) :** Configuration `dev` / `prod` pour isoler RevenueCat sandbox vs production et ML Kit logging

**Note :** L'initialisation du projet avec cette commande + la mise en place immédiate de la structure Feature-First constituent la première story d'implémentation.

## Décisions Architecturales de Base

### Analyse des priorités de décision

**Décisions critiques (bloquent l'implémentation) :**

- Gestion des erreurs (pipeline ML a des états d'échec typés)
- Stratégie vidéo en mémoire (NFR-S5 non négociable)
- Abstraction Repository (impact architecture jour 1)

**Décisions importantes (forment l'architecture) :**

- Modèles de domaine (immutabilité des données médicales)
- CI/CD pour TestFlight

**Décisions différées (post-MVP) :**

- Intégration DPI/HL7-FHIR
- Migration cloud / PowerSync
- Support Android

### Architecture des données

**ORM & Chiffrement :**

- Drift (version courante stable) + `sqlcipher_flutter_libs` pour SQLite chiffré AES-256
- Clé dérivée via PRAGMA key, stockée dans le Keychain iOS (jamais en mémoire persistante)
- `NativeDatabase.createInBackground` pour éviter le blocage UI thread
- Transactions Drift obligatoires sur toutes les écritures d'analyse (NFR-R2 — atomicité)

**Abstraction Repository — Interface dès le MVP :**

```dart
abstract class PatientRepository {
  Stream<List<Patient>> watchAll();
  Future<void> save(Patient patient);
  Future<void> delete(PatientId id);
}
class DriftPatientRepository implements PatientRepository { ... }
```

Rationale : +20% code Day 1, migration PowerSync (cloud Phase 2) triviale sans refacto.

**Modèles de domaine — Freezed :**

- Toutes les entités (Patient, Analysis, ArticularAngles, ConfidenceScore) sont des value objects Freezed
- Immutabilité garantie pour les données médicales
- `copyWith`, `==`, `fromJson/toJson` auto-générés via build_runner

### Authentification & Sécurité

| Décision            | Choix                                                  | Rationale                                      |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Authentification    | `local_auth` — Face ID / Touch ID                      | Biométrie iOS native, zéro auth propriétaire   |
| Chiffrement données | AES-256 SQLCipher via sqlcipher_flutter_libs           | NFR-S1 — aucune donnée patient en clair        |
| Clé de chiffrement  | Keychain iOS (`flutter_secure_storage`)                | NFR-S4 — jamais exposée en mémoire persistante |
| Vidéo brute         | Isolate Flutter + stream frames                        | NFR-S5 — vidéo jamais écrite sur disque        |
| Session             | Biométrie à chaque ouverture — pas de token persistant | Conformité RGPD + EU MDR                       |

**Stratégie vidéo en mémoire (critique NFR-S5) :**

- Frames extraits via camera plugin → envoyés par `SendPort` vers un Flutter isolate dédié
- Le pipeline ML (Google ML Kit) tourne entièrement dans l'isolate
- À la fin de l'isolate : résultats envoyés au UI thread, mémoire libérée automatiquement
- Aucune écriture disque à aucun moment — la vidéo n'existe que dans la RAM de l'isolate

### Communication & Gestion des erreurs

**Pas d'API réseau (MVP 100% offline).**

**Pattern erreurs — Sealed classes Dart 3 :**

```dart
sealed class AnalysisResult {
  const AnalysisResult();
}
final class AnalysisSuccess extends AnalysisResult {
  final ArticularAngles angles;
  const AnalysisSuccess(this.angles);
}
final class AnalysisFailure extends AnalysisResult {
  final AnalysisError error;
  const AnalysisFailure(this.error);
}

sealed class AnalysisError {
  const AnalysisError();
}
final class MLLowConfidence extends AnalysisError { ... }
final class MLDetectionFailed extends AnalysisError { ... }
final class VideoProcessingError extends AnalysisError { ... }
```

- Switch exhaustif obligatoire → tous les cas d'erreur couverts à la compilation
- Pas de dépendance externe (fpdart écarté) — idiomatique Dart 3
- AsyncValue Riverpod gère l'état loading/error/data au niveau UI

### Architecture Frontend (Flutter)

**State management — Riverpod 3.2.1 :**

- `AsyncNotifier` pour tous les états asynchrones (pipeline ML, chargement patients)
- `NotifierProvider` pour l'état synchrone (compteur freemium, session biométrique)
- Scoping providers au niveau feature — pas de providers globaux sauf sécurité/auth

**Structure Feature-First :**

```
lib/
  core/               # Cross-cutting (auth, storage, error types)
  features/
    patients/         # FR1-FR6
    capture/          # FR7-FR12 + pipeline ML FR13-FR19
    results/          # FR15-FR18 + vue expert/simple
    report/           # FR20-FR25 PDF generation
    paywall/          # FR31-FR35 RevenueCat
    onboarding/       # FR36-FR37
  shared/             # Widgets partagés, design system
```

**Routing — go_router 17.x :**

- Routes déclaratives, navigation type-safe avec go_router_builder
- Deep link vers une analyse spécifique (depuis notification locale)

**Build_runner / Code generation :**

- Freezed (modèles) + Drift (schema) + riverpod_generator + go_router_builder
- `dart run build_runner build --delete-conflicting-outputs` comme commande standard

### Infrastructure & Déploiement

**CI/CD — Manuel Xcode pour le MVP :**

- Archive + upload via Transporter ou Organizer Xcode
- Pas de setup CI/CD complexe pour la phase early-adopters (15-20 praticiens)
- Décision différée : GitHub Actions + Fastlane à mettre en place en Phase 2

**Flavors — dev / prod (ajout manuel prioritaire) :**

- `dev` : RevenueCat sandbox, logs ML, SQLite non-chiffré optionnel pour debug
- `prod` : RevenueCat production, no logs, SQLCipher activé

**Distribution MVP :** TestFlight uniquement — pas de soumission App Store Phase 1

### Analyse d'impact des décisions

**Séquence d'implémentation imposée par les décisions :**

1. `flutter create` → structure Feature-First → flavors dev/prod
2. Core : SQLCipher + Keychain setup → `local_auth` biométrie
3. Feature `patients` : Repository interface + DriftPatientRepository
4. Feature `capture` : isolate ML + pipeline vidéo mémoire
5. Feature `results` + `report` : sealed classes + PDF generation
6. Feature `paywall` : RevenueCat integration

**Dépendances croisées entre décisions :**

- Sealed classes AnalysisResult → dépendance entre `capture`, `results`, `report`
- Repository interface → Drift impl doit respecter le contrat dès le début
- Isolate ML → le state machine `idle → capturing → processing → results → exported` est géré par un `AsyncNotifier` dans `capture`

## Patterns d'Implémentation & Règles de Cohérence

### Points de conflit identifiés

7 zones où des agents IA pourraient faire des choix incompatibles sans règles explicites.

### Patterns de nommage

**Fichiers Dart — snake_case systématique :**

```
patient_repository.dart       ✅
PatientRepository.dart        ❌
patientRepository.dart        ❌
```

**Classes — PascalCase :**

```dart
class PatientRepository { }    ✅
class patient_repository { }   ❌
```

**Variables & fonctions — camelCase :**

```dart
final patientId = ...;         ✅
void watchAllPatients() { }    ✅
final patient_id = ...;        ❌
```

**Providers Riverpod — camelCase + suffixe `Provider` :**

```dart
final patientsProvider = ...;        ✅
final captureStateProvider = ...;    ✅
final PatientProvider = ...;         ❌
final patientList = ...;             ❌
```

**Tables Drift — snake_case pluriel :**

```dart
class Patients extends Table { }         // nom Dart PascalCase
static const String tableName = 'patients'; // snake_case pluriel en SQL
// colonnes : patient_id, created_at, confidence_score
```

**Feature folders — snake_case :**

```
features/patients/    ✅
features/Patients/    ❌
features/patient/     ❌ (pluriel obligatoire)
```

### Patterns de structure

**Structure feature obligatoire :**

```
features/{feature_name}/
  data/
    {feature}_repository.dart          # Interface abstraite
    drift_{feature}_repository.dart    # Implémentation Drift
    {feature}_dao.dart                 # DAO Drift
  domain/
    {entity}.dart                      # Modèle Freezed
    {feature}_error.dart               # Sealed errors
  application/
    {feature}_notifier.dart            # AsyncNotifier
    {feature}_provider.dart            # Provider declarations
  presentation/
    {feature}_screen.dart
    widgets/
      {widget_name}.dart
```

**Tests — co-location obligatoire :**

```
features/patients/data/patient_repository.dart
features/patients/data/patient_repository_test.dart   ← co-localisé
features/patients/application/patients_notifier_test.dart
```

Interdit : dossier `test/` séparé miroir de `lib/`.

### Patterns de format

**Dates — ISO 8601 string en base :**

```dart
// Stockage Drift : TextColumn
// Valeur : '2026-03-05T14:30:00Z'
// Dart : DateTime.parse(row.createdAt)
```

Interdit : Unix timestamp entier.

**Angles articulaires — double en degrés, 1 décimale :**

```dart
final kneeAngle = 42.3; // degrés
// Affichage : '42.3°'
```

**IDs — UUID v4, TextColumn Drift :**

```dart
import 'package:uuid/uuid.dart';
final id = const Uuid().v4(); // génération côté Dart
// Drift : TextColumn get id => text()();
```

### Patterns de communication

**AsyncValue en UI — switch exhaustif Dart 3 (obligatoire) :**

```dart
// ✅ CORRECT
switch (state) {
  case AsyncData(:final value) => ContentWidget(value),
  case AsyncLoading()          => const LoadingSpinner(),
  case AsyncError(:final error) => ErrorWidget(error),
}

// ❌ INTERDIT
state.when(data: ..., loading: ..., error: ...);
state.maybeWhen(...);
if (state.isLoading) ...
```

**State machine pipeline ML — sealed class obligatoire :**

```dart
sealed class CaptureState { const CaptureState(); }
final class CaptureIdle     extends CaptureState { const CaptureIdle(); }
final class CaptureRecording extends CaptureState { const CaptureRecording(); }
final class CaptureProcessing extends CaptureState { const CaptureProcessing(); }
final class CaptureCompleted extends CaptureState {
  final AnalysisResult result;
  const CaptureCompleted(this.result);
}
final class CaptureFailed extends CaptureState {
  final AnalysisError error;
  const CaptureFailed(this.error);
}
```

**Riverpod — règles de scoping :**

- `AsyncNotifier<T>` pour tout état asynchrone — `StateNotifier` et `ChangeNotifier` interdits
- Providers déclarés dans `{feature}_provider.dart` uniquement
- Providers globaux : **uniquement** dans `core/` (auth, db connection)
- Accès base de données : via Repository uniquement — accès DAO direct depuis un Notifier interdit

### Patterns de processus

**Biométrie — pattern core obligatoire :**

```
core/auth/biometric_guard.dart    ← vérification centralisée
```

- Vérification via `go_router` redirect — pas dans les features
- Interdit : checks biométriques dans les widgets ou Notifiers individuels

**Disclaimer EU MDR — constante unique :**

```dart
// core/legal/legal_constants.dart
abstract class LegalConstants {
  static const String mdrDisclaimer =
    'BodyOrthox est un outil de documentation clinique. '
    'Les données produites ne constituent pas un acte de '
    'diagnostic médical et ne se substituent pas au jugement '
    'clinique du praticien.';
}
```

Interdit : texte du disclaimer inline dans les widgets ou le PDF generator.

**Gestion erreurs ML — AnalysisError sealed :**

```dart
sealed class AnalysisError { const AnalysisError(); }
final class MLLowConfidence  extends AnalysisError { final double score; const MLLowConfidence(this.score); }
final class MLDetectionFailed extends AnalysisError { const MLDetectionFailed(); }
final class VideoProcessingError extends AnalysisError { final String cause; const VideoProcessingError(this.cause); }
```

### Règles d'application — tous les agents DOIVENT

1. Respecter la structure `data/domain/application/presentation` dans chaque feature
2. Utiliser `switch` exhaustif sur `AsyncValue` et toutes les sealed classes
3. Nommer les fichiers en snake_case, les classes en PascalCase
4. Déclarer les providers dans `{feature}_provider.dart` uniquement
5. Utiliser `LegalConstants.mdrDisclaimer` — jamais de texte inline
6. Co-localiser les tests avec les fichiers source
7. Stocker les dates en ISO 8601 string, les IDs en UUID v4 string
8. Accéder aux données uniquement via le Repository — jamais via le DAO directement

### Anti-patterns explicites

```dart
// ❌ DAO direct depuis un Notifier
class PatientsNotifier extends AsyncNotifier<List<Patient>> {
  Future<void> load() async {
    state = await ref.read(driftDbProvider).patientDao.findAll(); // INTERDIT
  }
}

// ✅ Via Repository
class PatientsNotifier extends AsyncNotifier<List<Patient>> {
  Future<void> load() async {
    state = AsyncData(await ref.read(patientRepositoryProvider).findAll());
  }
}
```

```dart
// ❌ Disclaimer inline
Text('BodyOrthox est un outil de documentation...')  // INTERDIT

// ✅ Constante centralisée
Text(LegalConstants.mdrDisclaimer)
```

## Structure du Projet & Frontières Architecturales

### Mapping des exigences → composants

| FRs        | Feature                    | Répertoire                                |
| ---------- | -------------------------- | ----------------------------------------- |
| FR1-FR6    | Gestion patients           | `features/patients/`                      |
| FR7-FR12   | Capture guidée             | `features/capture/presentation/`          |
| FR13-FR19  | Pipeline ML + isolate      | `features/capture/data/` + `application/` |
| FR15, FR18 | Résultats + replay         | `features/results/`                       |
| FR20-FR25  | Rapport PDF                | `features/report/`                        |
| FR26       | Biométrie                  | `core/auth/`                              |
| FR27-FR30  | Chiffrement + offline      | `core/database/`                          |
| FR31-FR35  | Freemium + IAP             | `features/paywall/`                       |
| FR36-FR37  | Onboarding                 | `features/onboarding/`                    |
| FR38-FR40  | Vue expert/simple + notifs | `features/results/` + `core/config/`      |

### Arborescence complète du projet

```
bodyorthox/
├── pubspec.yaml
├── analysis_options.yaml
├── .gitignore
├── ios/
│   ├── Runner/
│   │   ├── AppDelegate.swift
│   │   └── Info.plist
│   ├── Runner.xcodeproj/
│   └── Podfile
├── lib/
│   ├── main_dev.dart                      # Entry point flavor dev
│   ├── main_prod.dart                     # Entry point flavor prod
│   ├── app.dart                           # ProviderScope + MaterialApp + router
│   ├── core/
│   │   ├── auth/
│   │   │   ├── biometric_guard.dart       # go_router redirect (FR26)
│   │   │   ├── biometric_service.dart
│   │   │   └── biometric_service_test.dart
│   │   ├── database/
│   │   │   ├── app_database.dart          # Drift DB + SQLCipher (FR27-FR30)
│   │   │   ├── app_database.g.dart        # Generated
│   │   │   └── database_provider.dart
│   │   ├── legal/
│   │   │   └── legal_constants.dart       # LegalConstants.mdrDisclaimer
│   │   ├── router/
│   │   │   ├── app_router.dart            # go_router + auth redirect
│   │   │   └── app_router.g.dart          # Generated
│   │   └── config/
│   │       ├── app_config.dart            # Flavor-aware config
│   │       └── revenuecat_config.dart     # Sandbox vs prod (FR34)
│   ├── features/
│   │   ├── patients/                      # FR1-FR6
│   │   │   ├── data/
│   │   │   │   ├── patient_repository.dart
│   │   │   │   ├── patient_repository_test.dart
│   │   │   │   ├── drift_patient_repository.dart
│   │   │   │   ├── drift_patient_repository_test.dart
│   │   │   │   └── patient_dao.dart
│   │   │   ├── domain/
│   │   │   │   ├── patient.dart           # Freezed
│   │   │   │   └── patient.freezed.dart   # Generated
│   │   │   ├── application/
│   │   │   │   ├── patients_notifier.dart
│   │   │   │   ├── patients_notifier_test.dart
│   │   │   │   └── patients_provider.dart
│   │   │   └── presentation/
│   │   │       ├── patients_screen.dart
│   │   │       ├── patient_detail_screen.dart
│   │   │       └── widgets/
│   │   │           ├── patient_list_tile.dart
│   │   │           └── patient_history_tile.dart
│   │   ├── capture/                       # FR7-FR19
│   │   │   ├── data/
│   │   │   │   ├── ml_service.dart        # Google ML Kit wrapper
│   │   │   │   ├── ml_service_test.dart
│   │   │   │   ├── analysis_repository.dart
│   │   │   │   ├── analysis_repository_test.dart
│   │   │   │   ├── drift_analysis_repository.dart
│   │   │   │   └── analysis_dao.dart
│   │   │   ├── domain/
│   │   │   │   ├── analysis.dart          # Freezed
│   │   │   │   ├── articular_angles.dart  # Freezed
│   │   │   │   ├── confidence_score.dart  # Freezed
│   │   │   │   ├── capture_state.dart     # sealed state machine
│   │   │   │   ├── analysis_result.dart   # sealed AnalysisResult
│   │   │   │   └── analysis_error.dart    # sealed AnalysisError
│   │   │   ├── application/
│   │   │   │   ├── capture_notifier.dart  # AsyncNotifier<CaptureState>
│   │   │   │   ├── capture_notifier_test.dart
│   │   │   │   ├── ml_isolate_runner.dart # Isolate + SendPort (NFR-S5)
│   │   │   │   ├── ml_isolate_runner_test.dart
│   │   │   │   └── capture_provider.dart
│   │   │   └── presentation/
│   │   │       ├── capture_screen.dart
│   │   │       └── widgets/
│   │   │           ├── guided_camera_overlay.dart    # GuidedCameraOverlay
│   │   │           ├── luminosity_indicator.dart     # FR9
│   │   │           └── analysis_progress_banner.dart # AnalysisProgressBanner
│   │   ├── results/                       # FR15, FR17, FR18, FR38
│   │   │   ├── domain/
│   │   │   │   └── reference_norms.dart   # Normes par âge/profil (FR15)
│   │   │   ├── application/
│   │   │   │   ├── results_notifier.dart
│   │   │   │   ├── results_notifier_test.dart
│   │   │   │   └── results_provider.dart
│   │   │   └── presentation/
│   │   │       ├── results_screen.dart
│   │   │       └── widgets/
│   │   │           ├── articular_angle_card.dart     # ArticularAngleCard
│   │   │           ├── body_skeleton_overlay.dart    # BodySkeletonOverlay
│   │   │           ├── replay_viewer.dart            # FR18
│   │   │           ├── simple_view.dart              # FR38
│   │   │           └── expert_view.dart              # FR38
│   │   ├── report/                        # FR20-FR25
│   │   │   ├── data/
│   │   │   │   ├── pdf_generator.dart
│   │   │   │   └── pdf_generator_test.dart
│   │   │   ├── application/
│   │   │   │   ├── report_notifier.dart
│   │   │   │   └── report_provider.dart
│   │   │   └── presentation/
│   │   │       └── widgets/
│   │   │           └── export_button.dart # FR24 — share sheet iOS
│   │   ├── paywall/                       # FR31-FR35
│   │   │   ├── data/
│   │   │   │   ├── subscription_repository.dart     # RevenueCat
│   │   │   │   └── subscription_repository_test.dart
│   │   │   ├── domain/
│   │   │   │   ├── subscription_status.dart         # sealed
│   │   │   │   └── quota.dart                       # Freezed (FR32)
│   │   │   ├── application/
│   │   │   │   ├── paywall_notifier.dart
│   │   │   │   ├── paywall_notifier_test.dart
│   │   │   │   └── paywall_provider.dart
│   │   │   └── presentation/
│   │   │       ├── paywall_sheet.dart               # ContextualPaywallSheet
│   │   │       └── widgets/
│   │   │           └── freemium_counter_badge.dart  # FreemiumCounterBadge
│   │   └── onboarding/                    # FR36-FR37
│   │       ├── application/
│   │       │   ├── onboarding_notifier.dart
│   │       │   └── onboarding_provider.dart
│   │       └── presentation/
│   │           ├── onboarding_screen.dart
│   │           └── widgets/
│   │               ├── onboarding_page_result.dart  # Résultat d'abord
│   │               ├── onboarding_page_capture.dart
│   │               └── onboarding_page_privacy.dart # Script RGPD (FR12)
│   └── shared/
│       ├── widgets/
│       │   ├── loading_spinner.dart
│       │   ├── error_widget.dart
│       │   └── biometric_lock_screen.dart
│       ├── design_system/
│       │   ├── app_colors.dart            # Palette: #1B6FBF, #34C759...
│       │   ├── app_typography.dart        # SF Pro
│       │   └── app_spacing.dart          # base 8pt, marges 16pt
│       └── extensions/
│           └── datetime_extensions.dart
└── integration_test/
    └── app_e2e_test.dart
```

### Frontières architecturales

**Flux de données principal :**

```
CaptureScreen
  → CaptureNotifier (AsyncNotifier<CaptureState>)
  → MlIsolateRunner (Flutter isolate, SendPort)
    → MlService (Google ML Kit — dans l'isolate)
    → AnalysisResult (sealed) retourné via ReceivePort
  → DriftAnalysisRepository (persistance chiffrée)
  → ResultsScreen → ReportNotifier → PdfGenerator → share sheet iOS
```

**Frontières de données :**

- `core/database/` : seule couche qui touche le disque chiffré
- Vidéo brute : vit uniquement dans l'isolate `ml_isolate_runner.dart` — ne franchit jamais la frontière vers la base de données
- Clé SQLCipher : dérivée du Keychain iOS, jamais transmise entre couches

**Points d'intégration externe :**

| Service               | Fichier wrapper                                  | Pattern                                         |
| --------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Google ML Kit         | `capture/data/ml_service.dart`                   | Wrappé derrière `MlService` abstract            |
| RevenueCat            | `paywall/data/subscription_repository.dart`      | Wrappé derrière `SubscriptionRepository`        |
| iOS share sheet       | `report/presentation/widgets/export_button.dart` | `Share.shareFiles()` natif                      |
| local_auth            | `core/auth/biometric_service.dart`               | Centralisé dans `core/`                         |
| Notifications locales | `core/config/app_config.dart`                    | `flutter_local_notifications` configuré en core |

### Flux de développement

**Commande build_runner (standard) :**

```bash
dart run build_runner build --delete-conflicting-outputs
```

**Lancement flavors :**

```bash
flutter run --flavor dev -t lib/main_dev.dart
flutter run --flavor prod -t lib/main_prod.dart
```

**Build TestFlight :**

```bash
flutter build ipa --flavor prod -t lib/main_prod.dart
# Puis upload via Xcode Organizer ou Transporter
```

## Résultats de Validation Architecturale

### Validation de cohérence ✅

**Compatibilité des décisions :**
Toutes les technologies sélectionnées sont mutuellement compatibles. Un point de vigilance critique : `sqlcipher_flutter_libs` et `sqlite3_flutter_libs` sont incompatibles — le `pubspec.yaml` devra déclarer explicitement `sqlite3_flutter_libs` comme exclusion de dépendance transitive. Les packages Riverpod, Freezed, go_router, et Drift opèrent sans conflits sur Flutter 3.x + iOS 16+.

**Cohérence des patterns :**
Feature-First + AsyncNotifier + Repository forment un triangle cohérent : la feature expose un Repository en interface, l'implémentation Drift respecte ce contrat, le Notifier consomme uniquement le Repository. Le switch exhaustif sur `AsyncValue` et les sealed classes sont nativement supportés par Dart 3.x.

**Alignement de la structure :**
Chaque feature respecte la structure `data/domain/application/presentation`. Les frontières sont claires : `core/` pour le cross-cutting, `shared/` pour les widgets génériques, `features/` pour la logique métier. Aucune dépendance circulaire identifiée.

### Validation de couverture des exigences ✅

**Couverture des exigences fonctionnelles — 40/40 :**

| Catégorie                  | FRs       | Couverture                                                |
| -------------------------- | --------- | --------------------------------------------------------- |
| Gestion patients           | FR1-FR6   | `features/patients/` — complet                            |
| Capture & guidage          | FR7-FR12  | `guided_camera_overlay.dart`, `luminosity_indicator.dart` |
| Analyse ML on-device       | FR13-FR19 | `ml_service.dart` + `ml_isolate_runner.dart` + isolate    |
| Rapport & export           | FR20-FR25 | `pdf_generator.dart` + `LegalConstants.mdrDisclaimer`     |
| Sécurité & confidentialité | FR26-FR30 | `biometric_guard.dart` + `app_database.dart` + SQLCipher  |
| Monétisation               | FR31-FR35 | `paywall/` + RevenueCat + `freemium_counter_badge.dart`   |
| Onboarding & UX            | FR36-FR40 | `onboarding/` + `simple_view.dart` + `expert_view.dart`   |

**Couverture des exigences non-fonctionnelles :**

| NFR                           | Couverture                                        | Statut    |
| ----------------------------- | ------------------------------------------------- | --------- |
| NFR-P1 (<30s analyse)         | `ml_isolate_runner.dart` background               | ✅        |
| NFR-P2 (≥58 FPS)              | Impeller activé iOS 16+ par défaut                | ✅        |
| NFR-P3 (<3s cold start)       | ProviderScope lazy loading                        | ✅        |
| NFR-P4 (<5s PDF)              | `pdf_generator.dart` local                        | ✅        |
| NFR-P5 (<100ms overlay)       | `guided_camera_overlay.dart` temps réel           | ✅        |
| NFR-P6 (<1s 500 patients)     | Drift + index `patients.name`                     | ✅ résolu |
| NFR-S1 (AES-256)              | `sqlcipher_flutter_libs`                          | ✅        |
| NFR-S2 (biométrie)            | `biometric_guard.dart` + `local_auth`             | ✅        |
| NFR-S3 (isolation réseau)     | Architecture locale-first                         | ✅        |
| NFR-S4 (clé Keychain)         | `flutter_secure_storage`                          | ✅ résolu |
| NFR-S5 (vidéo RAM)            | Isolate Flutter — vidéo jamais sur disque         | ✅        |
| NFR-S6 (RGPD by architecture) | Locale-first structurel                           | ✅        |
| NFR-R1 (<0.1% crash)          | Transactions Drift + error handling isolate       | ✅        |
| NFR-R2 (atomicité)            | Transactions Drift obligatoires                   | ✅        |
| NFR-R3 (durabilité)           | SQLite persistant, survit aux crashes             | ✅        |
| NFR-R4 (<5% échec ML)         | `confidence_score.dart` + fallback manuel         | ✅        |
| NFR-R5 (cohérence)            | Transactions Drift — analyse complète ou absente  | ✅        |
| NFR-C1 (500+ patients)        | Drift + index + pagination                        | ✅        |
| NFR-C2 (5000+ analyses)       | Drift pagination                                  | ✅        |
| NFR-C3 (<500MB base)          | Données texte/numériques — vidéo jamais persistée | ✅        |
| NFR-C4 (<150MB bundle)        | ML Kit ~40-60MB, app ~90-150MB                    | ✅        |

### Analyse des écarts résolus

**Gap critique #1 résolu — `flutter_secure_storage` :**
Ajouté à la stack dans `core/database/database_provider.dart`. Responsabilité : stocker la clé SQLCipher dans le Keychain iOS. Le provider Drift lit la clé via `FlutterSecureStorage().read(key: 'db_key')` avant d'ouvrir la connexion SQLCipher.

**Gap critique #2 résolu — Index Drift :**
Les index suivants doivent être définis dans `app_database.dart` :

```dart
@override
List<DatabaseSchemaEntity> get allSchemaEntities => [
  patients, analyses, articularAngles,
  Index('idx_patients_name', 'patients (name)'),
  Index('idx_analyses_patient', 'analyses (patient_id, created_at DESC)'),
];
```

**Gap important #3 résolu — Pattern migrations Drift :**
Pour le MVP : `MigrationStrategy.recreateTablesOnSchemaChanges()` (données de développement acceptables à perdre). Pour la Phase 2 : migrations manuelles versionnées via `MigrationStrategy(from, to)`.

**Gap important #4 résolu — Layout adaptatif FR39 :**
Helper centralisé dans `shared/extensions/layout_extensions.dart` :

```dart
extension LayoutExtensions on BuildContext {
  bool get isTablet => MediaQuery.of(this).size.shortestSide >= 600;
}
```

Breakpoint unique : `shortestSide >= 600` → layout iPad, sinon iPhone.

### Checklist de complétude architecturale

**✅ Analyse du contexte**

- [x] Contexte projet analysé en profondeur (40 FRs, 21 NFRs)
- [x] Complexité évaluée : Haute — ML médical réglementé
- [x] Contraintes techniques identifiées (offline, iOS-only, vidéo en RAM)
- [x] Cross-cutting concerns mappés (sécurité, conformité, performance, atomicité)

**✅ Décisions architecturales**

- [x] Stack complète avec versions vérifiées (Riverpod 3.2.1, go_router 17.x)
- [x] Pattern erreurs : sealed classes Dart 3 + switch exhaustif
- [x] Stratégie vidéo mémoire : isolate Flutter + SendPort
- [x] Repository interface dès le MVP (préparation Phase 2)
- [x] CI/CD différé : Xcode manuel MVP → GitHub Actions Phase 2
- [x] flutter_secure_storage pour Keychain iOS

**✅ Patterns d'implémentation**

- [x] 7 zones de conflit identifiées et adressées
- [x] Conventions de nommage : snake_case fichiers, PascalCase classes, camelCase variables
- [x] Structure feature obligatoire : data/domain/application/presentation
- [x] Co-location des tests établie
- [x] Anti-patterns explicites documentés avec exemples

**✅ Structure du projet**

- [x] Arborescence complète — 60+ fichiers définis
- [x] Mapping FR → fichier/répertoire complet
- [x] Frontières architecturales et flux de données documentés
- [x] Points d'intégration externe wrappés derrière des abstractions

### Évaluation de maturité

**Statut global : PRÊT POUR IMPLÉMENTATION**

**Niveau de confiance : Haute**

**Points forts de l'architecture :**

- RGPD by architecture — conformité structurelle, pas procédurale
- Pipeline ML isolé dans un isolate → UI thread jamais bloqué, vidéo jamais sur disque
- Repository interface + sealed classes → code de production testable et évolutif
- Règles de cohérence explicites → agents IA ne peuvent pas diverger sur les points critiques
- Séquence d'implémentation claire imposée par les dépendances

**Axes d'évolution post-MVP :**

- Migration PowerSync (cloud sync) rendue triviale par l'interface Repository
- Swap modèle ML (RTMPose) possible sans refonte de l'architecture
- Android supporté par Flutter sans refonte architecturale

### Guide de transfert pour implémentation

**Consignes pour les agents IA :**

- Suivre toutes les décisions architecturales exactement telles que documentées
- Appliquer les patterns de cohérence de manière systématique
- Respecter les frontières : données → uniquement via Repository, biométrie → uniquement via `core/auth/`
- Référencer ce document pour toute question architecturale

**Première priorité d'implémentation :**

```bash
flutter create \
  --org com.bodyorthox \
  --platforms ios \
  --project-name bodyorthox \
  bodyorthox
```

Puis : restructuration immédiate en Feature-First + configuration flavors dev/prod.
