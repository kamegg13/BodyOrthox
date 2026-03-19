# Story 2.3: Historique des Analyses d'un Patient

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to view the complete history of analyses for a patient,
so that I can track changes over time and prepare for a consultation with context.

## Acceptance Criteria

**AC1 — Liste des analyses accessible depuis la fiche patient**
**Given** un patient a au moins une analyse enregistree
**When** j'ouvre la fiche patient (`PatientDetailScreen`)
**Then** toutes ses analyses sont listees dans une section "Historique des analyses"
**And** les analyses sont ordonnees par date decroissante (plus recente en haut)
**And** l'index SQL `idx_analyses_patient` est utilise pour le tri (`patient_id, created_at DESC`)

**AC2 — Informations affichees par entree d'analyse**
**Given** la liste des analyses est affichee
**When** je regarde une entree d'analyse
**Then** chaque entree affiche :
- La date de l'analyse (format lisible via `formatDisplayDateTime()`)
- Les angles principaux : genou, hanche, cheville (1 decimale, degres)
- Le score de confiance ML (badge colore : vert >= 0.85, orange >= 0.60, rouge < 0.60)

**AC3 — Navigation vers les resultats d'une analyse**
**Given** la liste des analyses est affichee
**When** j'appuie sur une entree d'analyse
**Then** je suis navigue vers `ResultsScreen` avec `analysisId` et `patientId`

**AC4 — Performance pour 5 000+ analyses**
**Given** un patient a 5 000+ analyses en base
**When** la liste se charge
**Then** le chargement se fait sans degradation perceptible (NFR-C2)
**And** la liste utilise un composant scrollable performant (FlatList ou equivalent)

**AC5 — Etat vide (aucune analyse)**
**Given** un patient n'a aucune analyse
**When** j'ouvre la fiche patient
**Then** un message "Aucune analyse" est affiche
**And** un bouton "Demarrer une analyse" navigue vers `CaptureScreen` avec le `patientId`

**AC6 — Chargement des analyses depuis SQLite**
**Given** j'ouvre la fiche patient
**When** les analyses sont chargees
**Then** elles sont recuperees via `IAnalysisRepository.getForPatient(patientId)`
**And** un indicateur de chargement est affiche pendant la requete

## Tasks / Subtasks

- [ ] Tache 1 — Ecrire les tests unitaires du chargement des analyses (AC: 1, 6)
  - [ ] T1.1 — Test `IAnalysisRepository.getForPatient(patientId)` → retourne les analyses triees par date DESC
  - [ ] T1.2 — Test `SqliteAnalysisRepository.getForPatient()` → requete SQL correcte avec index
  - [ ] T1.3 — Test retour vide quand aucune analyse n'existe

- [ ] Tache 2 — Ecrire les tests du composant `PatientHistoryTile` (AC: 2, 3)
  - [ ] T2.1 — Test rendu : date, angles (genou/hanche/cheville), badge confiance
  - [ ] T2.2 — Test badge couleur : vert (>= 0.85), orange (>= 0.60), rouge (< 0.60)
  - [ ] T2.3 — Test appui → callback `onPress(analysis)` appele

- [ ] Tache 3 — Implementer/completer le composant `PatientHistoryTile` (AC: 2, 3)
  - [ ] T3.1 — Verifier/completer `src/features/patients/components/patient-history-tile.tsx`
  - [ ] T3.2 — Props : `analysis: Analysis`, `onPress: (analysis: Analysis) => void`
  - [ ] T3.3 — Afficher date, angles, badge confiance colore

- [ ] Tache 4 — Ecrire les tests d'integration du `PatientDetailScreen` avec historique (AC: 1, 3, 4, 5, 6)
  - [ ] T4.1 — Test chargement analyses → section historique affichee avec les entrees
  - [ ] T4.2 — Test appui sur une analyse → navigation vers ResultsScreen
  - [ ] T4.3 — Test etat vide → message "Aucune analyse" + bouton "Demarrer"
  - [ ] T4.4 — Test etat loading → indicateur affiche

- [ ] Tache 5 — Completer le `PatientDetailScreen` avec la section historique (AC: 1, 3, 5, 6)
  - [ ] T5.1 — Ajouter `useEffect` pour charger les analyses via `SqliteAnalysisRepository.getForPatient()`
  - [ ] T5.2 — Rendre la liste des `PatientHistoryTile` sous la section profil
  - [ ] T5.3 — Ajouter etat vide et bouton "Demarrer une analyse"
  - [ ] T5.4 — Ajouter navigation vers `ResultsScreen` au tap sur une analyse

- [ ] Tache 6 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-6)
  - [ ] T6.1 — `npx jest --testPathPattern patients --verbose` → tous les tests passent
  - [ ] T6.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 7 — Mettre a jour sprint-status.yaml
  - [ ] T7.1 — `2-3-historique-des-analyses-dun-patient: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native

**Le `PatientDetailScreen` existe mais n'affiche pas encore l'historique des analyses.** Le composant `patient-history-tile.tsx` existe dans le dossier components mais doit etre verifie/complete.

**Fichiers existants :**

| Fichier | Statut | Notes |
| --- | --- | --- |
| `src/features/patients/screens/patient-detail-screen.tsx` | Partiellement implemente | Affiche profil patient, boutons action. Manque : section historique analyses |
| `src/features/patients/components/patient-history-tile.tsx` | Existe | A verifier : affiche-t-il date, angles, badge confiance ? |
| `src/features/capture/data/analysis-repository.ts` | Implemente | Interface `IAnalysisRepository` avec `getForPatient(patientId)` |
| `src/features/capture/data/sqlite-analysis-repository.ts` | Implemente | `SqliteAnalysisRepository.getForPatient()` — a verifier |
| `src/features/capture/domain/analysis.ts` | Implemente | Interface `Analysis`, `confidenceLabel()` |
| `src/core/database/schema.ts` | Implemente | Index `idx_analyses_patient ON analyses(patient_id, created_at DESC)` |
| `src/navigation/types.ts` | Implemente | Routes `PatientDetail`, `Results`, `Capture` |

### Ce qui doit etre construit/complete

1. **Section historique dans `PatientDetailScreen`** — Charger et afficher les analyses du patient
2. **`PatientHistoryTile` complet** — Verifier qu'il affiche date + angles + badge confiance
3. **Navigation vers ResultsScreen** — Au tap sur une analyse
4. **Etat vide** — Message + bouton "Demarrer une analyse" quand pas d'analyses

### Stack technique React Native

- **State** : Zustand (immer middleware)
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `react-native-sqlite-storage` (natif), index `idx_analyses_patient`
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
Colors.primary: '#4a90d9'       // Boutons, liens
Colors.success: '#27ae60'       // Badge confiance elevee (>= 0.85)
Colors.warning: '#f39c12'       // Badge confiance moyenne (>= 0.60)
Colors.error: '#e74c3c'         // Badge confiance faible (< 0.60)
Colors.background: '#0f0f1a'
Colors.backgroundCard: '#1a1a2e' // Cartes historique
Colors.textPrimary: '#ffffff'
Colors.textSecondary: '#b0b0c8' // Dates, meta
Colors.confidenceHigh: '#27ae60'
Colors.confidenceMedium: '#f39c12'
Colors.confidenceLow: '#e74c3c'
```

### Anti-patterns a eviter

- **NE PAS** charger les analyses dans le composant avec du SQL direct — utiliser `IAnalysisRepository.getForPatient()`
- **NE PAS** utiliser ScrollView pour la liste d'analyses — utiliser FlatList pour la performance
- **NE PAS** recalculer les angles — utiliser les valeurs persistees
- **NE PAS** utiliser MobX — le codebase RN utilise Zustand
- **NE PAS** oublier de gerer l'etat loading pendant le chargement des analyses

### Project Structure Notes

```
bodyorthox-rn/src/features/patients/
  components/
    patient-list-tile.tsx              <- EXISTANT
    patient-history-tile.tsx           <- EXISTANT — a verifier/completer
    __tests__/
      patient-list-tile.test.tsx       <- EXISTANT
      patient-history-tile.test.tsx    <- A CREER
  screens/
    patient-detail-screen.tsx          <- EXISTANT — completer avec historique

bodyorthox-rn/src/features/capture/
  data/
    analysis-repository.ts             <- EXISTANT (getForPatient)
    sqlite-analysis-repository.ts      <- EXISTANT
```

### Pattern de test React Native

```typescript
// Mock du repository pour les tests
const mockAnalyses: Analysis[] = [
  {
    id: 'a1', patientId: 'p1', createdAt: '2026-03-19T10:00:00Z',
    angles: { kneeAngle: 5.2, hipAngle: 170.1, ankleAngle: 90.5 },
    confidenceScore: 0.92, manualCorrectionApplied: false, manualCorrectionJoint: null,
  },
  {
    id: 'a2', patientId: 'p1', createdAt: '2026-03-18T10:00:00Z',
    angles: { kneeAngle: 6.1, hipAngle: 168.3, ankleAngle: 89.2 },
    confidenceScore: 0.55, manualCorrectionApplied: true, manualCorrectionJoint: 'knee',
  },
];

jest.mock("../../../core/database/init", () => ({
  getDatabase: () => mockDb,
}));

jest.mock("../../capture/data/sqlite-analysis-repository", () => ({
  SqliteAnalysisRepository: jest.fn().mockImplementation(() => ({
    getForPatient: jest.fn().mockResolvedValue(mockAnalyses),
  })),
}));
```

### Commandes de verification

```bash
cd bodyorthox-rn

# TypeScript check
npx tsc --noEmit

# Tests patients
npx jest --testPathPattern patients --verbose

# Tous les tests
npx jest --verbose
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-2.3] — "Historique des Analyses d'un Patient"
- [Source: docs/planning-artifacts/architecture.md] — Index SQL `idx_analyses_patient`, NFR-C2
- [Source: bodyorthox-rn/src/features/patients/screens/patient-detail-screen.tsx] — Screen existant
- [Source: bodyorthox-rn/src/features/capture/data/analysis-repository.ts] — Interface `getForPatient()`
- [Source: bodyorthox-rn/src/core/database/schema.ts] — Index `idx_analyses_patient`

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
