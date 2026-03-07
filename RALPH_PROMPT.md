# Ralph Loop — Story 3.5 + Epic 4

## Contexte

App iOS Flutter BodyOrthox — analyse biomécanique on-device.
Projet : /Users/karimmeguenni-tani/BodyOrthox

## Ta mission : Story 3.5 + Epic 4 complet

### Etape 1 — Identifie la prochaine story

Lis docs/implementation-artifacts/sprint-status.yaml
Trouve la premiere story qui nest PAS done dans cet ordre :

- 3-5-replay-expert-correction-manuelle
- 4-1-generation-du-rapport-pdf-structure
- 4-2-export-du-rapport-via-share-sheet-ios

### Etape 2 — Analyse des sous-taches et dependances

Lis le fichier story docs/implementation-artifacts/{story-id}.md
Extrais toutes les sous-taches. Construis le graphe de dependances :

- Sous-taches independantes = parallelisables
- Sous-taches dependantes = sequentielles
  Dependances critiques :
  3-5 : replay viewer puis overlay angles et correction manuelle en parallele
  4-1 : PDF layout engine puis vue simplifiee et vue detaillee en parallele puis disclaimer et metadonnees en parallele
  4-2 : share sheet integration puis nommage fichier et AirDrop en parallele

### Etape 3 — Dev Story avec TDD et Parallel Agents

Invoque le skill /bmad-bmm-dev-story pour la story courante.
Pour chaque groupe de sous-taches selon le graphe :

a) Sous-taches independantes : invoque le skill dispatching-parallel-agents - Un agent par sous-tache independante - Chaque agent : test dabord (Red) puis implementation (Green) puis refactor - Attend la fin de tous les agents avant le groupe suivant

b) Sous-taches dependantes : execution sequentielle - Test (Red) puis implementation (Green) puis refactoring

Lance flutter test apres chaque groupe et affiche le resultat.

### Etape 4 — Tests E2E

Invoque le skill /bmad-bmm-qa-generate-e2e-tests sur la story.
Utilise dispatching-parallel-agents pour les tests independants.
Affiche le resultat complet.

### Etape 5 — Code Review

Invoque le skill /bmad-bmm-code-review sur la story.
Si problemes trouves : retourne Etape 3 pour corriger uniquement les sous-taches concernees.
Si approuvee : continue.

### Etape 6 — Marque la story done

Lance flutter test --coverage et affiche le resultat.
Met a jour docs/implementation-artifacts/sprint-status.yaml :

- story status vers done
- Si toutes Epic 3 done : epic-3 vers done
- Si toutes Epic 4 done : epic-4 vers done

### Etape 7 — Verification finale

Si 3-5 et 4-1 et 4-2 sont toutes done ET flutter test passe :
Affiche le resume complet puis output : <promise>3.5 TO EPIC4 COMPLETE</promise>
Sinon : recommence Etape 1 avec la story suivante.

## Regles

- Jamais de code production avant le test (TDD)
- flutter test vert obligatoire avant de marquer une story done
- Les agents paralleles ne touchent JAMAIS les memes fichiers
- 100 pourcent offline, zero dependance reseau
- Design system : Primary #1B6FBF, Cupertino+Material3, touch targets 44x44pt
- Story 3-5 : disclaimer obligatoire sur les points articulaires corriges manuellement
- Story 4-1 : PDF local moins de 5s, disclaimer LegalConstants.mdrDisclaimer permanent sur chaque page
- Story 4-2 : share sheet iOS natif uniquement, nom fichier NomPatient_AnalyseMarche_DATE.pdf pre-rempli
