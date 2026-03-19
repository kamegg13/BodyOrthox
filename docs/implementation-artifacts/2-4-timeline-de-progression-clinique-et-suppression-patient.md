# Story 2.4: Timeline de Progression Clinique et Suppression Patient

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to visualize a patient's clinical progression over time and be able to delete a patient,
so that I can track treatment effectiveness and maintain data hygiene.

## Acceptance Criteria

**AC1 — Acces a la timeline depuis la fiche patient**
**Given** un patient a 2+ analyses enregistrees
**When** j'appuie sur "Progression clinique" depuis `PatientDetailScreen` (testID: `timeline-button`)
**Then** je suis navigue vers `PatientTimelineScreen` avec `patientId`

**AC2 — Graphe temporel comparatif des angles articulaires**
**Given** le `PatientTimelineScreen` est affiche avec les analyses du patient
**When** les analyses sont chargees depuis `IAnalysisRepository.getForPatient(patientId)`
**Then** les angles articulaires (genou, hanche, cheville) sont affiches sur un graphe temporel (FR5)
**And** chaque articulation est identifiable par couleur : genou `Colors.chartKnee` (#4a90d9), hanche `Colors.chartHip` (#e74c3c), cheville `Colors.chartAnkle` (#27ae60)
**And** l'axe X represente les dates des analyses
**And** l'axe Y represente les angles en degres

**AC3 — Timeline chronologique avec items navigables**
**Given** les analyses sont affichees dans la timeline
**When** j'appuie sur un item de timeline
**Then** je suis navigue vers `ResultsScreen` avec `analysisId` et `patientId` de l'analyse selectionnee

**AC4 — Etat vide de la timeline**
**Given** le patient a 0 ou 1 analyse
**When** j'ouvre la timeline
**Then** un message "Aucune analyse" ou "Effectuez une premiere analyse pour visualiser la progression" est affiche
**And** un bouton "Demarrer une analyse" navigue vers `CaptureScreen` avec `patientId`

**AC5 — Suppression d'un patient avec confirmation**
**Given** je suis sur la fiche patient (`PatientDetailScreen`)
**When** j'appuie sur "Supprimer le patient" (testID: `delete-button`)
**Then** une alerte de confirmation explicite est affichee ("Voulez-vous vraiment supprimer [Nom] ?")
**And** deux options : "Annuler" (style cancel) et "Supprimer" (style destructive)

**AC6 — Suppression atomique en transaction SQL**
**Given** je confirme la suppression du patient
**When** la suppression est executee
**Then** le patient ET toutes ses analyses associees sont supprimes en transaction SQL atomique (NFR-R2, FR6)
**And** la suppression utilise `ON DELETE CASCADE` defini dans le schema SQL (`REFERENCES patients(id) ON DELETE CASCADE`)
**And** aucune donnee orpheline ne subsiste en base apres suppression

**AC7 — Navigation apres suppression**
**Given** le patient a ete supprime avec succes
**When** la suppression est terminee
**Then** je suis navigue vers `PatientsScreen`
**And** le patient n'apparait plus dans la liste (Zustand store mis a jour)

**AC8 — Gestion erreur de suppression**
**Given** une erreur survient lors de la suppression (ex: erreur SQLite)
**When** l'erreur est capturee
**Then** un message d'erreur est affiche via le store Zustand (`error` state)
**And** le patient reste intact en base

## Tasks / Subtasks

- [ ] Tache 1 — Ecrire les tests unitaires du chargement timeline (AC: 2)
  - [ ] T1.1 — Test `IAnalysisRepository.getForPatient()` → analyses triees par date ASC (pour le graphe)
  - [ ] T1.2 — Test transformation des analyses en donnees de graphe (dates en X, angles en Y)

- [ ] Tache 2 — Ecrire les tests du composant graphe timeline (AC: 2)
  - [ ] T2.1 — Test rendu du graphe avec 3 series (genou, hanche, cheville)
  - [ ] T2.2 — Test couleurs correctes : `chartKnee`, `chartHip`, `chartAnkle`
  - [ ] T2.3 — Test avec donnees vides → pas de crash

- [ ] Tache 3 — Implementer le composant graphe timeline (AC: 2)
  - [ ] T3.1 — Choisir une lib de graphe compatible React Native (ex: `react-native-svg` + custom, ou `victory-native`)
  - [ ] T3.2 — Creer `src/features/patients/components/progression-chart.tsx`
  - [ ] T3.3 — Rendre le graphe avec les 3 series colorees

- [ ] Tache 4 — Completer le `PatientTimelineScreen` (AC: 1, 2, 3, 4)
  - [ ] T4.1 — Ajouter chargement des analyses via `SqliteAnalysisRepository.getForPatient()`
  - [ ] T4.2 — Integrer le composant `ProgressionChart` dans le screen
  - [ ] T4.3 — Rendre les items timeline navigables vers ResultsScreen
  - [ ] T4.4 — Gerer l'etat vide (0-1 analyses)

- [ ] Tache 5 — Ecrire les tests de suppression patient (AC: 5, 6, 7, 8)
  - [ ] T5.1 — Test `usePatientsStore.deletePatient()` → appel `IPatientRepository.delete(id)` + retrait de la liste
  - [ ] T5.2 — Test suppression cascade : analyses associees aussi supprimees (schema ON DELETE CASCADE)
  - [ ] T5.3 — Test confirmation requise avant suppression (Alert.alert mock)
  - [ ] T5.4 — Test navigation vers Patients apres suppression
  - [ ] T5.5 — Test erreur suppression → message d'erreur, patient intact

- [ ] Tache 6 — Verifier la suppression dans `PatientDetailScreen` (AC: 5, 6, 7, 8)
  - [ ] T6.1 — Verifier `handleDelete()` existant : confirmation + appel `deletePatient()` + navigation
  - [ ] T6.2 — Verifier que la suppression cascade fonctionne (test avec analyse liee)
  - [ ] T6.3 — Ajouter gestion d'erreur si manquante

- [ ] Tache 7 — Ecrire les tests d'integration du `PatientTimelineScreen` (AC: 1, 3, 4)
  - [ ] T7.1 — Test chargement analyses → graphe et items timeline rendus
  - [ ] T7.2 — Test tap sur item → navigation vers ResultsScreen
  - [ ] T7.3 — Test etat vide → message + bouton "Demarrer une analyse"

- [ ] Tache 8 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-8)
  - [ ] T8.1 — `npx jest --testPathPattern patients --verbose` → tous les tests passent
  - [ ] T8.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 9 — Mettre a jour sprint-status.yaml
  - [ ] T9.1 — `2-4-timeline-de-progression-clinique: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native

**Le `PatientTimelineScreen` et la suppression dans `PatientDetailScreen` existent mais sont partiellement implementes.**

**Fichiers existants :**

| Fichier | Statut | Notes |
| --- | --- | --- |
| `src/features/patients/screens/patient-timeline-screen.tsx` | Partiellement implemente | Structure timeline OK. Manque : chargement reel des analyses, graphe, navigation items |
| `src/features/patients/screens/patient-detail-screen.tsx` | Implemente | `handleDelete()` avec Alert.alert + `deletePatient()` + navigation. Bouton "Progression clinique" navigue vers Timeline |
| `src/features/patients/store/patients-store.ts` | Implemente | `deletePatient()` via `IPatientRepository.delete()` + retrait de la liste |
| `src/features/capture/data/analysis-repository.ts` | Implemente | `getForPatient(patientId)` |
| `src/core/database/schema.ts` | Implemente | `ON DELETE CASCADE` sur `analyses.patient_id` |
| `src/navigation/types.ts` | Implemente | Route `Timeline: { patientId }` |
| `src/shared/design-system/colors.ts` | Implemente | `chartKnee`, `chartHip`, `chartAnkle` definies |

### Ce qui doit etre construit/complete

1. **Chargement reel des analyses dans `PatientTimelineScreen`** — Actuellement `setIsLoading(false)` sans charger les analyses
2. **Composant graphe `ProgressionChart`** — Graphe temporel avec les 3 series d'angles
3. **Navigation items timeline** — Les items timeline existent mais la navigation vers ResultsScreen doit etre testee
4. **Tests de suppression cascade** — Verifier que ON DELETE CASCADE fonctionne

### Choix de la lib de graphe — Recommandation

Le codebase a deja `react-native-svg` installe (dans package.json). Options :
- **Custom SVG** : Utiliser `react-native-svg` directement pour un graphe simple (lignes + points). Recommande pour le MVP.
- **`victory-native`** : Lib de graphes complete mais lourde. A evaluer si le graphe custom est trop complexe.
- **Note** : Le graphe doit etre compatible web (`react-native-svg` l'est via `react-native-svg-web`).

### Stack technique React Native

- **State** : Zustand (immer middleware)
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `react-native-sqlite-storage` (natif), `ON DELETE CASCADE`
- **SVG** : `react-native-svg` (deja installe)
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
Colors.primary: '#4a90d9'       // Boutons
Colors.error: '#e74c3c'         // Bouton supprimer, texte danger
Colors.background: '#0f0f1a'    // Fond principal
Colors.backgroundCard: '#1a1a2e' // Cartes timeline
Colors.chartKnee: '#4a90d9'    // Ligne genou (graphe)
Colors.chartHip: '#e74c3c'     // Ligne hanche (graphe)
Colors.chartAnkle: '#27ae60'   // Ligne cheville (graphe)
Colors.chartReference: 'rgba(255,255,255,0.3)' // Lignes de reference
Colors.border: '#333355'        // Timeline line
```

### Anti-patterns a eviter

- **NE PAS** implementer la suppression sans confirmation — toujours Alert.alert avec option "Annuler"
- **NE PAS** supprimer le patient puis les analyses separement — la cascade SQL gere ca
- **NE PAS** acceder a SQLite directement depuis le screen pour les analyses — utiliser le Repository
- **NE PAS** utiliser une lib de graphe trop lourde pour le MVP — un graphe SVG custom suffit
- **NE PAS** utiliser MobX — le codebase RN utilise Zustand
- **NE PAS** oublier de retirer le patient du Zustand store apres suppression

### Project Structure Notes

```
bodyorthox-rn/src/features/patients/
  components/
    patient-list-tile.tsx              <- EXISTANT
    patient-history-tile.tsx           <- EXISTANT
    progression-chart.tsx              <- A CREER (graphe timeline AC2)
    __tests__/
      progression-chart.test.tsx       <- A CREER
  screens/
    patient-timeline-screen.tsx        <- EXISTANT — a completer (chargement, graphe)
    patient-detail-screen.tsx          <- EXISTANT (suppression OK)
  store/
    patients-store.ts                  <- EXISTANT (deletePatient OK)
```

### Schema SQL — Suppression cascade

```sql
-- core/database/schema.ts
CREATE TABLE analyses (
  ...
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  ...
);

-- Quand on DELETE FROM patients WHERE id = ?, toutes les analyses liees
-- sont automatiquement supprimees par la base de donnees.
```

### Pattern de test React Native

```typescript
// Mock Alert pour tester la confirmation de suppression
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simuler le tap sur "Supprimer"
  const destructiveButton = buttons?.find(b => b.style === 'destructive');
  destructiveButton?.onPress?.();
});

// Mock des analyses pour la timeline
const mockAnalyses: Analysis[] = [
  { id: 'a1', patientId: 'p1', createdAt: '2026-01-15T10:00:00Z',
    angles: { kneeAngle: 8.2, hipAngle: 172.1, ankleAngle: 91.5 },
    confidenceScore: 0.92, manualCorrectionApplied: false, manualCorrectionJoint: null },
  { id: 'a2', patientId: 'p1', createdAt: '2026-02-15T10:00:00Z',
    angles: { kneeAngle: 5.1, hipAngle: 170.3, ankleAngle: 90.2 },
    confidenceScore: 0.88, manualCorrectionApplied: false, manualCorrectionJoint: null },
  { id: 'a3', patientId: 'p1', createdAt: '2026-03-15T10:00:00Z',
    angles: { kneeAngle: 3.5, hipAngle: 175.0, ankleAngle: 89.8 },
    confidenceScore: 0.95, manualCorrectionApplied: false, manualCorrectionJoint: null },
];
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

- [Source: docs/planning-artifacts/epics.md#Story-2.4] — "Timeline de Progression Clinique et Suppression Patient"
- [Source: docs/planning-artifacts/architecture.md] — Transactions SQL atomiques, NFR-R2
- [Source: bodyorthox-rn/src/features/patients/screens/patient-timeline-screen.tsx] — Screen existant
- [Source: bodyorthox-rn/src/features/patients/screens/patient-detail-screen.tsx] — Suppression existante
- [Source: bodyorthox-rn/src/core/database/schema.ts] — ON DELETE CASCADE
- [Source: bodyorthox-rn/src/shared/design-system/colors.ts] — Chart colors

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
