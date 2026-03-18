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

Le cœur fonctionnel est le pipeline ML : capture vidéo → extraction pose (MediaPipe 97.2% PCK) → calcul angles articulaires (genou, hanche, cheville) → score de confiance → affichage résultats → export PDF. Ce flux doit s'exécuter en <30s, 100% on-device, sans aucune transmission de données.

**Exigences Non-Fonctionnelles critiques :**

| NFR    | Critère                         | Impact architectural                                                 |
| ------ | ------------------------------- | -------------------------------------------------------------------- |
| NFR-P1 | Analyse < 30s (95% des cas)     | Pipeline ML en native thread / Web Worker                            |
| NFR-P2 | ≥ 58 FPS UI constant            | react-native-reanimated activé, UI thread isolé                      |
| NFR-P5 | Latence overlay caméra < 100ms  | Traitement frame temps réel                                          |
| NFR-S1 | AES-256 pour toutes les données | react-native-sqlite-storage (native) + IndexedDB (web), clé Keychain |
| NFR-S5 | Vidéo brute jamais sur disque   | Traitement en mémoire uniquement                                     |
| NFR-R2 | Atomicité analyses              | Transactions SQL obligatoires                                        |
| NFR-R4 | Taux d'échec ML < 5%            | Mode correction manuelle (fallback)                                  |

**Échelle & Complexité :**

- Domaine primaire : Application mobile & web (React Native)
- Niveau de complexité : **Haute** — ML médical réglementé, sécurité forte, UX temps réel, pipeline asynchrone
- Composants architecturaux estimés : 6-8 feature modules distincts
- Contexte : Greenfield, solo developer + Claude Code

### Contraintes Techniques & Dépendances

| Contrainte               | Détail                                                | Implication                                             |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------- |
| **100% Offline**         | Zéro réseau MVP — aucune requête sortante             | Pas de BaaS, pas d'APNs, tout local                     |
| **iOS + Android + Web**  | react-native-reanimated stable, MediaPipe performant  | Support multi-plateforme dès le MVP                     |
| **Vidéo en mémoire**     | Jamais écrite sur disque non chiffré                  | Memory management critique pendant l'analyse            |
| **Modèles ML embarqués** | MediaPipe bundlé dans l'app (~40-60 MB)               | App bundle cible < 150 MB total                         |
| **Distribution MVP**     | Web (GitHub Pages) + TestFlight (iOS) + APK (Android) | Boucle de feedback rapide via web                       |
| **IAP RevenueCat**       | Freemium 10 analyses/mois → 39-49€/mois               | Gestion état abonnement local + vérification RevenueCat |

**Stack technique validée par la recherche :**
React Native 0.79.x + react-native-web · MediaPipe (pose detection) · react-native-sqlite-storage (native) + IndexedDB (web) · Zustand 5.x + Immer (state management) · RevenueCat (react-native-purchases) · react-native-biometrics (biométrie) · @notifee/react-native · pdf package

### Cross-Cutting Concerns Identifiés

1. **Sécurité & confidentialité** — traverse tout : authentification biométrique, stockage chiffré, capture vidéo en mémoire, export PDF avec disclaimer
2. **State machine du pipeline ML** — état global `idle → capturing → processing → results → exported` accessible depuis UI et background native thread / Web Worker
3. **Performance dual-thread** — 58 FPS UI maintenu pendant que le pipeline ML tourne en background (deux contraintes en tension)
4. **Conformité réglementaire EU MDR** — disclaimer non-modifiable sur chaque rapport, formulations UI contrôlées, horodatage traçable
5. **Atomicité des données** — aucune analyse partielle persistée (transactions SQL), cohérence garantie même en cas de crash

## Évaluation du Starter Template

### Domaine Primaire

Application mobile & web (React Native) — stack ML on-device spécialisée, architecture locale-first.

### Options Considérées

| Option                            | Inclus                    | Manque                              | Verdict        |
| --------------------------------- | ------------------------- | ----------------------------------- | -------------- |
| `npx react-native init`           | Minimal iOS/Android clean | Architecture, packages, web support | ✅ Recommandé  |
| Expo managed                      | Facile, OTA updates       | Pas d'accès natif complet, overhead | ⚠️ Trop limité |
| Community starters (boilerplates) | Navigation + state setup  | Maintenance incertaine              | ❌ Écarté      |

### Starter Sélectionné : `npx react-native init` + react-native-web

**Rationale :** La stack BodyOrthox est entièrement définie par la recherche technique préalable (Zustand + Immer, react-native-sqlite-storage, MediaPipe, @react-navigation/native-stack). Un starter générique imposerait des décisions à remplacer plutôt qu'à utiliser. L'architecture Feature-First est scaffoldée manuellement.

**Commande d'initialisation :**

```bash
npx react-native init bodyorthox --template react-native-template-typescript
# Puis configuration manuelle de react-native-web + webpack
```

**Décisions architecturales fournies par le starter :**

**Langage & Runtime :** TypeScript 5.x, strict mode activé, targets iOS + Android + Web

**Structure de base :** `src/App.tsx` + dossiers iOS/Android natifs — à restructurer immédiatement en Feature-First

**Tooling de build :** Metro bundler (mobile) + webpack (web), react-native-reanimated activé

**Testing :** `jest` + `@testing-library/react-native` inclus par défaut, à étendre avec `msw` pour les mocks

**Environnements (ajout manuel prioritaire) :** Configuration `dev` / `prod` via `app-config.ts` avec `__DEV__` flag pour isoler RevenueCat sandbox vs production et ML logging

**Note :** L'initialisation du projet avec cette commande + la mise en place immédiate de la structure Feature-First constituent la première story d'implémentation.

## Décisions Architecturales de Base

### Analyse des priorités de décision

**Décisions critiques (bloquent l'implémentation) :**

- Gestion des erreurs (pipeline ML a des états d'échec typés)
- Stratégie vidéo en mémoire (NFR-S5 non négociable)
- Abstraction Repository (impact architecture jour 1)

**Décisions importantes (forment l'architecture) :**

- Modèles de domaine (immutabilité des données médicales)
- CI/CD GitHub Actions

**Décisions différées (post-MVP) :**

- Intégration DPI/HL7-FHIR
- Migration cloud / PowerSync

### Architecture des données

**Database & Chiffrement :**

- react-native-sqlite-storage (mobile) + IndexedDB (web) via interface `IDatabase` abstraite
- Clé dérivée via PRAGMA key, stockée dans le Keychain (react-native-keychain — jamais en mémoire persistante)
- Initialisation platform-specific via `database.native.ts` / `database.web.ts` pour éviter le blocage UI thread
- Transactions SQL obligatoires sur toutes les écritures d'analyse (NFR-R2 — atomicité)

**Abstraction Repository — Interface dès le MVP :**

```typescript
interface PatientRepository {
  watchAll(): Observable<Patient[]>;
  save(patient: Patient): Promise<void>;
  delete(id: PatientId): Promise<void>;
}

class SqlitePatientRepository implements PatientRepository { ... }
```

Rationale : +20% code Day 1, migration PowerSync (cloud Phase 2) triviale sans refacto.

**Modèles de domaine — Interfaces TypeScript + Factory Functions :**

- Toutes les entités (Patient, Analysis, ArticularAngles, ConfidenceScore) sont des interfaces TypeScript immutables
- Immutabilité garantie pour les données médicales via `Readonly<T>` et Immer
- Factory functions `createPatient()`, `createAnalysis()` pour la construction
- Pas de code generation — TypeScript natif

### Authentification & Sécurité

| Décision            | Choix                                                              | Rationale                                                 |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| Authentification    | `react-native-biometrics` — Face ID / Touch ID / fingerprint       | Biométrie native multi-plateforme, zéro auth propriétaire |
| Chiffrement données | AES-256 via react-native-sqlite-storage (native) + IndexedDB (web) | NFR-S1 — aucune donnée patient en clair                   |
| Clé de chiffrement  | Keychain / Keystore (`react-native-keychain`)                      | NFR-S4 — jamais exposée en mémoire persistante            |
| Vidéo brute         | Native thread / Web Worker + stream frames                         | NFR-S5 — vidéo jamais écrite sur disque                   |
| Session             | Biométrie à chaque ouverture — pas de token persistant             | Conformité RGPD + EU MDR                                  |

**Stratégie vidéo en mémoire (critique NFR-S5) :**

- Frames extraits via react-native-vision-camera → envoyés par postMessage vers un native thread / Web Worker dédié
- Le pipeline ML (MediaPipe) tourne entièrement dans le thread dédié
- À la fin du traitement : résultats envoyés au UI thread, mémoire libérée automatiquement
- Aucune écriture disque à aucun moment — la vidéo n'existe que dans la RAM du thread dédié

### Communication & Gestion des erreurs

**Pas d'API réseau (MVP 100% offline).**

**Pattern erreurs — Discriminated unions TypeScript :**

```typescript
type AnalysisResult =
  | { readonly kind: "success"; readonly angles: ArticularAngles }
  | { readonly kind: "failure"; readonly error: AnalysisError };

type AnalysisError =
  | { readonly kind: "ml-low-confidence"; readonly score: number }
  | { readonly kind: "ml-detection-failed" }
  | { readonly kind: "video-processing-error"; readonly cause: string };
```

- Switch exhaustif avec type narrowing → tous les cas d'erreur couverts à la compilation
- Pas de dépendance externe — idiomatique TypeScript
- Zustand store gère l'état loading/error/data au niveau UI

### Architecture Frontend (React Native)

**State management — Zustand 5.x + Immer :**

- Zustand stores (`use{Feature}Store`) pour tous les états asynchrones (pipeline ML, chargement patients)
- Stores séparés pour l'état synchrone (compteur freemium, session biométrique)
- Scoping stores au niveau feature — pas de stores globaux sauf sécurité/auth

**Structure Feature-First :**

```
src/
  core/               # Cross-cutting (auth, database, config)
  features/
    patients/         # FR1-FR6
    capture/          # FR7-FR12 + pipeline ML FR13-FR19
    results/          # FR15-FR18 + vue expert/simple
    report/           # FR20-FR25 PDF generation
    paywall/          # FR31-FR35 RevenueCat
    onboarding/       # FR36-FR37
  navigation/         # @react-navigation setup
  shared/             # Composants partagés, design system, hooks
```

**Routing — @react-navigation/native-stack 7.x :**

- Navigation déclarative, navigation type-safe avec TypeScript
- Deep link vers une analyse spécifique (depuis notification locale)

**Vérification de types / Lint :**

- `npm run type-check` (tsc --noEmit) + `npm run lint` (ESLint)
- Pas de code generation — TypeScript natif, interfaces et types définis manuellement
- Configuration dans `tsconfig.json` + `.eslintrc`

### Infrastructure & Déploiement

**CI/CD — GitHub Actions :**

- Tests automatisés, build Android APK, deploy web sur GitHub Pages
- Workflow défini dans `.github/workflows/`
- Pipeline : lint → type-check → test → build → deploy

**Environnements — dev / prod (via app-config.ts) :**

- `dev` : RevenueCat sandbox, logs ML, SQLite non-chiffré optionnel pour debug, `__DEV__` flag
- `prod` : RevenueCat production, no logs, chiffrement activé

**Distribution MVP :** Web (GitHub Pages) + TestFlight (iOS) + APK (Android)

### Analyse d'impact des décisions

**Séquence d'implémentation imposée par les décisions :**

1. `npx react-native init` → structure Feature-First → config dev/prod via `app-config.ts`
2. Core : react-native-sqlite-storage + react-native-keychain setup → `react-native-biometrics` biométrie
3. Feature `patients` : Repository interface + SqlitePatientRepository
4. Feature `capture` : native thread / Web Worker ML + pipeline vidéo mémoire
5. Feature `results` + `report` : discriminated unions + PDF generation
6. Feature `paywall` : RevenueCat integration

**Dépendances croisées entre décisions :**

- Discriminated union AnalysisResult → dépendance entre `capture`, `results`, `report`
- Repository interface → SQLite impl doit respecter le contrat dès le début
- Native thread / Web Worker ML → le state machine `idle → capturing → processing → results → exported` est géré par un Zustand store (`useCaptureStore`) dans `capture`

## Patterns d'Implémentation & Règles de Cohérence

### Points de conflit identifiés

7 zones où des agents IA pourraient faire des choix incompatibles sans règles explicites.

### Patterns de nommage

**Fichiers TypeScript — kebab-case systématique :**

```
patient-repository.ts       ✅
PatientRepository.ts        ❌
patientRepository.ts        ❌
```

**Interfaces & Classes — PascalCase :**

```typescript
interface PatientRepository { }    ✅
interface patient_repository { }   ❌
```

**Variables & fonctions — camelCase :**

```typescript
const patientId = ...;         ✅
function watchAllPatients() { }    ✅
const patient_id = ...;        ❌
```

**Zustand stores — camelCase + préfixe `use` + suffixe `Store` :**

```typescript
const usePatientsStore = ...;        ✅
const useCaptureStore = ...;         ✅
const PatientStore = ...;            ❌
const patientList = ...;             ❌
```

**Tables SQL — snake_case pluriel :**

```typescript
// Nom de table SQL : 'patients' (snake_case pluriel)
// Colonnes : patient_id, created_at, confidence_score
const CREATE_PATIENTS_TABLE = `CREATE TABLE patients (...)`;
```

**Feature folders — kebab-case :**

```
features/patients/    ✅
features/Patients/    ❌
features/patient/     ❌ (pluriel obligatoire)
```

### Patterns de structure

**Structure feature obligatoire :**

```
features/{feature-name}/
  data/
    {feature}-repository.ts          # Interface abstraite
    sqlite-{feature}-repository.ts   # Implémentation SQLite
  domain/
    {entity}.ts                      # Interface TypeScript + factory function
    {feature}-error.ts               # Discriminated union errors
  screens/
    {feature}-screen.tsx             # Écran principal
  components/
    {component-name}.tsx             # Composants UI
  store/
    {feature}-store.ts               # Zustand store
```

**Tests — co-location obligatoire :**

```
features/patients/data/patient-repository.ts
features/patients/data/patient-repository.test.ts   ← co-localisé
features/patients/store/patients-store.test.ts
```

Interdit : dossier `__tests__/` séparé miroir de `src/`.

### Patterns de format

**Dates — ISO 8601 string en base :**

```typescript
// Stockage SQL : TEXT column
// Valeur : '2026-03-05T14:30:00Z'
// TypeScript : new Date(row.createdAt).toISOString()
// Affichage : format(parseISO(row.createdAt), 'dd/MM/yyyy') via date-fns
```

Interdit : Unix timestamp entier.

**Angles articulaires — number en degrés, 1 décimale :**

```typescript
const kneeAngle: number = 42.3; // degrés
// Affichage : `${kneeAngle.toFixed(1)}°`
```

**IDs — UUID v4, TEXT column SQL :**

```typescript
import { v4 as uuidv4 } from "uuid";
const id = uuidv4(); // génération côté TypeScript
// SQL : TEXT column pour l'ID
```

### Patterns de communication

**État asynchrone en UI — pattern Zustand (obligatoire) :**

```typescript
// ✅ CORRECT — Zustand store avec états explicites
interface PatientsState {
  readonly status: 'idle' | 'loading' | 'success' | 'error';
  readonly patients: readonly Patient[];
  readonly error: string | null;
  fetchPatients: () => Promise<void>;
}

// Dans le composant :
const { status, patients, error } = usePatientsStore();
switch (status) {
  case 'loading': return <LoadingSpinner />;
  case 'error':   return <ErrorView error={error} />;
  case 'success': return <PatientList patients={patients} />;
  default:        return null;
}

// ❌ INTERDIT
// if (isLoading) ... else if (error) ... (pas de type narrowing)
```

**State machine pipeline ML — discriminated union obligatoire :**

```typescript
type CaptureState =
  | { readonly kind: "idle" }
  | { readonly kind: "recording" }
  | { readonly kind: "processing" }
  | { readonly kind: "completed"; readonly result: AnalysisResult }
  | { readonly kind: "failed"; readonly error: AnalysisError };
```

**Zustand — règles de scoping :**

- Zustand stores avec Immer pour tout état asynchrone — `useState` local et `useReducer` complexe interdits pour l'état feature
- Stores déclarés dans `{feature}-store.ts` uniquement
- Stores globaux : **uniquement** dans `core/` (auth, db connection)
- Accès base de données : via Repository uniquement — accès SQL direct depuis un store interdit

### Patterns de processus

**Biométrie — pattern core obligatoire :**

```
core/auth/biometric-service.ts          ← interface
core/auth/biometric-service.native.ts   ← implémentation native
core/auth/biometric-service.web.ts      ← implémentation web
core/auth/use-biometric-auth.ts         ← hook React
```

- Vérification via navigation guard dans le NavigationContainer — pas dans les features
- Interdit : checks biométriques dans les composants ou stores individuels

**Disclaimer EU MDR — constante unique :**

```typescript
// core/legal/legal-constants.ts
export const LEGAL_CONSTANTS = {
  mdrDisclaimer:
    "BodyOrthox est un outil de documentation clinique. " +
    "Les données produites ne constituent pas un acte de " +
    "diagnostic médical et ne se substituent pas au jugement " +
    "clinique du praticien.",
} as const;
```

Interdit : texte du disclaimer inline dans les composants ou le PDF generator.

**Gestion erreurs ML — AnalysisError discriminated union :**

```typescript
type AnalysisError =
  | { readonly kind: "ml-low-confidence"; readonly score: number }
  | { readonly kind: "ml-detection-failed" }
  | { readonly kind: "video-processing-error"; readonly cause: string };
```

### Règles d'application — tous les agents DOIVENT

1. Respecter la structure `data/domain/screens/components/store` dans chaque feature
2. Utiliser `switch` exhaustif avec type narrowing sur les discriminated unions
3. Nommer les fichiers en kebab-case, les interfaces/classes en PascalCase
4. Déclarer les stores dans `{feature}-store.ts` uniquement
5. Utiliser `LEGAL_CONSTANTS.mdrDisclaimer` — jamais de texte inline
6. Co-localiser les tests avec les fichiers source
7. Stocker les dates en ISO 8601 string, les IDs en UUID v4 string
8. Accéder aux données uniquement via le Repository — jamais via SQL direct depuis un store

### Anti-patterns explicites

```typescript
// ❌ SQL direct depuis un store
const usePatientsStore = create<PatientsState>((set) => ({
  fetchPatients: async () => {
    const db = getDatabase();
    const rows = await db.executeSql("SELECT * FROM patients"); // INTERDIT
  },
}));

// ✅ Via Repository
const usePatientsStore = create<PatientsState>((set) => ({
  fetchPatients: async () => {
    const patients = await patientRepository.findAll();
    set({ patients, status: "success" });
  },
}));
```

```typescript
// ❌ Disclaimer inline
<Text>BodyOrthox est un outil de documentation...</Text>  // INTERDIT

// ✅ Constante centralisée
<Text>{LEGAL_CONSTANTS.mdrDisclaimer}</Text>
```

## Structure du Projet & Frontières Architecturales

### Mapping des exigences → composants

| FRs        | Feature                     | Répertoire                           |
| ---------- | --------------------------- | ------------------------------------ |
| FR1-FR6    | Gestion patients            | `features/patients/`                 |
| FR7-FR12   | Capture guidée              | `features/capture/screens/`          |
| FR13-FR19  | Pipeline ML + native thread | `features/capture/data/` + `store/`  |
| FR15, FR18 | Résultats + replay          | `features/results/`                  |
| FR20-FR25  | Rapport PDF                 | `features/report/`                   |
| FR26       | Biométrie                   | `core/auth/`                         |
| FR27-FR30  | Chiffrement + offline       | `core/database/`                     |
| FR31-FR35  | Freemium + IAP              | `features/paywall/`                  |
| FR36-FR37  | Onboarding                  | `features/onboarding/`               |
| FR38-FR40  | Vue expert/simple + notifs  | `features/results/` + `core/config/` |

### Arborescence complète du projet

```
bodyorthox-rn/
├── package.json
├── tsconfig.json
├── .eslintrc
├── .gitignore
├── webpack.config.js
├── index.js
├── ios/
│   ├── bodyorthox/
│   │   ├── AppDelegate.mm
│   │   └── Info.plist
│   ├── bodyorthox.xcodeproj/
│   └── Podfile
├── android/
│   ├── app/
│   │   └── build.gradle
│   └── settings.gradle
├── web/
│   └── index.html
├── src/
│   ├── App.tsx                              # NavigationContainer + stores init
│   ├── core/
│   │   ├── auth/
│   │   │   ├── biometric-service.ts         # Interface (FR26)
│   │   │   ├── biometric-service.native.ts  # Implémentation native
│   │   │   ├── biometric-service.web.ts     # Implémentation web
│   │   │   ├── use-biometric-auth.ts        # Hook React
│   │   │   └── biometric-service.test.ts
│   │   ├── database/
│   │   │   ├── schema.ts                    # Schema SQL (FR27-FR30)
│   │   │   ├── database.native.ts           # react-native-sqlite-storage
│   │   │   ├── database.web.ts              # IndexedDB
│   │   │   ├── init.ts                      # Platform-specific initialization
│   │   │   └── database.test.ts
│   │   ├── legal/
│   │   │   └── legal-constants.ts           # LEGAL_CONSTANTS.mdrDisclaimer
│   │   └── config/
│   │       ├── app-config.ts                # Dev/prod config (__DEV__ flag)
│   │       └── revenuecat-config.ts         # Sandbox vs prod (FR34)
│   ├── features/
│   │   ├── patients/                        # FR1-FR6
│   │   │   ├── data/
│   │   │   │   ├── patient-repository.ts
│   │   │   │   ├── patient-repository.test.ts
│   │   │   │   ├── sqlite-patient-repository.ts
│   │   │   │   └── sqlite-patient-repository.test.ts
│   │   │   ├── domain/
│   │   │   │   ├── patient.ts               # Interface + factory function
│   │   │   │   └── patient.test.ts
│   │   │   ├── screens/
│   │   │   │   ├── patients-screen.tsx
│   │   │   │   ├── create-patient-screen.tsx
│   │   │   │   ├── patient-detail-screen.tsx
│   │   │   │   └── patient-timeline-screen.tsx
│   │   │   ├── components/
│   │   │   │   ├── patient-list-tile.tsx
│   │   │   │   └── patient-history-tile.tsx
│   │   │   └── store/
│   │   │       ├── patients-store.ts
│   │   │       └── patients-store.test.ts
│   │   ├── capture/                         # FR7-FR19
│   │   │   ├── data/
│   │   │   │   ├── ml-service.ts            # MediaPipe wrapper
│   │   │   │   ├── ml-service.test.ts
│   │   │   │   ├── analysis-repository.ts
│   │   │   │   ├── analysis-repository.test.ts
│   │   │   │   └── sqlite-analysis-repository.ts
│   │   │   ├── domain/
│   │   │   │   ├── analysis.ts              # Interface + factory
│   │   │   │   ├── articular-angles.ts      # Interface + factory
│   │   │   │   ├── confidence-score.ts      # Interface + factory
│   │   │   │   ├── capture-state.ts         # Discriminated union state machine
│   │   │   │   ├── analysis-result.ts       # Discriminated union AnalysisResult
│   │   │   │   └── analysis-error.ts        # Discriminated union AnalysisError
│   │   │   ├── screens/
│   │   │   │   ├── capture-screen.tsx
│   │   │   │   └── ml-worker.ts             # Native thread / Web Worker (NFR-S5)
│   │   │   ├── components/
│   │   │   │   ├── guided-camera-overlay.tsx     # GuidedCameraOverlay
│   │   │   │   ├── luminosity-indicator.tsx      # FR9
│   │   │   │   └── analysis-progress-banner.tsx  # AnalysisProgressBanner
│   │   │   └── store/
│   │   │       ├── capture-store.ts
│   │   │       └── capture-store.test.ts
│   │   ├── results/                         # FR15, FR17, FR18, FR38
│   │   │   ├── domain/
│   │   │   │   └── reference-norms.ts       # Normes par âge/profil (FR15)
│   │   │   ├── screens/
│   │   │   │   └── results-screen.tsx
│   │   │   ├── components/
│   │   │   │   ├── articular-angle-card.tsx      # ArticularAngleCard
│   │   │   │   ├── body-skeleton-overlay.tsx     # BodySkeletonOverlay
│   │   │   │   ├── replay-viewer.tsx             # FR18
│   │   │   │   ├── simple-view.tsx               # FR38
│   │   │   │   └── expert-view.tsx               # FR38
│   │   │   └── store/
│   │   │       ├── results-store.ts
│   │   │       └── results-store.test.ts
│   │   ├── report/                          # FR20-FR25
│   │   │   ├── data/
│   │   │   │   ├── pdf-generator.ts
│   │   │   │   └── pdf-generator.test.ts
│   │   │   ├── screens/
│   │   │   │   └── report-screen.tsx
│   │   │   ├── components/
│   │   │   │   └── export-button.tsx        # FR24 — share sheet
│   │   │   └── store/
│   │   │       └── report-store.ts
│   │   ├── paywall/                         # FR31-FR35
│   │   │   ├── data/
│   │   │   │   ├── subscription-repository.ts     # RevenueCat
│   │   │   │   └── subscription-repository.test.ts
│   │   │   ├── domain/
│   │   │   │   ├── subscription-status.ts         # Discriminated union
│   │   │   │   └── quota.ts                       # Interface (FR32)
│   │   │   ├── screens/
│   │   │   │   └── paywall-sheet.tsx               # ContextualPaywallSheet
│   │   │   ├── components/
│   │   │   │   └── freemium-counter-badge.tsx      # FreemiumCounterBadge
│   │   │   └── store/
│   │   │       ├── paywall-store.ts
│   │   │       └── paywall-store.test.ts
│   │   └── onboarding/                      # FR36-FR37
│   │       ├── screens/
│   │       │   └── onboarding-screen.tsx
│   │       ├── components/
│   │       │   ├── onboarding-page-result.tsx  # Résultat d'abord
│   │       │   ├── onboarding-page-capture.tsx
│   │       │   └── onboarding-page-privacy.tsx # Script RGPD (FR12)
│   │       └── store/
│   │           └── onboarding-store.ts
│   ├── navigation/
│   │   └── app-navigator.tsx                # @react-navigation setup + auth guard
│   └── shared/
│       ├── components/
│       │   ├── loading-spinner.tsx
│       │   ├── error-view.tsx
│       │   └── biometric-lock-screen.tsx
│       ├── design-system/
│       │   ├── app-colors.ts                # Palette: #1B6FBF, #34C759...
│       │   ├── app-typography.ts            # SF Pro
│       │   └── app-spacing.ts              # base 8pt, marges 16pt
│       ├── hooks/
│       │   └── use-platform.ts
│       └── extensions/
│           └── date-helpers.ts
├── __tests__/
│   └── app-e2e.test.ts
└── .github/
    └── workflows/
        └── ci.yml                           # Tests + build + deploy
```

### Frontières architecturales

**Flux de données principal :**

```
CaptureScreen
  → useCaptureStore (Zustand store<CaptureState>)
  → ml-worker.ts (native thread / Web Worker, postMessage)
    → MlService (MediaPipe — dans le thread dédié)
    → AnalysisResult (discriminated union) retourné via postMessage
  → SqliteAnalysisRepository (persistance chiffrée)
  → ResultsScreen → useReportStore → PdfGenerator → share sheet
```

**Frontières de données :**

- `core/database/` : seule couche qui touche le disque chiffré
- Vidéo brute : vit uniquement dans le thread dédié `ml-worker.ts` — ne franchit jamais la frontière vers la base de données
- Clé SQLite : dérivée du Keychain / Keystore (react-native-keychain), jamais transmise entre couches

**Points d'intégration externe :**

| Service                 | Fichier wrapper                           | Pattern                                    |
| ----------------------- | ----------------------------------------- | ------------------------------------------ |
| MediaPipe               | `capture/data/ml-service.ts`              | Wrappé derrière `MlService` interface      |
| RevenueCat              | `paywall/data/subscription-repository.ts` | Wrappé derrière `SubscriptionRepository`   |
| Share sheet             | `report/components/export-button.tsx`     | Share natif multi-plateforme               |
| react-native-biometrics | `core/auth/biometric-service.native.ts`   | Centralisé dans `core/`, platform-specific |
| Notifications locales   | `core/config/app-config.ts`               | `@notifee/react-native` configuré en core  |

### Flux de développement

**Vérification de types / Lint (standard) :**

```bash
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
npm test              # Jest + @testing-library/react-native
```

**Lancement développement :**

```bash
npm run web                     # webpack-dev-server sur localhost:8080
npx react-native run-ios        # Simulateur iOS
npx react-native run-android    # Émulateur Android
```

**Build distribution :**

```bash
# Web — GitHub Pages
npm run build:web

# iOS — TestFlight
# Via Xcode : Product → Archive → Upload to App Store Connect

# Android — APK
cd android && ./gradlew assembleRelease
```

## Résultats de Validation Architecturale

### Validation de cohérence ✅

**Compatibilité des décisions :**
Toutes les technologies sélectionnées sont mutuellement compatibles. Un point de vigilance critique : l'interface `IDatabase` abstraite doit être implémentée de manière cohérente entre `database.native.ts` (react-native-sqlite-storage) et `database.web.ts` (IndexedDB) pour garantir la portabilité. Les packages Zustand, @react-navigation, react-native-reanimated opèrent sans conflits sur React Native 0.79.x + react-native-web.

**Cohérence des patterns :**
Feature-First + Zustand store + Repository forment un triangle cohérent : la feature expose un Repository en interface, l'implémentation SQLite respecte ce contrat, le store consomme uniquement le Repository. Le switch exhaustif avec type narrowing sur les discriminated unions est nativement supporté par TypeScript 5.x.

**Alignement de la structure :**
Chaque feature respecte la structure `data/domain/screens/components/store`. Les frontières sont claires : `core/` pour le cross-cutting, `shared/` pour les composants génériques, `features/` pour la logique métier. Aucune dépendance circulaire identifiée.

### Validation de couverture des exigences ✅

**Couverture des exigences fonctionnelles — 40/40 :**

| Catégorie                  | FRs       | Couverture                                              |
| -------------------------- | --------- | ------------------------------------------------------- |
| Gestion patients           | FR1-FR6   | `features/patients/` — complet                          |
| Capture & guidage          | FR7-FR12  | `guided-camera-overlay.tsx`, `luminosity-indicator.tsx` |
| Analyse ML on-device       | FR13-FR19 | `ml-service.ts` + `ml-worker.ts` + native thread        |
| Rapport & export           | FR20-FR25 | `pdf-generator.ts` + `LEGAL_CONSTANTS.mdrDisclaimer`    |
| Sécurité & confidentialité | FR26-FR30 | `biometric-service.ts` + `database.native.ts` + SQLite  |
| Monétisation               | FR31-FR35 | `paywall/` + RevenueCat + `freemium-counter-badge.tsx`  |
| Onboarding & UX            | FR36-FR40 | `onboarding/` + `simple-view.tsx` + `expert-view.tsx`   |

**Couverture des exigences non-fonctionnelles :**

| NFR                           | Couverture                                           | Statut    |
| ----------------------------- | ---------------------------------------------------- | --------- |
| NFR-P1 (<30s analyse)         | `ml-worker.ts` background thread                     | ✅        |
| NFR-P2 (≥58 FPS)              | react-native-reanimated activé                       | ✅        |
| NFR-P3 (<3s cold start)       | Zustand stores lazy initialization                   | ✅        |
| NFR-P4 (<5s PDF)              | `pdf-generator.ts` local                             | ✅        |
| NFR-P5 (<100ms overlay)       | `guided-camera-overlay.tsx` temps réel               | ✅        |
| NFR-P6 (<1s 500 patients)     | SQLite + index `patients(name)`                      | ✅ résolu |
| NFR-S1 (AES-256)              | react-native-sqlite-storage (chiffré)                | ✅        |
| NFR-S2 (biométrie)            | `biometric-service.ts` + `react-native-biometrics`   | ✅        |
| NFR-S3 (isolation réseau)     | Architecture locale-first                            | ✅        |
| NFR-S4 (clé Keychain)         | `react-native-keychain`                              | ✅ résolu |
| NFR-S5 (vidéo RAM)            | Native thread / Web Worker — vidéo jamais sur disque | ✅        |
| NFR-S6 (RGPD by architecture) | Locale-first structurel                              | ✅        |
| NFR-R1 (<0.1% crash)          | Transactions SQL + error handling thread             | ✅        |
| NFR-R2 (atomicité)            | Transactions SQL obligatoires                        | ✅        |
| NFR-R3 (durabilité)           | SQLite persistant, survit aux crashes                | ✅        |
| NFR-R4 (<5% échec ML)         | `confidence-score.ts` + fallback manuel              | ✅        |
| NFR-R5 (cohérence)            | Transactions SQL — analyse complète ou absente       | ✅        |
| NFR-C1 (500+ patients)        | SQLite + index + pagination                          | ✅        |
| NFR-C2 (5000+ analyses)       | SQLite pagination                                    | ✅        |
| NFR-C3 (<500MB base)          | Données texte/numériques — vidéo jamais persistée    | ✅        |
| NFR-C4 (<150MB bundle)        | MediaPipe ~40-60MB, app ~90-150MB                    | ✅        |

### Analyse des écarts résolus

**Gap critique #1 résolu — `react-native-keychain` :**
Ajouté à la stack dans `core/database/init.ts`. Responsabilité : stocker la clé SQLite dans le Keychain / Keystore. L'initialisation database lit la clé via `Keychain.getGenericPassword()` avant d'ouvrir la connexion SQLite chiffrée.

**Gap critique #2 résolu — Index SQL :**
Les index suivants doivent être définis dans `schema.ts` :

```typescript
const INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (name)",
  "CREATE INDEX IF NOT EXISTS idx_analyses_patient ON analyses (patient_id, created_at DESC)",
];
```

**Gap important #3 résolu — Pattern migrations SQL :**
Pour le MVP : DROP + CREATE tables (données de développement acceptables à perdre). Pour la Phase 2 : migrations manuelles versionnées via un schema version tracker.

**Gap important #4 résolu — Layout adaptatif FR39 :**
Hook centralisé dans `shared/hooks/use-platform.ts` :

```typescript
import { Platform, useWindowDimensions } from "react-native";

export function usePlatform() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWeb = Platform.OS === "web";
  return { isTablet, isWeb, os: Platform.OS };
}
```

Breakpoint unique : `width >= 768` → layout tablette/web, sinon mobile.

### Checklist de complétude architecturale

**✅ Analyse du contexte**

- [x] Contexte projet analysé en profondeur (40 FRs, 21 NFRs)
- [x] Complexité évaluée : Haute — ML médical réglementé
- [x] Contraintes techniques identifiées (offline, multi-plateforme, vidéo en RAM)
- [x] Cross-cutting concerns mappés (sécurité, conformité, performance, atomicité)

**✅ Décisions architecturales**

- [x] Stack complète avec versions vérifiées (Zustand 5.x, @react-navigation/native-stack 7.x)
- [x] Pattern erreurs : discriminated unions TypeScript + switch exhaustif
- [x] Stratégie vidéo mémoire : native thread / Web Worker + postMessage
- [x] Repository interface dès le MVP (préparation Phase 2)
- [x] CI/CD : GitHub Actions (tests, build, deploy)
- [x] react-native-keychain pour Keychain / Keystore

**✅ Patterns d'implémentation**

- [x] 7 zones de conflit identifiées et adressées
- [x] Conventions de nommage : kebab-case fichiers, PascalCase interfaces, camelCase variables
- [x] Structure feature obligatoire : data/domain/screens/components/store
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
- Pipeline ML isolé dans un native thread / Web Worker → UI thread jamais bloqué, vidéo jamais sur disque
- Repository interface + discriminated unions → code de production testable et évolutif
- Règles de cohérence explicites → agents IA ne peuvent pas diverger sur les points critiques
- Séquence d'implémentation claire imposée par les dépendances
- Multi-plateforme dès le MVP (Web + iOS + Android)

**Axes d'évolution post-MVP :**

- Migration PowerSync (cloud sync) rendue triviale par l'interface Repository
- Swap modèle ML (RTMPose) possible sans refonte de l'architecture

### Guide de transfert pour implémentation

**Consignes pour les agents IA :**

- Suivre toutes les décisions architecturales exactement telles que documentées
- Appliquer les patterns de cohérence de manière systématique
- Respecter les frontières : données → uniquement via Repository, biométrie → uniquement via `core/auth/`
- Référencer ce document pour toute question architecturale

**Première priorité d'implémentation :**

```bash
npx react-native init bodyorthox --template react-native-template-typescript
# Puis : configuration webpack + react-native-web
# Puis : restructuration immédiate en Feature-First src/
# Puis : configuration dev/prod via app-config.ts
```

Puis : restructuration immédiate en Feature-First + configuration dev/prod via `app-config.ts`.
