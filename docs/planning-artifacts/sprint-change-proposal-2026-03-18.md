# Sprint Change Proposal — BodyOrthox

**Auteur :** Karimmeguenni-tani
**Date :** 2026-03-18
**Statut :** ✅ Approuvé (2026-03-18)
**Scope de changement :** Major — mise à jour de tous les artifacts de planning

---

## Section 1 : Résumé du Problème

### Déclencheur

Migration complète du framework applicatif : **Flutter (Dart, iOS only)** → **React Native CLI + react-native-web (TypeScript, iOS + Android + Web)**.

Le nouveau code est dans `bodyorthox-rn/` et fonctionne en local sur navigateur web.

### Problème

Flutter est trop limité pour le workflow de développement souhaité. Le développeur veut pouvoir tester directement dans le navigateur web sans passer par un émulateur iOS/Android. React Native avec `react-native-web` + webpack permet cette boucle de feedback rapide.

### Évidence

- L'app `bodyorthox-rn/` compile et tourne sur `http://localhost:8080` via webpack-dev-server
- La navigation fonctionne (écran Patients → Nouveau patient → formulaire complet)
- La structure Feature-First est conservée (`src/features/patients/`, `src/features/capture/`, `src/features/results/`)
- Le repository pattern est maintenu avec des abstractions platform-specific

### Scope du changement

**Ce qui change :** La stack technique (framework, langage, packages, patterns d'implémentation).

**Ce qui NE change PAS :** Les exigences fonctionnelles (FR1-FR40), les exigences non-fonctionnelles (NFR), les epics, les stories, les user journeys, le modèle économique, le positionnement produit.

---

## Section 2 : Analyse d'Impact

### 2.1 Impact sur les Epics

| Epic                         | Impact       | Détail                                                                                                                                       |
| ---------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Epic 1 : Fondation Sécurisée | ⚠️ Technique | Stack change : SQLCipher → react-native-sqlite-storage, local_auth → react-native-biometrics, flutter_secure_storage → react-native-keychain |
| Epic 2 : Gestion Patients    | ⚠️ Technique | Riverpod → Zustand+Immer, Drift → SQLite brut, Freezed → interfaces TypeScript                                                               |
| Epic 3 : Capture & ML        | ⚠️ Technique | camera plugin → react-native-vision-camera, Flutter isolate → Web Worker/native thread, ML Kit → MediaPipe                                   |
| Epic 4 : Rapport PDF         | ⚠️ Technique | pdf package Dart → librairie PDF JavaScript (à déterminer)                                                                                   |
| Epic 5 : Monétisation        | ⚠️ Technique | RevenueCat Flutter → RevenueCat React Native                                                                                                 |
| Epic 6 : Onboarding & UX     | ⚠️ Technique | Cupertino/Material Flutter → React Native components, Impeller → Reanimated                                                                  |

**Aucun epic ajouté, supprimé ou réordonné.** Le scope fonctionnel est identique.

### 2.2 Impact sur les Stories

Les acceptance criteria de chaque story contiennent des références techniques Flutter/Dart à remplacer :

| Référence Flutter                                     | Remplacement React Native                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `flutter create --org com.bodyorthox --platforms ios` | `npx react-native init bodyorthox`                                     |
| Dart 3.x, null safety                                 | TypeScript 5.x, strict mode                                            |
| Flutter 3.x + Impeller renderer                       | React Native 0.79.x + react-native-web                                 |
| Riverpod 3.x (AsyncNotifier)                          | Zustand 5.x + Immer                                                    |
| Drift + SQLCipher + `sqlcipher_flutter_libs`          | react-native-sqlite-storage (native) + IndexedDB (web)                 |
| Freezed (value objects, code generation)              | Interfaces TypeScript + `createPatient()`/`createAnalysis()` factories |
| go_router (type-safe routing)                         | @react-navigation/native-stack 7.x                                     |
| `local_auth` (biométrie)                              | react-native-biometrics                                                |
| `flutter_secure_storage` (Keychain)                   | react-native-keychain                                                  |
| `flutter_local_notifications`                         | @notifee/react-native                                                  |
| `camera` plugin Flutter                               | react-native-vision-camera                                             |
| Google ML Kit (Flutter plugin)                        | MediaPipe (via vision-camera frame processor)                          |
| `pdf` package Dart                                    | Librairie PDF JS (à déterminer)                                        |
| `purchases_flutter` (RevenueCat)                      | react-native-purchases (RevenueCat)                                    |
| Flutter isolate + SendPort                            | Web Worker (web) / native thread (mobile)                              |
| `build_runner` (code generation)                      | Pas de code generation — TypeScript natif                              |
| `analysis_options.yaml`                               | `.eslintrc` + `tsconfig.json`                                          |
| `dart run build_runner build`                         | `npm run type-check` / `npm run lint`                                  |
| Flavors dev/prod (Xcode schemes)                      | `app-config.ts` avec `__DEV__` flag                                    |
| Sealed classes Dart 3 (`sealed class`)                | Union types TypeScript + discriminated unions                          |
| `switch` exhaustif Dart 3                             | `switch`/`if` TypeScript avec type narrowing                           |
| Snake_case fichiers Dart                              | kebab-case fichiers TypeScript (convention RN)                         |
| `shortestSide >= 600` (LayoutExtensions)              | `usePlatform()` hook + `Platform.OS`                                   |
| TestFlight distribution                               | TestFlight (iOS) + APK (Android) + Web deploy                          |

### 2.3 Impact sur les Artifacts

| Document                                     | Impact      | Action requise                                                                                                                                                           |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PRD** (`prd.md`)                           | 🔴 Majeur   | Remplacer toutes les références Flutter/Dart/Drift/Riverpod. Ajouter Web + Android comme plateformes cibles. Mettre à jour la classification projet.                     |
| **Architecture** (`architecture.md`)         | 🔴 Critique | Réécriture quasi-complète. Chaque décision technique (stack, patterns, structure, déploiement) doit refléter React Native + TypeScript.                                  |
| **Epics** (`epics.md`)                       | 🟠 Modéré   | Mettre à jour les Additional Requirements (section Architecture), les acceptance criteria techniques dans chaque story. Les user stories elles-mêmes restent identiques. |
| **UX Design** (`ux-design-specification.md`) | 🟡 Mineur   | Remplacer les références Impeller/Cupertino. Le design system (couleurs, spacing, typo) est déjà aligné.                                                                 |
| **Sprint Status** (`sprint-status.yaml`)     | 🟡 Mineur   | Reset des stories implémentées (nouveau code = nouveau départ).                                                                                                          |

---

## Section 3 : Approche Recommandée

### Approche : Direct Adjustment (mise à jour documents)

**Rationale :** Les exigences fonctionnelles (FR1-FR40) sont identiques. Le code React Native respecte la même architecture Feature-First avec Repository pattern. Il s'agit d'un changement de stack, pas d'un changement de produit. Les documents doivent être mis à jour pour refléter la réalité technique actuelle.

**Effort estimé :** Moyen — les documents sont longs mais les changements sont systématiques (search & replace + mise à jour des sections techniques).

**Risque :** Faible — aucun changement fonctionnel, uniquement de la documentation.

**Timeline :** Réalisable en 1 session de travail avec Claude Code.

### Alternatives écartées

| Option                                | Raison d'exclusion                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Rollback vers Flutter                 | L'utilisateur a explicitement choisi React Native pour la testabilité web       |
| Repartir de zéro (nouveaux documents) | Les FR, NFR, user journeys, et UX sont toujours valides — seule la stack change |
| Ignorer les documents                 | Créerait une incohérence dangereuse entre docs et code                          |

---

## Section 4 : Propositions de Changement Détaillées

### 4.1 PRD (`prd.md`)

**Changement 1 — Résumé Exécutif**

OLD:

```
BodyOrthox est une application mobile iOS (Flutter) qui permet aux orthopédistes...
```

NEW:

```
BodyOrthox est une application mobile et web (React Native) qui permet aux orthopédistes...
```

OLD:

```
| **Stack technique** | Flutter + Google ML Kit + Drift + SQLCipher (AES-256) |
```

NEW:

```
| **Stack technique** | React Native CLI + react-native-web + MediaPipe + SQLite + Zustand |
```

OLD:

```
| **Type de projet**  | Application mobile (iOS, Flutter) |
```

NEW:

```
| **Type de projet**  | Application mobile & web (iOS, Android, Web — React Native) |
```

**Changement 2 — Spécificités Plateforme**

OLD:

```
| **Framework**            | Flutter 3.x + Impeller renderer |
| **Plateforme cible MVP** | iOS uniquement (iPhone + iPad) |
| **Android**              | Post-MVP |
| **Distribution MVP**     | TestFlight |
```

NEW:

```
| **Framework**            | React Native 0.79.x + react-native-web + webpack |
| **Plateforme cible MVP** | Web (dev/test) + iOS (production) + Android (stretch goal) |
| **Android**              | Accessible dès le MVP via React Native |
| **Distribution MVP**     | Web (GitHub Pages) + TestFlight (iOS) + APK (Android) |
```

**Changement 3 — Stack technique dans tout le document**

Remplacer systématiquement :

- "Flutter" → "React Native"
- "Dart" → "TypeScript"
- "Drift + SQLCipher" → "react-native-sqlite-storage (native) + IndexedDB (web)"
- "Riverpod" → "Zustand"
- "Freezed" → "interfaces TypeScript"
- "go_router" → "@react-navigation/native-stack"
- "Impeller" → "react-native-reanimated"
- "Flutter isolate" → "native thread / Web Worker"
- "`flutter_local_notifications`" → "@notifee/react-native"
- "`local_auth`" → "react-native-biometrics"
- "`purchases_flutter`" → "react-native-purchases"
- "Google ML Kit" → "MediaPipe"

**Changement 4 — Mode Offline**

OLD:

```
- Modèles ML embarqués : Google ML Kit — bundlés dans l'app (pas de téléchargement runtime)
- Taille app estimée : ~80-120 MB (modèle ML Kit ~40-60 MB inclus)
```

NEW:

```
- Modèles ML : MediaPipe pose detection — chargés à l'initialisation
- Taille app estimée : ~60-100 MB (modèle ML inclus)
- Version web : IndexedDB pour le stockage local, pas de SQLCipher
```

**Changement 5 — Notifications**

OLD:

```
Implémentation : `flutter_local_notifications`.
```

NEW:

```
Implémentation : `@notifee/react-native` (native), non disponible en version web.
```

### 4.2 Architecture (`architecture.md`)

**Changement global :** Réécriture des sections techniques. Le document doit refléter :

**Stack technique :**

```
React Native 0.79.x · react-native-web 0.19.x · TypeScript 5.x
Zustand 5.x + Immer (state management)
react-native-sqlite-storage (native) · IndexedDB (web)
@react-navigation/native-stack 7.x
react-native-vision-camera 4.x + MediaPipe
react-native-biometrics · react-native-keychain
@notifee/react-native
react-native-reanimated 3.x · react-native-gesture-handler
```

**Structure Feature-First (conservée, renommée) :**

```
src/
  core/               # Cross-cutting (auth, database, config)
  features/
    patients/         # FR1-FR6
    capture/          # FR7-FR19
    results/          # FR15-FR18
  navigation/         # @react-navigation setup
  shared/             # Design system, hooks, utils
```

**Patterns conservés :**

- Repository pattern (interfaces abstraites + implémentations platform-specific)
- Immutabilité (Immer pour les mutations de state)
- State machine capture (phases : idle → recording → processing → success/error)
- Platform abstraction (.native.ts / .web.ts)
- UUID v4 pour les IDs, ISO 8601 pour les dates
- Index SQL identiques (`idx_patients_name`, `idx_analyses_patient`)

**Patterns changés :**

- Sealed classes Dart → Discriminated unions TypeScript
- AsyncNotifier Riverpod → Zustand stores avec actions
- Drift DAO → SQL brut via IDatabase interface
- Freezed models → Factory functions + interfaces
- Flutter isolate → Architecture platform-specific (native thread / web worker)
- Code generation (build_runner) → Pas de code generation, TypeScript natif
- go_router redirect → Navigation guard dans AppNavigator

**Conventions de nommage (mise à jour) :**

- Fichiers : `kebab-case.ts` (au lieu de `snake_case.dart`)
- Interfaces : `PascalCase` (conservé)
- Variables/fonctions : `camelCase` (conservé)
- Stores Zustand : `use{Feature}Store` (au lieu de `{feature}Provider`)
- Tables SQL : `snake_case` pluriel (conservé)

### 4.3 Epics (`epics.md`)

**Changement 1 — Additional Requirements (section Architecture)**

Remplacer intégralement la section "De l'Architecture" :

OLD:

```
- Starter template : `flutter create --org com.bodyorthox --platforms ios`
- Structure Feature-First à scaffolder manuellement
- Flavors dev/prod configurés manuellement
- Incompatibilité critique : `sqlcipher_flutter_libs` et `sqlite3_flutter_libs`
- Code generation via build_runner
- Index Drift obligatoires
- Migration Strategy MVP : recreateTablesOnSchemaChanges()
- Distribution MVP : TestFlight uniquement
- CI/CD : manuel Xcode
```

NEW:

```
- Starter : `npx react-native init bodyorthox` + configuration webpack pour react-native-web
- Structure Feature-First dans src/ : core/, features/, shared/, navigation/
- Configuration dev/prod via app-config.ts avec __DEV__ flag
- Database : react-native-sqlite-storage (native) + IndexedDB (web) via IDatabase interface
- Pas de code generation — TypeScript natif
- Index SQL : idx_patients_name sur patients(name), idx_analyses_patient sur analyses(patient_id, created_at DESC)
- Migration Strategy MVP : DROP + CREATE tables (dev), versioned migrations (prod)
- Distribution MVP : Web (GitHub Pages) + TestFlight (iOS) + APK (Android)
- CI/CD : GitHub Actions (tests, build Android APK, deploy web GitHub Pages)
```

**Changement 2 — Additional Requirements (section UX)**

Remplacer les références Flutter :

OLD:

```
- Design system hybride Cupertino + Material 3 (Clinical White)
- Animations : durées 200-300ms (Impeller)
```

NEW:

```
- Design system React Native (dark mode clinical, palette conservée)
- Animations : durées 200-300ms (react-native-reanimated)
```

**Changement 3 — Story 1.1 Acceptance Criteria**

OLD:

```
Given la commande `flutter create --org com.bodyorthox --platforms ios` est exécutée
When la structure Feature-First est scaffoldée et les flavors dev/prod configurés
Then `flutter run --flavor dev -t lib/main_dev.dart` se lance sans erreur
And `dart run build_runner build` génère le code sans conflit
And `pubspec.yaml` déclare `sqlcipher_flutter_libs`
```

NEW:

```
Given le projet React Native est initialisé avec la structure src/ Feature-First
When les dépendances sont installées et webpack configuré
Then `npm run web` lance le dev server sans erreur sur localhost:8080
And `npm run type-check` passe sans erreur TypeScript
And `npm test` passe avec coverage ≥ 60%
And `package.json` déclare toutes les dépendances RN nécessaires
```

**Changement 4 — Stories techniques (toutes)**

Dans chaque story, remplacer les références :

- "Drift" → "SQLite via IDatabase"
- "Freezed" → "interfaces TypeScript"
- "Riverpod AsyncNotifier" → "Zustand store"
- "Flutter isolate" → "native thread"
- "sealed class" → "discriminated union / type literal"
- "go_router" → "@react-navigation"
- "`local_auth`" → "react-native-biometrics"
- "SqlCipher" → "react-native-sqlite-storage"

### 4.4 UX Design (`ux-design-specification.md`)

**Changements mineurs :**

- "Flutter" → "React Native" dans l'Executive Summary
- "Impeller" → "react-native-reanimated" dans les sections animation
- "Cupertino + Material 3" → "React Native components" dans le design system
- Palette de couleurs : déjà alignée (dark mode avec les mêmes tokens)
- Les composants custom gardent les mêmes noms : `GuidedCameraOverlay`, `ArticularAngleCard`, etc.
- **Les mockups Google Stitch restent inchangés** — ils sont indépendants du framework et servent toujours de référence visuelle

---

## Section 5 : Plan de Handoff

### Classification du scope : Major

Le changement affecte tous les documents de planning mais ne modifie pas le produit.

### Handoff

| Rôle                          | Responsabilité                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| **📋 Product Manager (John)** | Mettre à jour le PRD : remplacer les références Flutter par React Native dans toutes les sections |
| **🏗️ Architect (Winston)**    | Réécrire l'architecture.md pour refléter la stack React Native + TypeScript + Zustand             |
| **📋 Product Manager (John)** | Mettre à jour les epics.md : acceptance criteria techniques + Additional Requirements             |
| **🎨 UX Designer (Sally)**    | Mise à jour mineure de l'UX spec : remplacer les références framework                             |
| **🏃 Scrum Master (Bob)**     | Reset du sprint-status.yaml pour refléter le nouveau point de départ                              |

### Critères de succès

1. ✅ Aucune référence à Flutter, Dart, Drift, Riverpod, Freezed, go_router dans les documents mis à jour
2. ✅ Toutes les références techniques pointent vers React Native, TypeScript, Zustand, SQLite, @react-navigation
3. ✅ Les FR1-FR40 et NFR sont inchangées
4. ✅ La structure des epics et stories est conservée
5. ✅ Les documents sont cohérents entre eux

### Ordre d'exécution recommandé

1. **Architecture** (d'abord — les autres documents en dépendent)
2. **PRD** (ensuite — aligne la vision produit)
3. **Epics** (ensuite — met à jour les acceptance criteria)
4. **UX** (mineur — quelques find & replace)
5. **Sprint Status** (reset)
