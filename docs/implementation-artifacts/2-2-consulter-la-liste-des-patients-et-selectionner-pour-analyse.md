# Story 2.2: Consulter la Liste des Patients et Selectionner pour Analyse

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to browse my patient list and select a patient to start a new analysis,
so that I can quickly find the right patient during a consultation.

## Acceptance Criteria

**AC1 — Affichage de la liste des patients**
**Given** au moins un patient existe en base SQLite
**When** j'ouvre l'ecran `PatientsScreen`
**Then** la liste des patients est chargee via `usePatientsStore.loadPatients()` → `IPatientRepository.getAll()`
**And** chaque patient est affiche dans un `PatientListTile` avec nom et informations de base
**And** la liste utilise un `FlatList` pour une performance optimale avec de grands datasets

**AC2 — Performance de chargement < 1 seconde pour 500+ patients**
**Given** 500+ patients existent en base
**When** l'ecran patients se charge
**Then** la liste s'affiche en < 1 seconde (NFR-P6)
**And** l'index SQL `idx_patients_name` est utilise pour le tri alphabetique
**And** le chargement affiche un `LoadingSpinner` pendant la requete

**AC3 — Recherche/filtre par nom en temps reel**
**Given** la liste des patients est affichee
**When** je saisis du texte dans le champ de recherche (testID: `search-input`)
**Then** la liste est filtree en temps reel par nom (SQL `LIKE %query%`)
**And** le filtre est applique avec un debounce de 200ms pour eviter les requetes excessives
**And** si aucun patient ne correspond, un message "Aucun patient ne correspond a votre recherche." est affiche

**AC4 — Selection d'un patient pour navigation**
**Given** un patient est affiche dans la liste
**When** j'appuie sur le `PatientListTile` du patient
**Then** je suis navigue vers `PatientDetail` avec `patientId` du patient selectionne (FR3)
**And** la fiche patient est prete pour lancer une nouvelle analyse

**AC5 — Etat vide (aucun patient)**
**Given** aucun patient n'existe en base
**When** j'ouvre l'ecran patients
**Then** un etat vide est affiche avec une icone, un titre "Aucun patient" et un message d'invitation
**And** le bouton "+" reste accessible pour creer un premier patient

**AC6 — Gestion des erreurs de chargement**
**Given** une erreur survient lors du chargement des patients (SQLite)
**When** l'erreur est capturee
**Then** un `ErrorWidget` est affiche avec le message d'erreur
**And** un bouton "Reessayer" permet de relancer le chargement

## Tasks / Subtasks

- [ ] Tache 1 — Verifier et completer les tests unitaires du `PatientListTile` (AC: 1, 4)
  - [ ] T1.1 — Verifier `patient-list-tile.test.tsx` : rendu correct avec nom, date, avatar initiales
  - [ ] T1.2 — Verifier `patient-list-tile.test.tsx` : appui → callback `onPress(patient)` appele
  - [ ] T1.3 — Ajouter tests manquants si gaps identifies

- [ ] Tache 2 — Verifier et completer les tests du `SqlitePatientRepository.getAll()` (AC: 2, 3)
  - [ ] T2.1 — Verifier `sqlite-patient-repository.test.ts` : `getAll()` retourne tous les patients tries par nom
  - [ ] T2.2 — Verifier `sqlite-patient-repository.test.ts` : `getAll(nameFilter)` filtre par LIKE
  - [ ] T2.3 — Ajouter tests manquants si gaps identifies

- [ ] Tache 3 — Verifier et completer les tests du `usePatientsStore` (AC: 1, 3, 6)
  - [ ] T3.1 — Verifier `patients-store.test.ts` : `loadPatients()` met a jour `patients` et `isLoading`
  - [ ] T3.2 — Verifier `patients-store.test.ts` : `setSearchQuery()` declenche `loadPatients()` avec filtre
  - [ ] T3.3 — Verifier `patients-store.test.ts` : gestion d'erreur dans `loadPatients()` → `error` set
  - [ ] T3.4 — Ajouter tests manquants si gaps identifies

- [ ] Tache 4 — Ecrire les tests d'integration du `PatientsScreen` (AC: 1, 3, 4, 5, 6)
  - [ ] T4.1 — Test chargement reussi → FlatList avec PatientListTile rendus
  - [ ] T4.2 — Test recherche → debounce 200ms → filtre applique
  - [ ] T4.3 — Test selection patient → navigation vers PatientDetail avec patientId
  - [ ] T4.4 — Test etat vide → message "Aucun patient" affiche
  - [ ] T4.5 — Test erreur chargement → ErrorWidget affiche avec bouton Reessayer
  - [ ] T4.6 — Test etat loading → LoadingSpinner affiche

- [ ] Tache 5 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-6)
  - [ ] T5.1 — `npx jest --testPathPattern patients --verbose` → tous les tests passent
  - [ ] T5.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 6 — Mettre a jour sprint-status.yaml
  - [ ] T6.1 — `2-2-consulter-la-liste-des-patients: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native (DEJA IMPLEMENTE)

**IMPORTANT : Cette story est deja largement implementee dans `bodyorthox-rn/`.** Le travail restant est principalement de la validation et des tests d'integration.

**Fichiers existants :**

| Fichier | Statut | Notes |
| --- | --- | --- |
| `src/features/patients/screens/patients-screen.tsx` | Implemente | FlatList, recherche debounce 200ms, etat vide, ErrorWidget, bouton "+" |
| `src/features/patients/components/patient-list-tile.tsx` | Implemente | Affiche nom, onPress callback |
| `src/features/patients/components/__tests__/patient-list-tile.test.tsx` | Implemente | Tests existants — verifier couverture |
| `src/features/patients/store/patients-store.ts` | Implemente | `loadPatients()`, `setSearchQuery()`, `clearError()` |
| `src/features/patients/store/__tests__/patients-store.test.ts` | Implemente | Tests existants — verifier couverture |
| `src/features/patients/data/sqlite-patient-repository.ts` | Implemente | `getAll(nameFilter?)` avec LIKE, tri par nom ASC |
| `src/features/patients/data/__tests__/sqlite-patient-repository.test.ts` | Implemente | Tests existants — verifier couverture |
| `src/navigation/types.ts` | Implemente | Route `Patients: undefined`, `PatientDetail: { patientId: string }` |

### Ce qui manque potentiellement

1. **Tests d'integration du `PatientsScreen`** — Le screen est implemente mais les tests d'integration du screen lui-meme sont probablement absents
2. **Test de performance 500+ patients** — Verifier que l'index SQL est bien utilise

### Stack technique React Native

- **State** : Zustand (immer middleware) — `usePatientsStore`
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `react-native-sqlite-storage` (natif), index `idx_patients_name`
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
Colors.primary: '#4a90d9'       // Bouton "+"
Colors.background: '#0f0f1a'    // Fond principal
Colors.backgroundCard: '#1a1a2e' // Champ de recherche
Colors.textPrimary: '#ffffff'   // Titre, noms patients
Colors.textSecondary: '#b0b0c8' // Meta informations
Colors.textDisabled: '#606080'  // Placeholder recherche
Colors.border: '#333355'        // Bordure champ recherche
```

### Anti-patterns a eviter

- **NE PAS** utiliser un ScrollView pour la liste — toujours FlatList pour la performance
- **NE PAS** charger tous les patients en memoire d'un coup sans pagination si > 5000
- **NE PAS** acceder a SQLite directement depuis le screen — toujours via Store → Repository
- **NE PAS** oublier le debounce sur la recherche — eviter les requetes SQL par keystroke
- **NE PAS** utiliser MobX — le codebase RN utilise Zustand

### Project Structure Notes

```
bodyorthox-rn/src/features/patients/
  components/
    patient-list-tile.tsx              <- EXISTANT
    __tests__/
      patient-list-tile.test.tsx       <- EXISTANT — verifier couverture
  data/
    patient-repository.ts              <- EXISTANT (interface)
    sqlite-patient-repository.ts       <- EXISTANT (getAll avec LIKE)
    __tests__/
      sqlite-patient-repository.test.ts <- EXISTANT — verifier couverture
  screens/
    patients-screen.tsx                <- EXISTANT (FlatList, recherche, etat vide)
  store/
    patients-store.ts                  <- EXISTANT (loadPatients, setSearchQuery)
    __tests__/
      patients-store.test.ts           <- EXISTANT — verifier couverture
```

### Pattern de test React Native

```typescript
// Mock du store pour les tests du PatientsScreen
const mockPatients = [
  { id: '1', name: 'Dupont Jean', dateOfBirth: '1990-01-15', morphologicalProfile: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Martin Sophie', dateOfBirth: '1985-06-20', morphologicalProfile: null, createdAt: '2026-01-02T00:00:00Z' },
];

jest.mock('../store/patients-store', () => ({
  usePatientsStore: () => ({
    patients: mockPatients,
    isLoading: false,
    error: null,
    searchQuery: '',
    loadPatients: jest.fn(),
    setSearchQuery: jest.fn(),
    clearError: jest.fn(),
  }),
}));

const mockNavigation = { navigate: jest.fn() };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
}));
```

### Travail reel de cette story

Puisque le code est deja implemente, cette story se concentre sur :

1. **Validation** : verifier que l'implementation existante satisfait tous les ACs
2. **Tests manquants** : ecrire les tests d'integration du `PatientsScreen` si absents
3. **Corrections** : fixer tout ecart entre l'implementation et les ACs
4. **Proof** : executer `npx jest` et documenter les resultats

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

- [Source: docs/planning-artifacts/epics.md#Story-2.2] — "Consulter la Liste des Patients et Selectionner pour Analyse"
- [Source: docs/planning-artifacts/architecture.md] — FlatList, index SQL, NFR-P6
- [Source: bodyorthox-rn/src/features/patients/screens/patients-screen.tsx] — Implementation existante
- [Source: bodyorthox-rn/src/features/patients/store/patients-store.ts] — Zustand store
- [Source: bodyorthox-rn/src/core/database/schema.ts] — Index `idx_patients_name`

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
