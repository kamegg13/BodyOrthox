---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: "Pivot HKA + architecture extensible + refonte KISS/DRY"
session_goals: "1. Remplacer analyse vidéo sagittale par analyse angle HKA sur photo statique. 2. Architecture plugin/extensible pour futures features. 3. Refonte code KISS+DRY. Matière pour /bmad-bmm-correct-course."
selected_approach: "ai-recommended"
techniques_used:
  ["First Principles Thinking", "SCAMPER Method", "Resource Constraints"]
ideas_generated: 11
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitateur:** Karimmeguenni-tani
**Date:** 2026-03-08

## Session Overview

**Topic:** Pivot HKA + architecture extensible + refonte KISS/DRY

**Goals:**

1. Remplacer l'analyse vidéo biomécanique (angles sagittaux) par une analyse d'angle HKA (Hip-Knee-Ankle) sur photo en position anatomique de référence
2. Architecture plugin/extensible pour ajouter futures analyses sans refonte majeure
3. Refonte code KISS+DRY — simplifier le codebase, faciliter les code reviews

**Objectif fin de session:** Matière concrète pour alimenter `/bmad-bmm-correct-course`

### Context Guidance

App iOS Flutter pour orthopédistes. L'analyse vidéo biomécanique en coupe sagittale n'est pas assez intégrée dans les workflows cliniques réels. L'analyse HKA (genu varum/valgum, planification prothétique) est plus directement exploitable par les orthopédistes.

---

## Technique Selection

**Approche:** Techniques recommandées par l'IA
**Contexte:** Pivot clinique + architecture + simplification code

**Techniques utilisées:**

- **First Principles Thinking** — Déconstruire les hypothèses, repartir des vérités cliniques fondamentales
- **SCAMPER Method** — 7 lenses pour le pivot HKA et l'architecture plugin
- **Resource Constraints** — Forcer le KISS, identifier le coeur essentiel

---

## Technique Execution Results

### First Principles Thinking

**Vérités fondamentales découvertes:**

- L'orthopédiste a besoin de mesurer l'angle HKA sur téléradiographie debout — gold standard pour genu varum/valgum, planification ostéotomie, alignement prothétique
- La radio c'est lent, coûteux, irradiant — le besoin est une **information rapide en consultation**, avant de décider si une radio est nécessaire
- L'app est un **outil de screening pre-radio**, pas un remplacement de la télémétrie
- ML détecte automatiquement les landmarks H/K/A — le médecin corrige si nécessaire
- Phrase boussole : _"BodyOrthox permet à un orthopédiste d'analyser les angles articulaires en 30 secondes, sans friction"_

### SCAMPER Method

**Substitute:** Analyse vidéo sagittale → analyse HKA sur photo statique + module swappable
**Combine:** Rapport multi-analyses consolidé sur une même consultation
**Adapt:** Pattern UX style radiologie (drag-and-drop landmarks) — potentiel v2
**Modify:** Pipeline ML simplifié — photo unique, suppression temporal smoothing/buffer vidéo
**Put to other uses:** Infrastructure patient/historique réutilisable pour tous modules futurs ; freemium par module
**Eliminate:** Guidage caméra vidéo, script RGPD démarrage enregistrement, temporal smoothing
**Reverse:** Téléconsultation patient → médecin (hors scope, idée v2)

### Resource Constraints

**Ordre de priorité absolu (2 semaines, 1 dev):** Analyse HKA → Architecture plugin → Données patient
**MVP défini:**

- Photo → ML → Angle HKA : OUI
- Correction manuelle des points : OUI
- Rapport PDF généré : OUI
- Profil patient nommé : OUI
- Historique des analyses : OUI
- Freemium / quota : OUI
- Face ID / chiffrement AES-256 : NON (éliminés)
- Onboarding wizard : OUI

---

## Idées Générées — Inventaire Complet

### Thème 1 : Pivot Clinique — Analyse HKA

**[HKA #1]** : Auto-détection ML + Correction Médecin
_Concept :_ ML Kit détecte automatiquement les 3 landmarks H/K/A sur photo debout face antérieure. Le médecin peut déplacer manuellement les points si la détection est imprécise. L'angle est calculé en temps réel. Réutilise l'infrastructure de correction manuelle existante (Story 3.5).
_Nouveauté :_ Pivot technique minimal — la Story 3.5 est déjà construite.

**[HKA #2]** : Boussole produit — La phrase d'une ligne
_Concept :_ "BodyOrthox permet à un orthopédiste d'analyser les angles articulaires en 30 secondes, sans friction." Tout ce qui ne contribue pas à cette phrase est candidat à l'élimination ou au report.
_Nouveauté :_ Filtre de décision simple et puissant pour prioriser chaque feature.

**[HKA #3]** : App = Screening Tool, pas remplacement de la radio
_Concept :_ BodyOrthox n'est pas un outil de diagnostic définitif — c'est un outil de triage rapide qui évite une X-ray inutile ou prépare la consultation radio. Simplifie les attentes légales et cliniques.
_Nouveauté :_ Positionnement "pre-X-ray screening" plus honnête et plus vendable.

**[KISS #4]** : ML complet dès v1, correction manuelle comme ajustement
_Concept :_ Pas de MVP dégradé sans ML. Google ML Kit Pose Detection détecte déjà hanche/genou/cheville nativement — l'angle HKA se calcule directement depuis le pose graph existant sans modèle custom.
_Nouveauté :_ Zéro entraînement de modèle custom nécessaire.

---

### Thème 2 : Architecture Extensible

**[ARCH #1]** : `AnalysisModule` — interface swappable
_Concept :_ Chaque type d'analyse (HKA, Cobb, axe fémoral, membre supérieur...) est un module indépendant qui implémente une interface commune `AnalysisModule`. L'app core charge le bon module via un Registry pattern. Ajouter une nouvelle analyse = ajouter un module, zéro touche au core.
_Nouveauté :_ Architecture plugin native Flutter — abstract class + Registry. Le core ne connaît pas les analyses concrètes.

**[ARCH #2]** : `ReportBuilder` multi-analyses consolidé
_Concept :_ Un rapport PDF peut agréger plusieurs modules d'analyse pour un même patient/visite. Le `ReportBuilder` accepte une liste de `AnalysisResult` indépendamment de leur type. Rapport = couche de présentation découplée des modules.
_Nouveauté :_ Un rapport de consultation peut combiner HKA + axe fémoral + tibial.

**[BIZ #1]** : Quota freemium par module d'analyse
_Concept :_ Chaque module d'analyse a son propre quota freemium configurable. Le `FreemiumCounter` existant devient module-aware. Chaque nouveau module est une opportunité de revenus distincte.
_Nouveauté :_ Monétisation granulaire sans refonte du système de paiement.

---

### Thème 3 : Simplification KISS/DRY

**[KISS #1]** : Pipeline ML radicalement simplifié
_Concept :_ Supprimer tout le pipeline vidéo (buffer frames, temporal smoothing, streaming analysis) au profit d'une unique image → 3 landmarks → 1 calcul d'angle. Fonction pure et testable.
_Nouveauté :_ La complexité la plus lourde du codebase actuel disparaît entièrement.

**[KISS #2]** : Élimination du pipeline vidéo complet
_Concept :_ Supprimer guidage caméra animé (Story 3.1), script RGPD d'enregistrement vidéo (Story 3.2), temporal smoothing, buffer de frames. Le module caméra devient : ouvrir appareil photo natif iOS → prendre photo → analyser.
_Nouveauté :_ ~40-60% du code de l'Epic 3 actuel supprimé.

**[KISS #3]** : Ordre de priorité absolu — Analyse → Architecture → Données
_Concept :_ Le coeur de l'app c'est l'analyse HKA, pas la gestion des patients. L'architecture plugin vient avant le profil patient car elle conditionne tout ce qui suit. Le profil patient est une feature de confort, non critique au lancement.
_Nouveauté :_ Révèle que l'Epic 2 est secondaire par rapport à l'Epic 3 refondu.

**[KISS #5]** : Face ID + AES-256 éliminés du MVP
_Concept :_ Stories 1.2 (Face ID/Touch ID) et 1.3 (Chiffrement AES-256) hors MVP. Sur un outil de screening rapide, la sécurité biométrique ajoute de la friction sans valeur immédiate. La sandbox iOS native protège les données locales.
_Nouveauté :_ Supprime ~2 stories complexes de l'infrastructure.

---

### Concept Breakthrough (V2)

**[UX #1]** : Interface de correction radiologique — point draggable
_Concept :_ Adapter le pattern UX des outils de mesure radiologique (drag-and-drop des landmarks) pour la correction manuelle des points H/K/A sur photo iPhone. Familier pour les orthopédistes habitués aux logiciels PACS.
_Nouveauté :_ Non prévu initialement — potentiel pour une v2 ou une feature premium.

**[FUTUR #1]** : Téléconsultation pré-analyse patient
_Concept :_ Patient envoie sa propre photo depuis chez lui, médecin analyse à distance. Hors scope actuel.
_Nouveauté :_ Ouvrirait un modèle B2C en plus du B2B — idée v2.

---

## Idée Organisation et Prioritisation

### Organisation par Thèmes

**Thème 1 — Pivot Clinique (4 idées):** HKA #1, HKA #2, HKA #3, KISS #4
**Thème 2 — Architecture Extensible (3 idées):** ARCH #1, ARCH #2, BIZ #1
**Thème 3 — Simplification KISS/DRY (4 idées):** KISS #1, KISS #2, KISS #3, KISS #5
**Concepts V2 (2 idées):** UX #1, FUTUR #1

### Résultats de Prioritisation

**Top priorités (pour Correct Course) :**

| Priorité | Idée              | Action dans Correct Course                              |
| -------- | ----------------- | ------------------------------------------------------- |
| 1        | HKA #1 + KISS #1  | Réécrire Epic 3 — nouveau pipeline photo HKA            |
| 2        | ARCH #1 + ARCH #2 | Refondre l'architecture — doc technique à mettre à jour |
| 3        | KISS #2 + KISS #5 | Supprimer Stories 1.2, 1.3, 3.1, 3.2 du sprint          |
| 4        | BIZ #1            | Modifier Epic 5 — freemium par module                   |
| 5        | HKA #3            | Mettre à jour PRD — repositionnement screening          |

**Quick wins :**

- Supprimer les stories obsolètes (Stories 1.2, 1.3, 3.1, 3.2) — immédiat
- Calculer angle HKA depuis pose graph ML Kit existant — quelques heures de code

**Breakthroughs :**

- `AnalysisModule` interface — change l'app d'un outil monolithique à une plateforme extensible
- Pipeline photo unique — supprime la source de complexité #1 du codebase

### Action Planning

**Action 1 — Lancer `/bmad-bmm-correct-course`**
Prochaine étape immédiate. Inputs à fournir à Bob (Scrum Master) :

1. Ce document de brainstorming
2. Demande explicite : changer Epic 3 (HKA photo), refondre archi (plugin), supprimer Stories 1.2/1.3/3.1/3.2, modifier Epic 5 (freemium/module), mettre à jour PRD (screening pre-radio)

**Action 2 — Valider la faisabilité ML Kit**
Vérifier que `PoseLandmark.leftHip`, `leftKnee`, `leftAnkle` (et right) sont détectables sur photo statique avec ML Kit Pose Detection — avant d'écrire les nouvelles stories.

**Action 3 — Définir l'interface `AnalysisModule`**
Concevoir l'abstract class Flutter et le Registry pattern dans le document d'architecture avant l'implémentation.

---

## Session Summary and Insights

**Réalisations clés :**

- 11 idées générées et organisées en 3 thèmes actionnables + 2 concepts V2
- Définition de la phrase boussole produit : "30 secondes, sans friction"
- Clarification du positionnement : screening pre-radio, pas diagnostic
- Identification des suppressions majeures : Stories 1.2, 1.3, 3.1, 3.2 + pipeline vidéo complet
- Architecture plugin définie conceptuellement : `AnalysisModule` + `ReportBuilder` découplé

**Insights de session :**

- Le vrai besoin clinique est la rapidité d'accès à l'info HKA, pas la précision radiologique
- La Story 3.5 (Correction Manuelle) est le composant le plus réutilisable du codebase existant
- Google ML Kit Pose Detection couvre déjà les landmarks nécessaires — zéro modèle custom
- La suppression du pipeline vidéo est le levier KISS le plus impactant

**Prochaine étape recommandée :**
Lancer `/bmad-bmm-correct-course` dans un nouveau contexte avec ce document comme input.
