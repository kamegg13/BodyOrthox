# Rapport de Dette Technique — BodyOrthox

**Date :** 2026-03-20
**Scope :** `/bodyorthox-rn/src/` (66 fichiers source, ~7 100 lignes hors tests)

---

## Resume executif

| Indicateur       | Valeur     |
| ---------------- | ---------- |
| **Score sante**  | **62/100** |
| Issues critiques | 2          |
| Issues high      | 7          |
| Issues medium    | 10         |
| Issues low       | 6          |

**Forces :** TypeScript strict sans erreurs, 0 TODO/FIXME, architecture feature-based coherente, design system en place, 512 tests passants, bon usage de zustand+immer, interfaces repository propres.

**Faiblesses principales :** Couverture tests insuffisante (68%), vulnurabilite npm, God files (capture-screen 547 lignes), abstraction data layer percee dans les screens, nombreuses couleurs hardcodees.

---

## Critical

| Fichier:ligne                                           | Issue                                                                                                                                                                                                                                       | Impact                                                                                                                            | Effort                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `node_modules/flatted`                                  | **Vulnerabilite npm severity:high** — Prototype Pollution via `parse()` (GHSA-rf6f-7fwh-wjgh). `npm audit` rapporte 1 high.                                                                                                                 | Securite — exploitation possible en contexte Node/SSR                                                                             | 5 min (`npm audit fix`)             |
| `src/features/capture/screens/capture-screen.tsx:46-56` | **Donnees ML simulees en dur pour native** — `NATIVE_SIMULATED_LANDMARKS` renvoie des fausses valeurs en production sur iOS/Android. La ligne 216 appelle `processFrames(NATIVE_SIMULATED_LANDMARKS)` sans aucun avertissement utilisateur. | Les analyses sur mobile retournent des **faux resultats** presentes comme reels — risque medical direct pour une app orthopedique | Eleve (integration frame processor) |

## High Priority

| Fichier:ligne                                                                | Issue                                                                                                                                                                                                                                                                          | Impact                                                         | Effort                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------ |
| `src/features/capture/screens/capture-screen.tsx` (547 lignes)               | **God file** — Ecran de 547 lignes melant logique camera, ML, preview, analyse, gestion d'erreur, et styles. Le `return` principal contient 4 branches conditionnelles imbriquees.                                                                                             | Maintenabilite, testabilite                                    | Moyen (split en composants + custom hooks) |
| `src/features/results/screens/replay-screen.tsx` (495 lignes)                | **God file** — 495 lignes dont styles, logique de correction, et sous-composants inline.                                                                                                                                                                                       | Maintenabilite                                                 | Moyen                                      |
| `src/features/patients/screens/patient-detail-screen.tsx` (460 lignes)       | **God file** — 460 lignes. Duplication du rendu `historySection` entre tablet et phone (lignes 262-288 dupliquent 201-237).                                                                                                                                                    | Maintenabilite, DRY                                            | Moyen                                      |
| 4 screens importent directement `getDatabase()` + `SqliteAnalysisRepository` | **Abstraction data layer percee** — `patient-detail-screen`, `patient-timeline-screen`, `results-screen`, `replay-screen` instancient directement le repo concret au lieu de passer par un store ou un hook. La capture feature utilise le store correctement, les autres non. | Couplage fort, incoherence architecturale, testabilite reduite | Moyen                                      |
| `src/core/database/database.web.ts` (190 lignes)                             | **SQL parser artisanal fragile** — Implementation web qui parse les requetes SQL avec des regex (`handleSelect`, `handleUpdate`, etc.). Ne gere pas les JOIN, sous-requetes, ORDER BY, LIMIT, multi-conditions WHERE. Toute requete SQL non triviale echouera silencieusement. | Fiabilite web, bugs silencieux                                 | Eleve (migrer vers sql.js WASM)            |
| `src/features/capture/data/pose-detector.web.ts:21`                          | **CDN sans integrity hash** — WASM et modele ML charges depuis jsdelivr et Google Storage sans SRI (`integrity` attribute).                                                                                                                                                    | Supply-chain attack — code tiers execute sans verification     | Faible (ajouter SRI ou bundler les assets) |
| Coverage globale 67.9% statements                                            | **En dessous du seuil de 80%** configure dans le CLAUDE.md. Branches a 65.3%. Le `package.json` definit un threshold de seulement 60-65% (`coverageThreshold`).                                                                                                                | Regression non detectee, confiance reduite                     | Eleve (ecrire tests manquants)             |

## Medium Priority

| Fichier:ligne                                                                                | Issue                                                                                                                                                                                                                                               | Impact                                                                                  | Effort |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 14 occurrences de `"#fff"`, `"#000"`, `"#111"`, `"#FFA726"` dans les screens                 | **Couleurs hardcodees hors design system** — Le design system (`colors.ts`) existe mais n'est pas utilise partout. `"#FFA726"` dans `capture-screen.tsx:541` est un orange warning non present dans la palette.                                     | Incoherence visuelle, maintenance du theming                                            | Faible |
| `src/shared/components/biometric-lock-screen-screen.tsx`                                     | **Nommage confus** — Fichier `biometric-lock-screen-screen.tsx` (double "screen") qui exporte `BiometricLockScreen_Screen` puis le re-exporte comme `BiometricLockScreen`.                                                                          | Confusion dev, code smell                                                               | Faible |
| `src/features/capture/store/capture-store.ts:41-48`                                          | **Module-level mutable state** — `_repository`, `_notificationService`, `_pendingAngles`, `_pendingConfidence` sont des variables mutables au niveau module, hors du store zustand.                                                                 | Testabilite difficile, etat partage implicite, risque de bugs en test parallele         | Moyen  |
| `src/features/patients/store/patients-store.ts:23`                                           | **Meme pattern** — `let _repository` mutable au niveau module.                                                                                                                                                                                      | Meme impact que ci-dessus                                                               | Faible |
| `src/features/capture/screens/capture-screen.tsx:129`                                        | **useEffect sans deps exhaustives** — `useEffect(() => { ... }, [])` avec references a `requestPermission`, `permissionGranted`, `permissionDenied`, `reset`.                                                                                       | Lint warning supprime, comportement potentiellement incorrect si les fonctions changent | Faible |
| `src/features/report/screens/report-screen.tsx:21`                                           | **Cast de type non type-safe** — `route.params as ReportRouteParams` bypass la verification de type. Le type `RootStackParamList["Report"]` passe des objets `Analysis` et `Patient` comme params de navigation (objets complexes dans les params). | Perte de type safety, serialisation potentiellement problematique avec React Navigation | Faible |
| `src/navigation/types.ts:14`                                                                 | **Objets complexes dans les params de navigation** — `Report: { analysis: Analysis; patient: Patient }` passe des objets complets au lieu d'IDs. React Navigation recommande des params serialisables.                                              | Warning React Navigation, deep linking impossible pour cette route                      | Faible |
| `src/features/capture/screens/capture-screen.tsx:173`                                        | **Appel `permissionGranted()` pour revenir a l'etat "ready"** — Detourne semantiquement la methode `permissionGranted` pour simplement reset la phase. Fait aux lignes 173 et 188.                                                                  | Lisibilite, intention du code obscure                                                   | Faible |
| `src/features/results/screens/replay-screen.tsx:49-61` + `patient-timeline-screen.tsx:33-56` | **Pattern de chargement async duplique** — Meme pattern IIFE + cancelled flag + try/catch repete dans 4 screens differents.                                                                                                                         | Duplication, devrait etre un hook custom `useAsyncData` ou `useAnalysis`                | Faible |
| 68 `TouchableOpacity` mais seulement 35 attributs `accessibilityRole/Label`                  | **Accessibilite incomplete** — ~50% des boutons interactifs n'ont pas d'attributs d'accessibilite.                                                                                                                                                  | Non-conformite WCAG, utilisateurs de lecteurs d'ecran                                   | Moyen  |

## Low Priority

| Fichier:ligne                                                 | Issue                                                                                                                                                                                        | Impact                                      | Effort            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------- |
| `react-native: 0.79.7` (latest: 0.84.1)                       | **React Native 2 versions majeures en retard** — Egalement `react-native-web: 0.19.13` vs `0.21.2`, `react-native-reanimated: 3.16` vs `4.2`, `eslint: 8.x` vs `10.x`                        | Pas de nouvelles features, dette croissante | Eleve (migration) |
| `tsconfig.json`                                               | **`noUnusedLocals: false`, `noUnusedParameters: false`** — Desactive la detection de code mort                                                                                               | Code mort non detecte                       | Trivial           |
| `package.json` — coverage thresholds                          | **Seuils configures a 60-65%** — Inferieur aux 80% requis par les standards du projet                                                                                                        | Donne un faux sentiment de securite         | Trivial           |
| `src/features/report/domain/report-generator.ts:128-140`      | **HTML genere avec interpolation de strings** — Les donnees patient (nom) sont injectees sans echappement HTML. Si le nom du patient contient `<script>`, XSS possible dans le rapport HTML. | Securite (XSS dans le rapport exporte)      | Faible            |
| `src/features/capture/screens/capture-screen.tsx:213`         | **setTimeout inutile** — `timerRef.current = setTimeout(() => {}, 100)` cree un timer qui ne fait rien.                                                                                      | Code mort                                   | Trivial           |
| `src/features/patients/screens/patient-detail-screen.tsx:306` | **`ItemSeparatorComponent` avec composant inline** — `() => <View style={styles.separator} />` cree un nouveau composant a chaque render.                                                    | Performance mineure sur longues listes      | Trivial           |

---

## Metriques

| Categorie                           | Valeur                                                            | Seuil acceptable |
| ----------------------------------- | ----------------------------------------------------------------- | ---------------- |
| TypeScript errors (`tsc --noEmit`)  | **0**                                                             | 0                |
| TODO/FIXME/HACK markers             | **0**                                                             | < 5              |
| Tests passing                       | **512/512**                                                       | 100%             |
| Statement coverage                  | **67.9%**                                                         | >= 80%           |
| Branch coverage                     | **65.3%**                                                         | >= 80%           |
| Function coverage                   | **73.3%**                                                         | >= 80%           |
| Line coverage                       | **68.8%**                                                         | >= 80%           |
| npm audit vulnerabilities           | **1 high**                                                        | 0                |
| Fichiers > 300 lignes (hors styles) | **3** (capture-screen 547, replay-screen 495, patient-detail 460) | 0                |
| Fichiers source (hors tests)        | 66                                                                | -                |
| Lignes source total                 | ~7 100                                                            | -                |
| Dependances outdated                | 30                                                                | < 10             |
| Hardcoded colors hors design system | 14                                                                | 0                |
| Boutons sans accessibilite          | ~33/68 (~49%)                                                     | 0%               |

---

## Plan d'action recommande

### Sprint 1 — Critique + Quick wins (1-2 jours)

1. `npm audit fix` pour corriger la vulnerabilite flatted
2. Ajouter un disclaimer/blocage visible sur mobile tant que les landmarks sont simules (capture-screen.tsx)
3. Echapper les donnees patient dans `report-generator.ts` (`generateReportHtml`) pour prevenir XSS
4. Monter les seuils de coverage dans package.json (80%) et ecrire les tests manquants prioritaires

### Sprint 2 — Architecture (3-5 jours)

5. Extraire un hook `useAnalysisRepository()` ou passer par un store pour eliminer les imports directs de `getDatabase()`/`SqliteAnalysisRepository` dans les 4 screens
6. Decomposer `capture-screen.tsx` : extraire `CapturePreview`, `CaptureSuccess`, `useCaptureLogic` hook
7. Decomposer `replay-screen.tsx` : extraire les sous-composants et la logique de correction
8. Eliminer la duplication tablet/phone dans `patient-detail-screen.tsx`
9. Creer un hook `useAsyncData` pour le pattern async repete dans les screens

### Sprint 3 — Qualite (2-3 jours)

10. Remplacer toutes les couleurs hardcodees par des tokens du design system
11. Ajouter `accessibilityRole` et `accessibilityLabel` aux 33 boutons qui en manquent
12. Renommer `biometric-lock-screen-screen.tsx` proprement
13. Deplacer les variables module-level des stores dans le store zustand
14. Activer `noUnusedLocals`/`noUnusedParameters` dans tsconfig

### Sprint 4 — Infrastructure (5+ jours)

15. Remplacer le SQL parser artisanal web par sql.js WASM
16. Ajouter SRI ou bundler les assets MediaPipe (WASM + modele)
17. Mettre a jour React Native 0.79 -> 0.84 et les dependances associees
18. Integrer un vrai frame processor pour la detection de pose sur mobile
