# Story 4.2: Export du Rapport via Share Sheet Natif

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want to export the PDF report in one tap to any app on my iPhone,
so that I can send it to my secretary via AirDrop, email it to the patient, or save it anywhere.

## Acceptance Criteria

**AC1 — Bouton d'export visible apres generation du rapport**
**Given** le rapport PDF est genere avec succes (Story 4.1)
**When** l'ecran de rapport s'affiche avec le PDF pret
**Then** un bouton "Exporter" est visible et accessible (touch target >= 44x44pt)

**AC2 — Ouverture du share sheet natif**
**Given** le PDF est pret dans le filesystem local
**When** j'appuie sur le bouton "Exporter"
**Then** le share sheet natif s'ouvre (iOS : `UIActivityViewController`, Android : `Intent.ACTION_SEND`) via `Share.share()` de React Native ou `react-native-share` (FR24)
**And** le PDF est passe comme fichier a partager

**AC3 — Applications disponibles dans le share sheet**
**Given** le share sheet est ouvert avec le PDF
**When** je regarde les options de partage
**Then** AirDrop, Mail, Messages et toutes apps iOS/Android compatibles sont disponibles
**And** le nom de fichier `NomPatient_AnalyseMarche_DATE.pdf` est pre-rempli (FR21)

**AC4 — Export sans connexion reseau**
**Given** l'appareil est en mode avion
**When** j'appuie sur "Exporter"
**Then** le share sheet s'ouvre quand meme (les options offline comme AirDrop, Fichiers, Copier sont disponibles)
**And** l'export fonctionne sans erreur pour les destinations locales

**AC5 — Gestion des erreurs d'export**
**Given** le share sheet est ouvert
**When** l'utilisateur annule le partage ou une erreur survient
**Then** l'app retourne a l'ecran de rapport sans crash
**And** un message d'erreur informatif est affiche si l'export echoue

**AC6 — Export sur le web (react-native-web)**
**Given** l'app est utilisee dans un navigateur via react-native-web
**When** j'appuie sur "Exporter"
**Then** le PDF est telecharge directement via le navigateur (blob download)
**And** le nom de fichier respecte la convention FR21

## Tasks / Subtasks

- [ ] Tache 1 — Ecrire les tests unitaires du composant `ExportButton` (AC: 1, 2, 5)
  - [ ] T1.1 — Test rendu du bouton "Exporter" avec accessibilityLabel
  - [ ] T1.2 — Test appui sur le bouton → appel de la fonction de share avec le bon path PDF
  - [ ] T1.3 — Test gestion annulation share → pas d'erreur
  - [ ] T1.4 — Test gestion erreur share → message d'erreur affiche

- [ ] Tache 2 — Ecrire les tests unitaires du service de share (AC: 2, 3, 6)
  - [ ] T2.1 — Test `shareReport(filePath, fileName)` → appelle `Share.share()` avec les bons parametres (natif)
  - [ ] T2.2 — Test `shareReport(filePath, fileName)` → declenche un telechargement blob (web)
  - [ ] T2.3 — Test nom de fichier respecte la convention `NomPatient_AnalyseMarche_DATE.pdf`

- [ ] Tache 3 — Implementer le service de share platform-specific (AC: 2, 3, 6)
  - [ ] T3.1 — Creer `src/features/report/data/share-service.ts` (interface)
  - [ ] T3.2 — Creer `src/features/report/data/share-service.native.ts` (utilise `Share` de React Native ou `react-native-share`)
  - [ ] T3.3 — Creer `src/features/report/data/share-service.web.ts` (blob download)

- [ ] Tache 4 — Implementer le composant `ExportButton` (AC: 1, 5)
  - [ ] T4.1 — Creer `src/features/report/components/export-button.tsx`
  - [ ] T4.2 — Props : `filePath`, `fileName`, `disabled`
  - [ ] T4.3 — Gestion etats : idle, sharing, error
  - [ ] T4.4 — Integrer dans `ReportScreen` (apres generation PDF)

- [ ] Tache 5 — Tests d'integration (AC: 1, 2, 4)
  - [ ] T5.1 — Test flow complet : ReportScreen → PDF genere → bouton Exporter → share appele
  - [ ] T5.2 — Test bouton desactive pendant la generation du PDF

- [ ] Tache 6 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-6)
  - [ ] T6.1 — `npx jest --testPathPattern report --verbose` → tous les tests passent
  - [ ] T6.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 7 — Mettre a jour sprint-status.yaml
  - [ ] T7.1 — `4-2-export-du-rapport-via-share-sheet: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native

**Le composant `ExportButton` et le service de share n'existent pas encore.** Cette story depend de la Story 4.1 (generation PDF).

**Fichiers existants (dependances) :**

| Fichier                                         | Statut              | Notes                                              |
| ----------------------------------------------- | ------------------- | -------------------------------------------------- |
| `src/features/report/data/pdf-generator.ts`     | A creer (Story 4.1) | Prerequis : doit etre implemente avant cette story |
| `src/features/report/screens/report-screen.tsx` | A creer (Story 4.1) | Le bouton export sera ajoute ici                   |
| `src/features/report/store/report-store.ts`     | A creer (Story 4.1) | Fournit le path du PDF genere                      |

### Ce qui doit etre construit

1. **`share-service.ts`** — Interface du service de partage
2. **`share-service.native.ts`** — Implementation native via `Share.share()` de React Native
3. **`share-service.web.ts`** — Implementation web via blob download
4. **`export-button.tsx`** — Composant UI avec gestion d'etats
5. **Integration dans `ReportScreen`**

### Share natif React Native

```typescript
// React Native fournit Share.share() nativement
import { Share, Platform } from "react-native";

// iOS : utilise UIActivityViewController
// Android : utilise Intent.ACTION_SEND
// Pour partager un fichier PDF, react-native-share est preferable
// car Share.share() de RN ne supporte que le texte/URL sur certaines versions
```

**Recommandation :** Utiliser `react-native-share` (plus complet pour les fichiers) ou `Share` de React Native si suffisant.

### Stack technique React Native

- **State** : Zustand (immer middleware)
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **Share natif** : `Share` de React Native ou `react-native-share`
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
Colors.primary: '#4a90d9'       // Bouton export
Colors.success: '#27ae60'       // Export reussi
Colors.error: '#e74c3c'         // Erreur export
Colors.background: '#0f0f1a'
Colors.textOnPrimary: '#ffffff'
```

### Anti-patterns a eviter

- **NE PAS** utiliser `Linking.openURL()` pour l'export PDF — utiliser le share sheet natif
- **NE PAS** faire de requetes reseau pour l'export — tout est local
- **NE PAS** stocker le PDF en base SQLite — le passer directement au share sheet depuis le filesystem
- **NE PAS** hardcoder le nom de fichier — utiliser la fonction `generateReportFileName()` de Story 4.1
- **NE PAS** oublier le fallback web — implementer le blob download pour react-native-web

### Project Structure Notes

```
bodyorthox-rn/src/features/report/
  data/
    pdf-generator.ts                   <- Story 4.1
    share-service.ts                   <- A CREER (interface)
    share-service.native.ts            <- A CREER (natif)
    share-service.web.ts               <- A CREER (web)
    __tests__/
      share-service.test.ts            <- A CREER
  components/
    export-button.tsx                  <- A CREER
    __tests__/
      export-button.test.tsx           <- A CREER
  screens/
    report-screen.tsx                  <- Story 4.1 — integrer ExportButton
  store/
    report-store.ts                    <- Story 4.1
```

### Pattern platform-specific React Native

```typescript
// share-service.ts (interface)
export interface IShareService {
  shareFile(filePath: string, fileName: string): Promise<ShareResult>;
}

export type ShareResult =
  | { readonly kind: "shared" }
  | { readonly kind: "cancelled" }
  | { readonly kind: "error"; readonly message: string };

// React Native resout automatiquement .native.ts vs .web.ts
// Donc import { ShareService } from './share-service' fonctionne
```

### Commandes de verification

```bash
cd bodyorthox-rn

# TypeScript check
npx tsc --noEmit

# Tests report
npx jest --testPathPattern report --verbose

# Tous les tests
npx jest --verbose
```

### References

- [Source: docs/planning-artifacts/epics.md#Story-4.2] — "Export du Rapport via Share Sheet iOS"
- [Source: docs/planning-artifacts/architecture.md#Points-integration] — `report/components/export-button.tsx`, Share natif
- [Source: bodyorthox-rn/package.json] — Dependances actuelles (pas de react-native-share installe)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
