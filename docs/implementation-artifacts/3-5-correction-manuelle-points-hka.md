# Story 3.5: Replay Expert & Correction Manuelle des Points Articulaires HKA

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to review the analysis frame-by-frame with angles overlaid, and manually adjust a joint point if the ML confidence is low,
so that I can validate or correct results before generating a report.

## Acceptance Criteria

**AC1 — Accès au replay depuis l'ecran de resultats**
**Given** je suis sur l'ecran de resultats d'une analyse (ResultsScreen, vue expert)
**When** j'appuie sur le bouton "Relecture experte"
**Then** je suis navigue vers `ReplayScreen` avec `analysisId` et `patientId`
**And** l'analyse est chargee depuis SQLite via `SqliteAnalysisRepository.getById()`

**AC2 — Affichage replay image par image avec angles superposes**
**Given** le `ReplayScreen` est affiche avec une analyse valide
**When** l'ecran se charge
**Then** les angles articulaires (genou, hanche, cheville) sont affiches par articulation selectionnable (FR18)
**And** chaque articulation affiche sa valeur en degres (1 decimale)
**And** le score de confiance ML global est visible en badge colore

**AC3 — Signalement visuel des articulations a faible confiance**
**Given** une articulation a un score de confiance ML < 0.60
**When** l'ecran de replay s'affiche
**Then** l'articulation a faible confiance est visuellement signalee (couleur `Colors.confidenceLow` / bordure rouge)
**And** un indicateur textuel "Confiance faible" est affiche a cote de l'articulation

**AC4 — Correction manuelle d'un point articulaire**
**Given** une articulation est selectionnee dans le replay
**When** je modifie manuellement la valeur de l'angle via un controle de saisie (slider ou champ numerique)
**Then** la nouvelle valeur est enregistree dans l'analyse avec `manualCorrectionApplied: true` et `manualCorrectionJoint: '{joint}'` (FR17)
**And** l'analyse mise a jour est persistee via `SqliteAnalysisRepository.update()`
**And** un feedback visuel confirme l'enregistrement de la correction

**AC5 — Disclaimer correction manuelle dans le rapport**
**Given** une correction manuelle a ete appliquee sur une articulation
**When** le rapport PDF est genere apres correction
**Then** le rapport inclut le disclaimer : "Donnees [articulation] : estimees — verification manuelle effectuee."
**And** le champ `manualCorrectionApplied` est `true` dans l'analyse persistee

**AC6 — Navigation retour vers les resultats**
**Given** je suis sur le `ReplayScreen`
**When** j'appuie sur "Retour"
**Then** je suis navigue vers `ResultsScreen` avec les memes `analysisId` et `patientId`

## Tasks / Subtasks

- [ ] Tache 1 — Ecrire les tests unitaires pour la logique de correction manuelle (AC: 4, 5)
  - [ ] T1.1 — Test `updateAnalysisWithCorrection(analysis, joint, newAngle)` : retourne une nouvelle Analysis avec `manualCorrectionApplied: true`
  - [ ] T1.2 — Test immutabilite : l'analyse originale n'est pas mutee
  - [ ] T1.3 — Test validation : angle corrige est un nombre valide (0-360 degres)
  - [ ] T1.4 — Test `correctionDisclaimer(joint)` : retourne le texte disclaimer correct pour chaque articulation

- [ ] Tache 2 — Implementer la logique domaine de correction manuelle (AC: 4, 5)
  - [ ] T2.1 — Creer `src/features/results/domain/manual-correction.ts` avec `updateAnalysisWithCorrection()` et `correctionDisclaimer()`
  - [ ] T2.2 — Ajouter methode `update(id, partial)` a `IAnalysisRepository` et `SqliteAnalysisRepository`

- [ ] Tache 3 — Ecrire les tests d'integration du `ReplayScreen` (AC: 1, 2, 3, 4, 6)
  - [ ] T3.1 — Test chargement analyse depuis repo mock → affiche les 3 boutons d'articulation
  - [ ] T3.2 — Test selection d'une articulation → affiche detail avec angle et confiance
  - [ ] T3.3 — Test signalement visuel articulation faible confiance (score < 0.60)
  - [ ] T3.4 — Test correction manuelle → appel `update()` sur le repository avec les bonnes valeurs
  - [ ] T3.5 — Test navigation retour vers ResultsScreen

- [ ] Tache 4 — Completer le `ReplayScreen` existant avec la fonctionnalite de correction (AC: 3, 4)
  - [ ] T4.1 — Ajouter signalement visuel des articulations a faible confiance (bordure rouge, texte)
  - [ ] T4.2 — Ajouter un controle de correction (champ numerique / slider) dans la zone de detail
  - [ ] T4.3 — Ajouter bouton "Enregistrer la correction" avec feedback visuel
  - [ ] T4.4 — Connecter la correction au repository pour persistance

- [ ] Tache 5 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-6)
  - [ ] T5.1 — `npx jest --testPathPattern results` → tous les tests passent
  - [ ] T5.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 6 — Mettre a jour sprint-status.yaml
  - [ ] T6.1 — `3-5-correction-manuelle-points-hka: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native

**Le `ReplayScreen` existe deja mais ne gere pas encore la correction manuelle.** Le travail principal est d'ajouter la fonctionnalite de correction et le signalement de faible confiance.

**Fichiers existants :**

| Fichier                                                   | Statut                   | Notes                                                                                                   |
| --------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `src/features/results/screens/replay-screen.tsx`          | Partiellement implemente | Selection articulaire + affichage detail OK. Manque : correction manuelle, signalement faible confiance |
| `src/features/results/screens/results-screen.tsx`         | Implemente               | Bouton "Relecture experte" navigue vers ReplayScreen (vue expert)                                       |
| `src/features/capture/domain/analysis.ts`                 | Implemente               | Interface `Analysis` avec `manualCorrectionApplied` et `manualCorrectionJoint`                          |
| `src/features/capture/data/analysis-repository.ts`        | Implemente               | Interface `IAnalysisRepository` — manque `update()`                                                     |
| `src/features/capture/data/sqlite-analysis-repository.ts` | Implemente               | Implemente `IAnalysisRepository` — manque `update()`                                                    |
| `src/navigation/types.ts`                                 | Implemente               | Route `Replay: { analysisId, patientId }`                                                               |

### Ce qui doit etre construit

1. **`manual-correction.ts`** — Logique domaine pour la correction manuelle (pure function, immutable)
2. **Methode `update()` sur `IAnalysisRepository`** — Pour persister les corrections
3. **UI de correction dans `ReplayScreen`** — Champ numerique / slider + bouton enregistrer
4. **Signalement visuel faible confiance** — Bordure rouge + texte "Confiance faible" sur les articulations < 0.60

### Stack technique React Native

- **State** : Zustand (immer middleware) — voir `capture-store.ts`
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `react-native-sqlite-storage` (natif) / web fallback
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
// src/shared/design-system/colors.ts
Colors.primary: '#4a90d9'       // Boutons, liens
Colors.success: '#27ae60'       // Normal / confiance elevee
Colors.warning: '#f39c12'       // Deviation legere / confiance moyenne
Colors.error: '#e74c3c'         // Deviation severe / confiance faible
Colors.background: '#0f0f1a'    // Fond principal (dark mode)
Colors.backgroundCard: '#1a1a2e' // Cartes
Colors.textPrimary: '#ffffff'   // Texte principal
Colors.confidenceHigh: '#27ae60'
Colors.confidenceMedium: '#f39c12'
Colors.confidenceLow: '#e74c3c'
```

### Anti-patterns a eviter

- **NE PAS** muter l'objet `Analysis` existant — toujours creer une nouvelle instance immutable
- **NE PAS** acceder a SQLite directement depuis le screen — toujours via le Repository
- **NE PAS** modifier le design system (palette, spacing) sauf si un AC le demande
- **NE PAS** utiliser MobX — le codebase RN utilise Zustand
- **NE PAS** implementer de replay video reel (frames video) dans le MVP — le replay est une vue de selection articulaire avec correction

### Project Structure Notes

```
bodyorthox-rn/src/features/results/
  domain/
    reference-norms.ts                 <- EXISTANT
    manual-correction.ts               <- A CREER (AC4, AC5)
    __tests__/
      reference-norms.test.ts          <- EXISTANT
      manual-correction.test.ts        <- A CREER
  screens/
    results-screen.tsx                 <- EXISTANT
    replay-screen.tsx                  <- EXISTANT — a completer (AC3, AC4)
  components/
    articular-angle-card.tsx           <- EXISTANT

bodyorthox-rn/src/features/capture/
  data/
    analysis-repository.ts             <- EXISTANT — ajouter update()
    sqlite-analysis-repository.ts      <- EXISTANT — ajouter update()
```

### Pattern de test React Native

```typescript
// Mock de la DB pour les tests du ReplayScreen
jest.mock("../../../core/database/init", () => ({
  getDatabase: () => mockDb,
}));

jest.mock("../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getById: jest.fn().mockResolvedValue(mockAnalysis),
    update: jest.fn().mockResolvedValue(undefined),
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

### Commandes de verification

```bash
cd bodyorthox-rn

# TypeScript check
npx tsc --noEmit

# Tests results + replay
npx jest --testPathPattern results --verbose

# Tous les tests
npx jest --verbose
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-3.5] — "Replay Expert & Correction Manuelle"
- [Source: docs/planning-artifacts/architecture.md] — Structure Feature-First, discriminated unions
- [Source: bodyorthox-rn/src/features/results/screens/replay-screen.tsx] — Implementation existante
- [Source: bodyorthox-rn/src/features/capture/domain/analysis.ts] — Modele Analysis avec manualCorrectionApplied
- [Source: bodyorthox-rn/src/features/capture/data/analysis-repository.ts] — Interface IAnalysisRepository

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
