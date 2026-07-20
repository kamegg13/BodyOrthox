# Audit de Dette Technique — BodyOrthox (mise à jour post-PR #22)

**Date** : 2026-07-20 · **Branche** : `main` (après merge PR #22 conformité RGPD/DM) · **Baseline** : `docs/audit-dette-technique-2026-07-19.md`

## Résumé exécutif

- **Score santé : 73/100** (72 hier). La PR #22 a réparé les 4 suites de tests cassées et introduit du code de bonne qualité (`hka-range.ts`, export art. 20, garde-fous anti-vocabulaire DM), mais **aucun autre point de l'audit d'hier n'a été traité** — et elle a retouché `handleDeleteAllData` sans corriger son défaut de fond.
- **Suite verte** : 116 suites / 1118 tests, 100 % passés en 8,1 s. Type-check propre.
- Couverture : **70,9 % stmts** (léger recul vs 71,4 % — la PR a supprimé net 23 tests avec les anciens composants de sévérité).

## Delta depuis le 2026-07-19

### ✅ Corrigé

| Point | Détail |
| --- | --- |
| 4 suites de tests en échec | Réparées dans la PR #22 — suite 100 % verte |
| Sémantique de gravité clinique (audit RGPD/DM) | `src/shared/domain/hka-range.ts` bien conçu (pur, testé, avec un test-regex qui interdit tout vocabulaire de gravité) et consommé partout sur la chaîne Report/Results/PatientDetail ; anciens fichiers supprimés proprement |

### ❌ Toujours ouvert (inchangé depuis hier)

| Priorité | Point | Localisation |
| --- | --- | --- |
| Critical | Profil praticien via `localStorage` direct → ne persiste rien en natif | `account-screen.tsx:33-49` |
| Critical | Archiver/Supprimer patient via `Alert.alert` sans branche web | `PatientDetail.tsx:96,107` |
| Critical | 23 vulnérabilités npm (2 critical, tooling, `npm audit fix` dispo) | `package.json` |
| High | `NewPatient.tsx` god-component (1190 lignes, test à 7 s) | `src/screens/NewPatient.tsx` |
| High | Couleurs squelette écran ≠ PDF (vert/cyan vs blanc/bleu) | `skeleton-svg.ts:20-21` vs `skeleton-overlay.tsx:119-142` |
| High | Synthèse PDF/écran dupliquée malgré commentaire contraire | `progression-report-generator.ts:379-477` |
| High | Aucune config ESLint/Prettier, pas de script lint | projet entier |
| High | Zone clinique peu testée (`hka-angle-card` 0 %, `pose-detector.web` 28 %, `skeleton-canvas` 4 %) | `src/features/capture`, `src/features/results` |
| Medium | E2E : 1 scénario Maestro manuel, hors CI | `bodyorthox-rn/e2e/` |
| Medium | `PreviewGallery.tsx` mort ; `e2e/` racine non tracké (screenshots résiduels) | — |
| Medium | 14 Go sur disque : builds iOS/Android (~9 Go) + `.worktrees/` orphelin (480 Mo) non nettoyés | — |

### 🆕 Nouveaux findings (code de la PR #22)

| Priorité | Point | Localisation |
| --- | --- | --- |
| **Critical** | **Suppression RGPD art. 17 non atomique** : deux `DELETE` bruts séquentiels sans transaction (et `IDatabase` natif n'expose aucune méthode `transaction()`). Un crash entre les deux = suppression partielle silencieuse. La PR a retouché cette fonction (ajout `showConfirm`) sans corriger le fond | `account-screen.tsx:250-259` |
| **Critical** | **Zéro test sur `handleExportAllData` et `handleDeleteAllData`** — les deux fonctions cœur de la PR (art. 20 + art. 17). Rien ne garantit le JSON d'export ni la remise à zéro des compteurs | `account-screen.test.tsx` |
| High | Rupture de pattern dans le même fichier : l'export passe par les repositories (bien), mais `loadCounts` et la suppression restent en SQL brut. `sqlite-patient-repository.ts:222` a déjà la fondation (delete scoped) — il manque une variante bulk | `account-screen.tsx:194-205, 250-259` |
| High | `LegalDisclaimer.tsx` prétend couvrir « chaque écran » incl. Capture, mais `capture-success.tsx:~274` affiche toujours le disclaimer en `<Text>` inline — unification incomplète | `LegalDisclaimer.tsx:7-9` |
| Medium | `legal-screen.tsx` (142 lignes, l'écran le plus sensible juridiquement) : aucun test | `src/features/account/screens/` |
| Medium | Vocabulaire de sévérité résiduel hors périmètre PR : `patient-list-tile.tsx:10` (`StatusBadge NORMAL/A_SURVEILLER/HORS_NORME` — composant **mort**, à supprimer) et labels « Normal/Zone normale » dans `progression-chart.tsx` — c'est le risque DM pointé par l'audit RGPD | `src/features/patients/components/` |
| Medium | Indentation cassée dans le bloc consentements (refactor sans lint pour l'attraper) | `NewPatient.tsx:756-785` |
| Low | Erreurs d'export/suppression avalées dans un message générique, sans log ni télémétrie | `account-screen.tsx` |

### Bien fait dans la PR #22 (à conserver comme référence)

- `hka-range.ts` : pur, testé, garde-fou regex anti-vocabulaire de gravité.
- `legal-constants.test.ts` : assertions négatives interdisant les termes déclencheurs DM (« aide à la décision », « certifié », « clinique »).
- `export-service.{native,web}.ts` : séparation plateforme propre, pas de fichier temporaire en clair, annulation détectée, domaine testé.
- Consentements modifiables avec re-horodatage conditionnel (art. 7.3) dans `NewPatient.tsx`.

## Métriques (2026-07-20 vs 2026-07-19)

| Catégorie | Aujourd'hui | Hier | Verdict |
| --- | --- | --- | --- |
| Tests | 1118 / 100 % verts / 8,1 s | 1141 / 5 échecs | ✅ réparé |
| Couverture stmts / branches | 70,9 % / 65,5 % | 71,4 % / 65,9 % | ⚠️ léger recul |
| Type-check | 0 erreur | 0 erreur | ✅ |
| Vulnérabilités npm | 23 (2 critical) | 23 (2 critical) | ❌ inchangé |
| Lint | absent | absent | ❌ inchangé |
| Fichiers > 800 lignes | 3 (NewPatient 1190, pose-detector.web 839, progression-chart 824) | 3 | ❌ inchangé |
| Poids disque / repo git | 14 Go / 12 Mo | 14 Go / 12 Mo | ❌ nettoyage non fait |

## Plan d'action actualisé

1. **Immédiat (~half-day)** — `npm audit fix` + re-test ; nettoyage disque (`rm -rf bodyorthox-rn/ios/build bodyorthox-rn/android/app/build bodyorthox-rn/android/app/.cxx .worktrees`, ~10 Go) ; supprimer `PreviewGallery.tsx`, `patient-list-tile.tsx` (mort, vocabulaire DM) et gitignorer/supprimer `e2e/` racine.
2. **Priorité RGPD (nouveau, 1 j)** — Extraire la suppression art. 17 vers le repository avec une vraie stratégie d'atomicité (transaction SQLite via op-sqlite, ou au minimum ordre delete + vérification) ; tester `handleExportAllData`/`handleDeleteAllData` ; logger les erreurs.
3. **Semaine 1** — Bugs cross-platform (`localStorage` profil, `Alert.alert` PatientDetail) ; ESLint + CI ; unifier le disclaimer dans `capture-success.tsx`.
4. **Semaine 2** — Couleurs squelette écran/PDF ; mutualiser helpers report + synthèse ; labels « Normal » de `progression-chart.tsx` → wording neutre `hka-range`.
5. **Semaines 3-4 et backlog** — inchangé (découpage NewPatient, tests zone clinique, Maestro en CI, upgrade RN 0.86/reanimated 4, fusion screens/routes v2).

---
*Méthodo : re-scan mécanique complet (jest+coverage, tsc, npm audit, disque) + vérification point-par-point des findings du 2026-07-19 + agent d'analyse dédié au diff de la PR #22 (1521e90..HEAD).*
