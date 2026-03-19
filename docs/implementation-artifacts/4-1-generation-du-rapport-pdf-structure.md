# Story 4.1: Generation du Rapport PDF Structure

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want a structured PDF report generated automatically from analysis results,
so that I have a professional, legally compliant document ready to share without any manual formatting.

## Acceptance Criteria

**AC1 — Declenchement de la generation du rapport**
**Given** une analyse est validee (avec ou sans correction manuelle)
**When** j'appuie sur le bouton "Generer le rapport" depuis `ResultsScreen` ou `ReplayScreen`
**Then** la generation du PDF demarre localement (aucune requete reseau)
**And** un indicateur de progression est affiche pendant la generation

**AC2 — Performance de generation < 5 secondes**
**Given** la generation du PDF est en cours
**When** le PDF est assemble a partir des donnees d'analyse
**Then** le PDF est pret en < 5 secondes (NFR-P4)
**And** l'utilisateur est notifie que le rapport est pret

**AC3 — Nommage automatique du fichier PDF**
**Given** le PDF est genere pour un patient nomme "Jean Dupont" le 2026-03-19
**When** le fichier PDF est cree
**Then** le nom du fichier est `JeanDupont_AnalyseMarche_2026-03-19.pdf` (FR21)
**And** les espaces dans le nom du patient sont supprimes ou remplaces

**AC4 — Disclaimer legal EU MDR sur chaque page**
**Given** le PDF est genere
**When** chaque page est rendue
**Then** le disclaimer `LEGAL_CONSTANTS.mdrDisclaimer` est affiche en pied de page (FR22)
**And** le disclaimer est non modifiable et identique sur toutes les pages
**And** le texte utilise la constante centralisee de `core/legal/legal-constants.ts`

**AC5 — Rapport a deux niveaux de lecture**
**Given** le PDF est genere avec les donnees d'analyse
**When** le rapport est ouvert
**Then** une section "Vue praticien" affiche les angles articulaires avec indicateurs visuels (dans/hors norme) (FR23)
**And** une section "Vue detaillee" affiche les donnees brutes : score de confiance ML (%), ID analyse, statut correction manuelle

**AC6 — Metadonnees de session incluses**
**Given** le PDF est genere
**When** la section metadonnees est rendue
**Then** elle contient : date de l'analyse, nom du patient, appareil utilise (Platform.OS + modele si disponible), niveau de confiance ML (FR25)
**And** si une correction manuelle a ete appliquee, le disclaimer "Donnees [articulation] : estimees — verification manuelle effectuee." est inclus

**AC7 — Generation 100% locale**
**Given** la generation du PDF est en cours
**When** le PDF est assemble
**Then** aucune requete reseau n'est emise pendant la generation
**And** le PDF est stocke temporairement dans le filesystem local

## Tasks / Subtasks

- [ ] Tache 1 — Ecrire les tests unitaires du `PdfGenerator` (AC: 2, 3, 4, 5, 6)
  - [ ] T1.1 — Test `generateReportFileName(patientName, date)` → retourne `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf`
  - [ ] T1.2 — Test `buildReportData(analysis, patient)` → retourne la structure de donnees du rapport avec les 2 niveaux
  - [ ] T1.3 — Test disclaimer present dans les donnees du rapport
  - [ ] T1.4 — Test metadonnees incluses (date, patient, confiance ML)
  - [ ] T1.5 — Test disclaimer correction manuelle quand `manualCorrectionApplied: true`

- [ ] Tache 2 — Implementer le `PdfGenerator` (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] T2.1 — Creer `src/features/report/data/pdf-generator.ts` avec `generateReport(analysis, patient): Promise<string>` (retourne le path du fichier)
  - [ ] T2.2 — Implementer `generateReportFileName()` avec la convention de nommage FR21
  - [ ] T2.3 — Implementer `buildReportData()` avec vue praticien et vue detaillee
  - [ ] T2.4 — Integrer `LEGAL_CONSTANTS.mdrDisclaimer` depuis `core/legal/legal-constants.ts`
  - [ ] T2.5 — Choisir et integrer une lib PDF React Native (ex: `react-native-html-to-pdf` ou `@react-pdf/renderer`)

- [ ] Tache 3 — Creer le `ReportScreen` (AC: 1, 2)
  - [ ] T3.1 — Creer `src/features/report/screens/report-screen.tsx`
  - [ ] T3.2 — Afficher un etat loading pendant la generation
  - [ ] T3.3 — Afficher un apercu ou confirmation quand le PDF est pret
  - [ ] T3.4 — Ajouter la route `Report: { analysisId, patientId }` dans `navigation/types.ts`

- [ ] Tache 4 — Creer le `report-store.ts` Zustand (AC: 1, 2)
  - [ ] T4.1 — Creer `src/features/report/store/report-store.ts` avec etats `idle | generating | ready | error`
  - [ ] T4.2 — Action `generateReport(analysisId, patientId)` qui orchestre la generation

- [ ] Tache 5 — Creer `core/legal/legal-constants.ts` (AC: 4)
  - [ ] T5.1 — Creer le fichier avec `LEGAL_CONSTANTS.mdrDisclaimer`
  - [ ] T5.2 — Ecrire un test unitaire verifiant le contenu du disclaimer

- [ ] Tache 6 — Ecrire les tests d'integration (AC: 1, 7)
  - [ ] T6.1 — Test ReportScreen declenche la generation et affiche loading → ready
  - [ ] T6.2 — Test aucun appel reseau pendant la generation (mock fetch)

- [ ] Tache 7 — Valider avec `npx jest` et `npx tsc --noEmit` (AC: 1-7)
  - [ ] T7.1 — `npx jest --testPathPattern report --verbose` → tous les tests passent
  - [ ] T7.2 — `npx tsc --noEmit` → 0 erreurs TypeScript

- [ ] Tache 8 — Mettre a jour sprint-status.yaml
  - [ ] T8.1 — `4-1-generation-du-rapport-pdf-structure: done` si tous les tests passent

## Dev Notes

### Etat actuel du code React Native

**Le feature `report/` n'existe pas encore dans le codebase.** Tout est a creer.

**Fichiers existants (dependances) :**

| Fichier | Statut | Notes |
| --- | --- | --- |
| `src/features/capture/domain/analysis.ts` | Implemente | Interface `Analysis`, `ArticularAngles`, `confidenceLabel()` |
| `src/features/patients/domain/patient.ts` | Implemente | Interface `Patient`, `patientAge()` |
| `src/features/results/domain/reference-norms.ts` | Implemente | `assessAngle()`, normes de reference |
| `src/core/legal/` | N'existe pas | A creer : `legal-constants.ts` avec `LEGAL_CONSTANTS.mdrDisclaimer` |
| `src/features/report/` | N'existe pas | Tout a creer |
| `src/navigation/types.ts` | Implemente | Manque route `Report` |

### Ce qui doit etre construit

1. **`core/legal/legal-constants.ts`** — Constante `LEGAL_CONSTANTS.mdrDisclaimer`
2. **`features/report/data/pdf-generator.ts`** — Generation PDF locale
3. **`features/report/store/report-store.ts`** — Zustand store avec etats generation
4. **`features/report/screens/report-screen.tsx`** — Ecran de rapport
5. **Route `Report` dans `navigation/types.ts`**
6. **Choix d'une lib PDF** — Options : `react-native-html-to-pdf` (natif), ou generation HTML + impression native

### Choix de la lib PDF — Recommandation

Pour le MVP React Native CLI :
- **`react-native-html-to-pdf`** : genere un PDF depuis du HTML, fonctionne nativement sur iOS/Android. Ne fonctionne pas sur web.
- **Alternative web** : generer du HTML et utiliser `window.print()` ou une lib comme `jspdf`.
- Pattern recommande : interface `IPdfGenerator` avec implementations platform-specific (`pdf-generator.native.ts` / `pdf-generator.web.ts`).

### Stack technique React Native

- **State** : Zustand (immer middleware)
- **Navigation** : React Navigation (`@react-navigation/native-stack`)
- **DB** : SQLite via `react-native-sqlite-storage` (natif)
- **Tests** : Jest + React Native Testing Library (`@testing-library/react-native`)
- **Types** : TypeScript strict

### Design system — palette

```typescript
Colors.primary: '#4a90d9'
Colors.success: '#27ae60'
Colors.warning: '#f39c12'
Colors.error: '#e74c3c'
Colors.background: '#0f0f1a'
Colors.backgroundCard: '#1a1a2e'
Colors.textPrimary: '#ffffff'
```

### Disclaimer EU MDR — texte exact

```typescript
// core/legal/legal-constants.ts
export const LEGAL_CONSTANTS = {
  mdrDisclaimer:
    "BodyOrthox est un outil de documentation clinique. " +
    "Les donnees produites ne constituent pas un acte de " +
    "diagnostic medical et ne se substituent pas au jugement " +
    "clinique du praticien.",
} as const;
```

### Anti-patterns a eviter

- **NE PAS** hardcoder le texte du disclaimer dans le PDF generator — utiliser `LEGAL_CONSTANTS.mdrDisclaimer`
- **NE PAS** faire de requetes reseau pour la generation PDF — tout est local
- **NE PAS** stocker le PDF en base SQLite — le stocker dans le filesystem temporaire
- **NE PAS** acceder a SQLite directement depuis le screen — toujours via le Repository puis le Store
- **NE PAS** utiliser MobX — le codebase RN utilise Zustand

### Project Structure Notes

```
bodyorthox-rn/src/features/report/     <- A CREER
  data/
    pdf-generator.ts                   <- A CREER (AC2-7)
    pdf-generator.test.ts              <- A CREER
  screens/
    report-screen.tsx                  <- A CREER (AC1)
  components/
    export-button.tsx                  <- A CREER (Story 4.2)
  store/
    report-store.ts                    <- A CREER
    report-store.test.ts               <- A CREER

bodyorthox-rn/src/core/legal/          <- A CREER
  legal-constants.ts                   <- A CREER (AC4)
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

- [Source: docs/planning-artifacts/epics.md#Story-4.1] — "Generation du Rapport PDF Structure"
- [Source: docs/planning-artifacts/architecture.md#Rapport-PDF] — `features/report/`, `LEGAL_CONSTANTS.mdrDisclaimer`
- [Source: bodyorthox-rn/src/features/capture/domain/analysis.ts] — Interface Analysis
- [Source: bodyorthox-rn/src/features/patients/domain/patient.ts] — Interface Patient
- [Source: bodyorthox-rn/src/features/results/domain/reference-norms.ts] — Normes de reference

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
