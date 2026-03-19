# Story 2.1: Creer un Profil Patient

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to create a patient profile with their name, date of birth, and morphological profile,
so that I can associate analyses to a named patient and provide age-appropriate reference norms.

## Acceptance Criteria

**AC1 — Ecran de creation patient accessible**
**Given** je suis sur l'ecran de la liste patients (`PatientsScreen`)
**When** j'appuie sur le bouton "+" (testID: `add-patient-button`)
**Then** je suis navigue vers `CreatePatientScreen`

**AC2 — Formulaire de creation avec champs requis et optionnels**
**Given** je suis sur `CreatePatientScreen`
**When** l'ecran s'affiche
**Then** les champs suivants sont visibles :
- Nom complet (obligatoire)
- Date de naissance (obligatoire, format YYYY-MM-DD)
- Taille en cm (optionnel, profil morphologique)
- Poids en kg (optionnel, profil morphologique)
- Notes (optionnel)

**AC3 — Validation des champs obligatoires**
**Given** je suis sur `CreatePatientScreen`
**When** je tente de soumettre le formulaire sans nom
**Then** un message d'erreur "Le nom est obligatoire." est affiche
**And** la soumission est bloquee
**When** je tente de soumettre sans date de naissance
**Then** un message d'erreur "La date de naissance est obligatoire." est affiche
**When** la date de naissance est dans le futur
**Then** un message d'erreur "Ne peut pas etre dans le futur." est affiche

**AC4 — Validation des champs optionnels**
**Given** je saisis une taille hors plage (<50 ou >250 cm)
**When** je tente de soumettre
**Then** un message d'erreur "Taille invalide (50-250 cm)." est affiche
**Given** je saisis un poids hors plage (<10 ou >300 kg)
**When** je tente de soumettre
**Then** un message d'erreur "Poids invalide (10-300 kg)." est affiche

**AC5 — Persistance du patient**
**Given** tous les champs sont valides
**When** je soumets le formulaire
**Then** le patient est cree via `usePatientsStore.createPatient()` → `IPatientRepository.create()`
**And** le patient est persiste en SQLite chiffre avec UUID v4 et `created_at` ISO 8601
**And** les donnees respectent l'interface TypeScript `Patient` avec factory function `createPatient()` (immutabilite garantie)

**AC6 — Apparition immediate dans la liste**
**Given** le patient vient d'etre cree avec succes
**When** la navigation retourne a `PatientsScreen`
**Then** le nouveau patient apparait immediatement dans la liste (optimistic update via Zustand store)

**AC7 — Gestion des erreurs de creation**
**Given** une erreur survient lors de la persistance (SQLite)
**When** l'erreur est capturee
**Then** une alerte est affichee avec le message d'erreur
**And** le formulaire reste rempli avec les donnees saisies (pas de perte de saisie)

## Tasks / Subtasks

- [ ] Tache 1 — Verifier et completer les tests unitaires du domaine `Patient` (AC: 3, 4, 5)
  - [ ] T1.1 — Verifier `patient.test.ts` : couvre `createPatient()` avec nom vide, date invalide, date future
  - [ ] T1.2 — Verifier `patient.test.ts` : couvre `patientAge()` pour differentes dates
  - [ ] T1.3 — Ajouter tests manquants si gaps identifies

- [ ] Tache 2 — Verifier et completer les tests du `SqlitePatientRepository` (AC: 5)
  - [ ] T2.1 — Verifier `sqlite-patient-repository.test.ts` : couvre `create()` avec insertion correcte
  - [ ] T2.2 — Verifier que la factory function `createPatient()` est utilisee dans le repository
  - [ ] T2.3 — Ajouter tests manquants si gaps identifies

- [ ] Tache 3 — Verifier et completer les tests du `usePatientsStore` (AC: 5, 6)
  - [ ] T3.1 — Verifier `patients-store.test.ts` : couvre `createPatient()` → patient ajoute a la liste
  - [ ] T3.2 — Verifier `patients-store.test.ts` : couvre gestion d'erreur dans `createPatient()`
  - [ ] T3.3 — Ajouter tests manquants si gaps identifies

- [ ] Tache 4 — Ecrire les tests d'integration du `CreatePatientScreen` (AC: 1, 2, 3, 4, 6, 7)
  - [ ] T4.1 — Test rendu du formulaire avec tous les champs
  - [ ] T4.2 — Test validation nom vide → message d'erreur affiche
  - [ ] T4.3 — Test validation date invalide → message d'erreur affiche
  - [ ] T4.4 — Test validation taille/poids hors plage → messages d'erreur
  - [ ] T4.5 — Test soumission valide → appel `createPatient()` + navigation back
  - [ ] T4.6 — Test erreur de creation → alerte affichee, formulaire intact

- [ ] Tache 5 — Verifier l'integration end-to-end (AC: 1, 6)
  - [ ] T5.1 — Verifier que le bouton "+" sur `PatientsScreen` navigue vers `CreatePatientScreen`
  - [ ] T5.2 — Verifier que `navigation.goBack()` apres creation retourne a la liste

- [ ] Tache 6 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-7)
  - [ ] T6.1 — `npx jest --testPathPattern patients --verbose` → tous les tests passent
  - [ ] T6.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 7 — Mettre a jour sprint-status.yaml
  - [ ] T7.1 — `2-1-creer-un-profil-patient: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native (DEJA IMPLEMENTE)

**IMPORTANT : Cette story est deja largement implementee dans `bodyorthox-rn/`.** Le travail restant est principalement de la validation et des tests d'integration du screen.

**Fichiers existants :**

| Fichier | Statut | Notes |
| --- | --- | --- |
| `src/features/patients/domain/patient.ts` | Implemente | Interface `Patient`, `CreatePatientInput`, factory `createPatient()`, `patientAge()` |
| `src/features/patients/domain/__tests__/patient.test.ts` | Implemente | Tests existants — verifier couverture |
| `src/features/patients/data/patient-repository.ts` | Implemente | Interface `IPatientRepository` avec `create()` |
| `src/features/patients/data/sqlite-patient-repository.ts` | Implemente | `SqlitePatientRepository.create()` utilise `createPatient()` factory |
| `src/features/patients/data/__tests__/sqlite-patient-repository.test.ts` | Implemente | Tests existants — verifier couverture |
| `src/features/patients/store/patients-store.ts` | Implemente | `usePatientsStore.createPatient()` avec optimistic update |
| `src/features/patients/store/__tests__/patients-store.test.ts` | Implemente | Tests existants — verifier couverture |
| `src/features/patients/screens/create-patient-screen.tsx` | Implemente | Formulaire complet avec validation, soumission, gestion erreurs |
| `src/features/patients/screens/patients-screen.tsx` | Implemente | Bouton "+" navigue vers `CreatePatient` |
| `src/navigation/types.ts` | Implemente | Route `CreatePatient: undefined` |

### Ce qui manque potentiellement

1. **Tests d'integration du `CreatePatientScreen`** — Le screen est implemente mais les tests d'integration ne sont probablement pas complets
2. **Validation de couverture** — Verifier que les tests existants couvrent tous les edge cases

### Stack technique React Native

- **State** : Zustand (immer middleware) — `usePatientsStore`
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `react-native-sqlite-storage` (natif)
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
Colors.primary: '#4a90d9'       // Bouton submit
Colors.error: '#e74c3c'         // Messages d'erreur, bordure input invalide
Colors.background: '#0f0f1a'    // Fond principal
Colors.backgroundCard: '#1a1a2e' // Champs input
Colors.textPrimary: '#ffffff'
Colors.textSecondary: '#b0b0c8' // Labels
Colors.textDisabled: '#606080'  // Placeholders
Colors.border: '#333355'        // Bordures input
```

### Anti-patterns a eviter

- **NE PAS** acceder a SQLite directement depuis le screen — utiliser `usePatientsStore.createPatient()`
- **NE PAS** muter l'objet Patient — la factory `createPatient()` garantit l'immutabilite
- **NE PAS** utiliser MobX ou useState pour l'etat patient — Zustand est le state manager
- **NE PAS** modifier le design system (palette, spacing) sauf si un AC le demande
- **NE PAS** implementer de date picker natif dans le MVP — le champ texte YYYY-MM-DD est suffisant

### Project Structure Notes

```
bodyorthox-rn/src/features/patients/
  domain/
    patient.ts                         <- EXISTANT (interface + factory)
    __tests__/
      patient.test.ts                  <- EXISTANT — verifier couverture
  data/
    patient-repository.ts              <- EXISTANT (interface)
    sqlite-patient-repository.ts       <- EXISTANT (implementation)
    __tests__/
      sqlite-patient-repository.test.ts <- EXISTANT — verifier couverture
  screens/
    create-patient-screen.tsx          <- EXISTANT (formulaire complet)
    patients-screen.tsx                <- EXISTANT (bouton "+")
  store/
    patients-store.ts                  <- EXISTANT
    __tests__/
      patients-store.test.ts           <- EXISTANT — verifier couverture
```

### Pattern de test React Native

```typescript
// Mock du store pour les tests du CreatePatientScreen
const mockCreatePatient = jest.fn().mockResolvedValue({ id: 'uuid', name: 'Test' });
jest.mock('../store/patients-store', () => ({
  usePatientsStore: () => ({
    createPatient: mockCreatePatient,
  }),
}));

// Mock de la navigation
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
}));

// Test de soumission
fireEvent.changeText(getByTestId('name-input'), 'Jean Dupont');
fireEvent.changeText(getByTestId('dob-input'), '1990-01-15');
fireEvent.press(getByTestId('submit-button'));
await waitFor(() => {
  expect(mockCreatePatient).toHaveBeenCalledWith({
    name: 'Jean Dupont',
    dateOfBirth: '1990-01-15',
    morphologicalProfile: {},
  });
});
```

### Travail reel de cette story

Puisque le code est deja implemente, cette story se concentre sur :

1. **Validation** : verifier que l'implementation existante satisfait tous les ACs
2. **Tests manquants** : ecrire les tests d'integration du `CreatePatientScreen` si absents
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

- [Source: docs/planning-artifacts/epics.md#Story-2.1] — "Creer un Profil Patient"
- [Source: docs/planning-artifacts/architecture.md] — Structure Feature-First, factory functions, immutabilite
- [Source: bodyorthox-rn/src/features/patients/domain/patient.ts] — Interface Patient + factory
- [Source: bodyorthox-rn/src/features/patients/screens/create-patient-screen.tsx] — Implementation existante
- [Source: bodyorthox-rn/src/features/patients/store/patients-store.ts] — Zustand store

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
