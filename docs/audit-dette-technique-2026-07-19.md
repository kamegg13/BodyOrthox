# Rapport de Dette Technique — BodyOrthox

**Date** : 2026-07-19 · **Branche** : `feat/rgpd-dm-compliance` · **Périmètre** : `bodyorthox-rn` (~73 000 lignes TS, 483 fichiers), `landing/`, `e2e/`, `docs/`

## Résumé exécutif

- **Score santé : 72/100** — le codebase est structurellement sain (duplication 0,6 %, patterns data cohérents, 1141 tests en 8,6 s, type-check propre), mais il porte 2 bugs cross-platform probables, 4 suites de tests cassées par le refactor en cours, et aucun outillage lint.
- **Le « poids » ressenti (14 Go) est à 95 % des artefacts régénérables** : le repo git ne pèse que 12 Mo. Un nettoyage sans risque récupère ~10 Go.
- Issues critiques : **4** · Effort total estimé : **~8-10 jours** (dont 1 journée pour tout le Critical + High rapide)

### D'où viennent les 14 Go

| Répertoire | Poids | Nature |
| --- | --- | --- |
| `bodyorthox-rn/ios/build` | 6,5 Go | Artefact Xcode — supprimable |
| `bodyorthox-rn/android/app/build` + `.cxx` | 3,5 Go | Artefact Gradle/NDK — supprimable |
| `bodyorthox-rn/node_modules` | 3,2 Go | Régénérable (`npm ci`) |
| `bodyorthox-rn/ios/Pods` | 590 Mo | Régénérable (`pod install`) |
| `.worktrees/` | 480 Mo | **Worktree orphelin** (plus enregistré dans `git worktree list`) — supprimable, pollue les recherches |
| Repo git (`size-pack`) | **12 Mo** | Sain |

```bash
# Nettoyage sans risque (~10 Go récupérés)
rm -rf bodyorthox-rn/ios/build bodyorthox-rn/android/app/build bodyorthox-rn/android/app/.cxx .worktrees
```

---

## Critical (à traiter immédiatement)

| Localisation | Issue | Impact | Effort |
| --- | --- | --- | --- |
| `src/screens/__tests__/Report.test.tsx`, `ReportsList.test.tsx`, `screens-v2/__tests__/report-route.test.tsx`, `reports-list-route.test.tsx` | **4 suites / 5 tests en échec** — régression active du refactor Report en cours (wording « interprétation clinique » → « note du praticien » et `testID reports-severity-chip-all` supprimé, tests non mis à jour) | Bloque le merge de la branche RGPD/DM | 1 h |
| `src/features/account/screens/account-screen.tsx:86-118` | `ProfileInput` écrit dans `localStorage` en direct — **n'existe pas sur iOS/Android** : le profil praticien (Nom, Cabinet, Spécialité) ne persiste probablement rien en natif. `getKeyValueStorage()` existe déjà et est utilisé dans `NewPatient.tsx` | Bug fonctionnel natif | 1 h |
| `src/screens/PatientDetail.tsx` | Archiver/Supprimer patient via `Alert.alert` sans branche web (contrairement aux wrappers `showAlert`/`showConfirm` d'`account-screen.tsx`) — les confirmations risquent d'échouer silencieusement sur web | Bug fonctionnel web sur une action destructive | 1 h |
| `package.json` (transitives) | **23 vulnérabilités npm** dont 2 critical (`shell-quote`, `websocket-driver`) et 7 high (`ws`, `lodash`, `path-to-regexp`…). Toutes en deps de tooling (CLI/Metro/webpack), risque runtime faible mais fix disponible | Sécurité chaîne d'outillage | 30 min (`npm audit fix` + re-test) |

## High Priority

| Localisation | Issue | Impact | Effort |
| --- | --- | --- | --- |
| `src/screens/NewPatient.tsx` (1229 lignes) | **God-component** : 13 `useState` manuels, 2 `useEffect` de brouillon à 13 dépendances, `isDirty` par double sérialisation JSON à chaque frappe, logique métier pure (parsing DOB, masque, draft) + 2 sous-composants + 220 lignes de styles dans un seul fichier. C'est aussi la suite de test la plus lente (7,1 s sur 8,6 s totaux) | Chaque évolution du formulaire patient est risquée et lente | 1-2 j (découpage : `use-new-patient-form.ts`, `new-patient-draft.ts`, `new-patient-validation.ts`, sous-composants, styles) |
| `src/features/account/screens/account-screen.tsx:194-229` | **SQL brut dans un écran** : `SELECT COUNT(*)` et surtout `DELETE FROM analyses; DELETE FROM patients` (suppression totale RGPD) hors couche repository, sans transaction, sans test. Seul endroit du codebase qui viole le pattern repository | Action destructive non testée, non transactionnelle | 3 h (extraire vers un repository + test) |
| `src/features/capture/components/skeleton-overlay.tsx` vs `src/features/capture/data/skeleton-svg.ts` | **Rendu squelette dupliqué** (Views RN pour l'écran vs SVG pour le PDF) avec **couleurs divergentes** : PDF gauche `#34D399` vert / droite `#22D3EE` cyan ; écran gauche blanc / droite bleu. La même jambe n'a pas la même couleur entre l'écran et le PDF | Incohérence clinique visible par le praticien | 4 h (source de vérité commune connexions + couleurs) |
| `src/features/report/domain/progression-report-generator.ts:379-477` | `buildSynthesisSection` (PDF) et `buildProgressionSynthesisSummary` (aperçu écran) **recalculent indépendamment** la même synthèse alors qu'un commentaire promet qu'ils ne peuvent pas diverger | Divergence PDF/écran silencieuse au prochain changement | 2 h |
| Projet entier | **Aucune config ESLint/Prettier**, pas de script `lint` — seul `tsc --noEmit` garde le code | Les violations (nesting, hooks deps, imports morts) ne sont détectées par rien | 3 h (eslint + config RN/hooks + CI) |
| `src/features/results/components/hka-angle-card.tsx` (0 %), `src/features/capture/data/pose-detector.web.ts` (28 %), `skeleton-canvas.ts` (4 %) | **Trous de couverture sur la zone clinique** : affichage de l'angle HKA et détection de pose web quasi sans filet, alors que c'est la donnée médicale centrale (contexte DM) | Risque de régression clinique invisible | 2 j |

## Medium Priority

| Localisation | Issue | Impact | Effort |
| --- | --- | --- | --- |
| `src/screens/` + `src/navigation/screens-v2/` | Double couche : chaque écran legacy est wrappé par une route v2. Intentionnel mais chaque changement d'écran touche 2 fichiers + 2 suites de tests | Friction de maintenance | 2-3 j (fusionner progressivement route + écran) |
| `report-generator.ts` vs `progression-report-generator.ts` | `escapeHtml`/`angleColor`/`fmt` dupliqués **avec dérive** (guard `Number.isFinite` absent d'un côté, casse hex différente) ; `generateHkaSvgChart`/`generateKneeSvgChart` ~90 % identiques | Dérive de rendu PDF | 4 h (extraire `report-html-helpers.ts` + `svg-chart-builder.ts`) |
| `bodyorthox-rn/e2e/` | **1 seul scénario Maestro, 100 % manuel** (aucun script npm, absent des workflows CI). Aucune non-régression automatisée du parcours critique capture→analyse ; flux RGPD/export/biométrie sans E2E | Régressions détectables uniquement à la main | 1-2 j (intégration CI + 2-3 scénarios) |
| `src/features/capture/data/pose-detector.web.ts:630-734` | `detect()` : 6 features sous flags, 4 niveaux de try/finally imbriqués pour le nettoyage mémoire | Difficile à faire évoluer sans fuite mémoire | 4 h (pipeline linéaire + helper de cleanup) |
| `src/features/patients/components/progression-chart.tsx` (824 lignes) | Moteur de graphe réimplémenté à la main (trigonométrie sur `View`), helpers mathématiques purs non testés enfouis dans l'UI, 42 % de couverture | Fragile, dur à tester | 1 j (extraire `chart-math.ts` + sous-composants) |
| Dépendances | RN 0.79.7 (latest 0.86), reanimated 3→4, gesture-handler 2→3, react-navigation en retard mineur. Rien de bloquant mais l'écart s'accumule | Coût de migration croissant | Planifier (1-2 j le moment venu) |
| `e2e/` (racine repo, non tracké) | 6 screenshots PNG résiduels d'un run local | Bruit dans `git status` | 5 min (supprimer ou gitignorer) |
| `src/screens/PreviewGallery.tsx` | Écran mort — jamais importé nulle part | Code mort | 10 min |

## Low Priority

| Localisation | Issue | Effort |
| --- | --- | --- |
| `Results.tsx`, `Report.tsx`, `PatientDetail.tsx` | Fixtures `SAMPLE_*` en dur dans les écrans de prod (15-35 lignes chacune) → déplacer vers un dossier fixtures | 1 h |
| `ToggleChips` / `SegmentedControl` / `SelectField` | Sélecteur à choix unique implémenté 3 fois → unifier dans le design system | 3 h |
| `skeleton-overlay.tsx:284-362` | 6 blocs JSX quasi identiques pour les labels d'angle → boucle sur config (~80 → ~15 lignes) | 1 h |
| `design-system/bodyorthox/MASTER.md` | Doc orpheline jamais référencée → déplacer dans `docs/` | 5 min |
| `analysis-metrics.ts`, `PatientPickerModal.tsx`, `patients-store.ts`, `reports-list-route.tsx` | Helper « short id P-XXXX » dupliqué 3 fois (TODO déjà notés dans le code) | 1 h |

## Métriques

| Catégorie | Valeur | Seuil | Verdict |
| --- | --- | --- | --- |
| Code dupliqué (jscpd) | 0,61 % lignes | < 5 % | ✅ Excellent |
| Couverture tests | 71,4 % stmts / 65,9 % branches | > 60 % (cible perso 80 %) | ⚠️ OK, sous la cible |
| Tests | 1141 (5 échecs) en 8,6 s | 0 échec | ❌ Régression active |
| Type-check (`tsc --noEmit`) | 0 erreur | 0 | ✅ |
| Vulnérabilités npm | 23 (2 critical, 7 high) — tooling | 0 critique | ❌ `npm audit fix` |
| TODO/FIXME réels | ~4 | < 20 | ✅ |
| Dépendances circulaires | 0 accidentelle (2 faux positifs plateforme documentés) | 0 | ✅ |
| Lint | Aucun outillage | ESLint configuré | ❌ |
| Fichiers > 800 lignes | 3 (`NewPatient` 1229, `pose-detector.web` 839, `progression-chart` 824) | 0 | ⚠️ |

## Plan d'action recommandé

1. **Aujourd'hui (~half-day)** — Réparer les 4 suites de tests de la branche en cours ; `npm audit fix` + re-run des tests ; `rm -rf` des builds iOS/Android et de `.worktrees/` (~10 Go) ; supprimer/gitignorer `e2e/` racine et `PreviewGallery.tsx`.
2. **Semaine 1** — Corriger les 2 bugs cross-platform (`localStorage` du profil praticien, `Alert.alert` web sur suppression patient) avec tests ; installer ESLint (config RN + rules-of-hooks) et l'ajouter en CI.
3. **Semaine 2** — Extraire le SQL d'`account-screen.tsx` vers un repository (transaction sur le DELETE RGPD, testé) ; mutualiser les helpers report (`report-html-helpers.ts`) et faire consommer la synthèse écran par celle du PDF ; unifier connexions/couleurs du squelette écran vs PDF.
4. **Semaines 3-4** — Découper `NewPatient.tsx` ; tests sur la zone clinique (`hka-angle-card`, `pose-detector.web`, `skeleton-canvas`) ; intégrer Maestro en CI avec 2-3 scénarios.
5. **Backlog** — Fusion progressive screens legacy ↔ routes v2 ; extraire `chart-math.ts` ; upgrade RN 0.86 / reanimated 4 en une passe dédiée ; unification du sélecteur à choix unique dans le design system.

---
*Méthodo : scans mécaniques (npm outdated/audit, tsc, jscpd, madge, jest --coverage, du/git) + 3 agents d'analyse parallèles (architecture & duplication, qualité des 12 plus gros fichiers, santé des tests). Le worktree orphelin `.worktrees/` a été exclu de toutes les analyses.*
