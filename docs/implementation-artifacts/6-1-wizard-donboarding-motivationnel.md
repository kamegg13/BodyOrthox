# Story 6.1: Wizard d'Onboarding Motivationnel

Status: in-progress

## Story

As a practitioner opening BodyOrthox for the first time,
I want to see the final result before any instructions, and grant permissions at the right moment,
so that I understand the value immediately and feel confident launching my first analysis.

## Acceptance Criteria

**AC1 — 3 ecrans dans l'ordre : resultat -> flux capture -> confidentialite RGPD**
**Given** c'est le premier lancement de l'app
**When** l'onboarding s'affiche
**Then** 3 ecrans sont presentes dans l'ordre : resultat -> flux capture -> confidentialite RGPD (FR36)

**AC2 — Ecran resultat montre un exemple d'analyse reelle**
**Given** l'onboarding est affiche
**When** l'ecran "Resultat" (page 1) est visible
**Then** un exemple d'analyse reelle est montre (le "wow moment") — pas une liste de fonctionnalites

**AC3 — Permission camera demandee au moment contextuel**
**Given** l'onboarding est affiche
**When** l'ecran "Capture" (page 2) est visible
**Then** la permission camera est demandee avec explication contextuelle (FR37)

**AC4 — Ecran confidentialite RGPD**
**Given** l'onboarding est affiche
**When** l'ecran "Confidentialite" (page 3) est visible
**Then** le praticien est rassure que les donnees restent sur l'appareil

**AC5 — Onboarding affiche une seule fois**
**Given** l'onboarding a ete complete
**When** l'app est relancee
**Then** l'onboarding n'est plus affiche — navigation directe vers Patients

**AC6 — Navigation et controles**
**Given** l'onboarding est affiche
**Then** un bouton "Suivant" est visible sur les pages 1-2
**And** un bouton "Commencer" est visible sur la page 3
**And** un lien "Passer" est visible sur toutes les pages
**And** des indicateurs de page (dots) montrent la page courante

## Tasks / Subtasks

- [x] Tache 1 — Creer le store Zustand `onboarding-store.ts` (AC: 5)
  - [x] T1.1 — `isCompleted` state + `isLoading` state
  - [x] T1.2 — `checkOnboarding()` — lit depuis localStorage/AsyncStorage
  - [x] T1.3 — `completeOnboarding()` — ecrit dans storage + met a jour state

- [x] Tache 2 — Creer le composant `onboarding-page.tsx` (AC: 2, 3, 4)
  - [x] T2.1 — Composant reutilisable avec icon, titre, description
  - [x] T2.2 — Dark theme (Colors.background)

- [x] Tache 3 — Creer l'ecran `onboarding-screen.tsx` (AC: 1, 2, 3, 4, 6)
  - [x] T3.1 — Wizard 3 pages avec ScrollView pagingEnabled
  - [x] T3.2 — Dot indicators
  - [x] T3.3 — Boutons Suivant/Commencer/Passer
  - [x] T3.4 — Demande permission camera sur page 2
  - [x] T3.5 — Completion via store + navigation vers Patients

- [x] Tache 4 — Modifier `app-navigator.tsx` (AC: 5)
  - [x] T4.1 — Route Onboarding conditionnelle
  - [x] T4.2 — Types de navigation mis a jour

- [x] Tache 5 — Ecrire les tests (AC: 1-6)
  - [x] T5.1 — Tests du store onboarding
  - [x] T5.2 — Tests du screen onboarding

- [ ] Tache 6 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-6)

## Dev Notes

### Stack technique React Native

- **State** : Zustand (immer middleware) — voir `capture-store.ts`
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **Storage** : localStorage (web) / Platform-aware wrapper
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette (dark theme)

```typescript
Colors.primary: '#4a90d9'       // Boutons, liens
Colors.background: '#0f0f1a'    // Fond principal (dark mode)
Colors.backgroundCard: '#1a1a2e' // Cartes
Colors.textPrimary: '#ffffff'   // Texte principal
Colors.textSecondary: '#b0b0c8' // Texte secondaire
```

### Contraintes

- Pas de nouveaux packages — utiliser localStorage (web) / AsyncStorage pattern
- Onboarding montre une seule fois (premier lancement)
- 3 ecrans maximum (FR36)
- Resultat montre EN PREMIER — pattern "wow moment"
- Touch targets >= 44pt
- Permission camera demandee contextuellement sur ecran 2

### Structure projet

```
bodyorthox-rn/src/features/onboarding/
  screens/
    onboarding-screen.tsx
    __tests__/
      onboarding-screen.test.tsx
  components/
    onboarding-page.tsx
  store/
    onboarding-store.ts
    __tests__/
      onboarding-store.test.ts
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-6.1] — "Wizard d'Onboarding Motivationnel"
- [Source: docs/planning-artifacts/epics.md#FR36] — 3 ecrans max, resultat d'abord
- [Source: docs/planning-artifacts/epics.md#FR37] — Permissions contextuelles

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List

- `src/features/onboarding/store/onboarding-store.ts`
- `src/features/onboarding/store/__tests__/onboarding-store.test.ts`
- `src/features/onboarding/components/onboarding-page.tsx`
- `src/features/onboarding/screens/onboarding-screen.tsx`
- `src/features/onboarding/screens/__tests__/onboarding-screen.test.tsx`
- `src/navigation/app-navigator.tsx` (modified)
- `src/navigation/types.ts` (modified)
