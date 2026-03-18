# Story 3.4: Affichage des Résultats avec Normes de Référence

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to see the measured HKA angles alongside age-appropriate reference norms, in simple or expert view,
so that I can immediately interpret the clinical significance of the results during a consultation.

## Acceptance Criteria

**AC1 — Écran de résultats accessible après analyse**
**Given** l'analyse HKA est terminée avec succès (CaptureScreen → `saveAnalysis()`)
**When** l'app navigue vers `ResultsScreen` avec `analysisId` et `patientId`
**Then** l'analyse est chargée depuis SQLite via `SqliteAnalysisRepository.getById()`
**And** les données affichées correspondent exactement aux mesures persistées (pas de recalcul)

**AC2 — `ArticularAngleCard` pour chaque articulation**
**Given** l'analyse contient `kneeAngle`, `hipAngle`, `ankleAngle` (1 décimale, degrés)
**When** l'écran de résultats s'affiche
**Then** 3 `ArticularAngleCard` sont rendus (genou, hanche, cheville) avec :

- La valeur en degrés (1 décimale) — FR15
- Un indicateur visuel de déviation (normal/léger/modéré/sévère) via barre de norme colorée
- Le libellé de la plage normative de référence (ex: "Norme : 0–10°")

**AC3 — Plages normatives de référence**
**Given** les normes de référence sont définies dans `reference-norms.ts`
**When** `assessAngle(joint, value)` est appelé
**Then** le résultat contient : valeur mesurée, norme applicable, écart, niveau de déviation, booléen dans/hors norme
**And** les niveaux sont : `normal` (dans la plage), `mild` (≤5° d'écart), `moderate` (≤15°), `severe` (>15°)

**AC4 — Vue simple (mode par défaut)**
**Given** l'écran s'ouvre en mode `simple` par défaut
**When** le toggle est sur "Vue patient"
**Then** les `ArticularAngleCard` affichent angles + indicateur visuel (dans/hors norme) — FR38
**And** le score de confiance global est visible en badge (couleur vert/orange/rouge selon seuil 0.85/0.60)
**And** la date de l'analyse est affichée

**AC5 — Vue experte (toggle)**
**Given** le praticien bascule vers "Vue expert"
**When** le toggle est activé
**Then** une section "Données cliniques" supplémentaire apparaît — FR38
**And** elle affiche : score de confiance ML (%), ID analyse, statut correction manuelle
**And** un bouton "Relecture experte" navigue vers `ReplayScreen` (Story 3.5)

**AC6 — Indicateur de correction manuelle**
**Given** l'analyse a `manualCorrectionApplied: true`
**When** l'écran s'affiche
**Then** une note "✏️ Correction manuelle ({joint})" est visible dans la carte de métadonnées

**AC7 — Navigation retour**
**Given** le praticien est sur l'écran de résultats
**When** il tape "← Retour"
**Then** il est navigué vers `PatientDetail` du patient concerné

## Tasks / Subtasks

- [ ] Tâche 1 — Vérifier et compléter les tests unitaires existants (AC: 2, 3)
  - [ ] T1.1 — Vérifier `reference-norms.test.ts` : couvre tous les niveaux de déviation (normal, mild, moderate, severe)
  - [ ] T1.2 — Vérifier `articular-angle-card.test.tsx` : rendu correct pour chaque niveau
  - [ ] T1.3 — Ajouter tests manquants si gaps identifiés

- [ ] Tâche 2 — Écrire les tests d'intégration du `ResultsScreen` (AC: 1, 4, 5, 6, 7)
  - [ ] T2.1 — Test chargement analyse depuis repo mock → affiche 3 cartes d'angles
  - [ ] T2.2 — Test toggle simple → expert → section "Données cliniques" visible
  - [ ] T2.3 — Test correction manuelle visible quand `manualCorrectionApplied: true`
  - [ ] T2.4 — Test navigation retour vers PatientDetail
  - [ ] T2.5 — Test état loading et erreur

- [ ] Tâche 3 — Vérifier l'intégration end-to-end (AC: 1)
  - [ ] T3.1 — Vérifier que `CaptureScreen` → `saveAnalysis()` → navigation `Results` fonctionne
  - [ ] T3.2 — Vérifier les types de route (`Results: { analysisId, patientId }`)

- [ ] Tâche 4 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-7)
  - [ ] T4.1 — `npx jest --testPathPattern results` → tous les tests passent
  - [ ] T4.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tâche 5 — Mettre à jour sprint-status.yaml et proof.md
  - [ ] T5.1 — `3-4-affichage-resultats-angle-hka: done` si tous les tests passent
  - [ ] T5.2 — Section preuve dans `docs/proof.md`

## Dev Notes

### État actuel du code React Native (DÉJÀ IMPLÉMENTÉ)

**IMPORTANT : La majorité de cette story est déjà implémentée dans `bodyorthox-rn/`.** Le travail restant est principalement de la validation et des tests d'intégration.

**Fichiers existants :**

| Fichier                                                                   | Statut        | Notes                                                                                         |
| ------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `src/features/results/screens/results-screen.tsx`                         | ✅ Implémenté | ScrollView, toggle simple/expert, 3 ArticularAngleCards, navigation retour, ExpertRow section |
| `src/features/results/components/articular-angle-card.tsx`                | ✅ Implémenté | Norm bar visuelle, badge déviation coloré, accessibilityLabel                                 |
| `src/features/results/domain/reference-norms.ts`                          | ✅ Implémenté | `assessAngle()`, `deviationColor()`, `REFERENCE_NORMS` (knee, hip, ankle)                     |
| `src/features/results/domain/__tests__/reference-norms.test.ts`           | ✅ Implémenté | Tests existants                                                                               |
| `src/features/results/components/__tests__/articular-angle-card.test.tsx` | ✅ Implémenté | Tests existants                                                                               |
| `src/features/capture/domain/analysis.ts`                                 | ✅ Implémenté | `Analysis`, `ArticularAngles`, `confidenceLabel()`                                            |
| `src/navigation/types.ts`                                                 | ✅ Implémenté | Route `Results: { analysisId, patientId }`                                                    |

### Ce qui manque potentiellement

1. **Tests d'intégration du `ResultsScreen`** — Le screen charge depuis SQLite via `getDatabase()` + `SqliteAnalysisRepository`. Les tests doivent mocker la DB.
2. **`BodySkeletonOverlay`** — Mentionné dans les épics (FR18) mais assigné à Story 3.5 (Replay). **Ne PAS l'implémenter ici.**
3. **Normes par âge/profil** — Les normes actuelles sont statiques (pas paramétrées par âge). C'est acceptable pour le MVP — le PRD mentionne "plages normatives par âge et profil" mais la story 3.4 utilise des normes standards. L'ajout de profils par âge est un enhancement post-MVP.

### Stack technique React Native

- **State** : Zustand (immer middleware) — voir `capture-store.ts`
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `op-sqlite` (natif) / `sql.js` (web)
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
// src/shared/design-system/colors.ts
Colors.primary: '#4a90d9'       // Boutons, liens
Colors.success: '#27ae60'       // Normal / confiance élevée
Colors.warning: '#f39c12'       // Déviation légère / confiance moyenne
Colors.error: '#e74c3c'         // Déviation sévère / confiance faible
Colors.background: '#0f0f1a'    // Fond principal (dark mode)
Colors.backgroundCard: '#1a1a2e' // Cartes
Colors.textPrimary: '#ffffff'   // Texte principal
```

**Note : Le design system RN utilise un thème dark (fond `#0f0f1a`), différent du Clinical White Flutter.** C'est le choix actuel du codebase RN — ne pas changer.

### Niveaux de confiance — seuils

```typescript
confidenceScore >= 0.85 → Colors.confidenceHigh (#27ae60) — "Élevée"
confidenceScore >= 0.60 → Colors.confidenceMedium (#f39c12) — "Moyenne"
confidenceScore < 0.60  → Colors.confidenceLow (#e74c3c) — "Faible"
```

### Niveaux de déviation — seuils

```typescript
isWithinNorm           → 'normal'   (#27ae60)
deviation ≤ 5°         → 'mild'     (#f39c12)
deviation ≤ 15°        → 'moderate' (#e67e22)
deviation > 15°        → 'severe'   (#e74c3c)
```

### Pattern de test React Native

```typescript
// Mock de la DB pour les tests du ResultsScreen
jest.mock("../../../core/database/init", () => ({
  getDatabase: () => mockDb,
}));

jest.mock("../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getById: jest.fn().mockResolvedValue(mockAnalysis),
  })),
}));

// Mock de la navigation
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({
    params: { analysisId: "test-id", patientId: "patient-id" },
  }),
}));
```

### Anti-patterns à éviter

- **NE PAS** recalculer les angles dans le ResultsScreen — utiliser les valeurs persistées
- **NE PAS** implémenter BodySkeletonOverlay dans cette story (c'est Story 3.5)
- **NE PAS** modifier le design system (palette, spacing) sauf si un AC le demande
- **NE PAS** ajouter de normes par âge/profil dans cette story (enhancement post-MVP)
- **NE PAS** utiliser MobX — le codebase RN utilise Zustand

### Project Structure Notes

```
bodyorthox-rn/src/features/results/
  components/
    articular-angle-card.tsx           ← EXISTANT (AC2)
    __tests__/
      articular-angle-card.test.tsx    ← EXISTANT — vérifier couverture
  domain/
    reference-norms.ts                 ← EXISTANT (AC3)
    __tests__/
      reference-norms.test.ts          ← EXISTANT — vérifier couverture
  screens/
    results-screen.tsx                 ← EXISTANT (AC1, AC4, AC5, AC6, AC7)
    replay-screen.tsx                  ← EXISTANT (Story 3.5)
```

### Travail réel de cette story

Puisque le code est déjà implémenté, cette story se concentre sur :

1. **Validation** : vérifier que l'implémentation existante satisfait tous les ACs
2. **Tests manquants** : écrire les tests d'intégration du `ResultsScreen` si absents
3. **Corrections** : fixer tout écart entre l'implémentation et les ACs
4. **Proof** : exécuter `npx jest` et documenter les résultats

### Commandes de vérification

```bash
cd bodyorthox-rn

# TypeScript check
npx tsc --noEmit

# Tests results
npx jest --testPathPattern results --verbose

# Tous les tests
npx jest --verbose
```

### Previous story intelligence (Story 3.3)

- Story 3.3 était purement destructive (nettoyage pipeline Flutter). Pas de patterns transférables.
- Story 3.0 a établi le pattern `CapturePhotoHkaNotifier` → sealed state → navigation (Flutter).
- En RN, le pattern équivalent est `useCaptureStore` (Zustand) → `CapturePhase` (union type) → React Navigation.

### References

- [Source: docs/planning-artifacts/epics.md#Story-3.4] — "Affichage des Résultats avec Normes de Référence"
- [Source: docs/planning-artifacts/architecture.md#Architecture-Frontend] — Structure Feature-First, switch exhaustif
- [Source: docs/planning-artifacts/ux-design-specification.md#Step-1-Capture] — Design system, palette
- [Source: bodyorthox-rn/src/features/results/screens/results-screen.tsx] — Implémentation existante
- [Source: bodyorthox-rn/src/features/results/domain/reference-norms.ts] — Logique de normes
- [Source: bodyorthox-rn/src/features/capture/domain/analysis.ts] — Modèle Analysis
- [Source: bodyorthox-rn/src/navigation/types.ts] — Route Results params

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
