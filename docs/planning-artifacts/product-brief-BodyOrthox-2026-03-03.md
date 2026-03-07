---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflow_completed: true
completedDate: "2026-03-03"
inputDocuments:
  - "docs/brainstorming/brainstorming-session-2026-03-02-1930.md"
  - "docs/planning-artifacts/research/technical-bodyorthox-stack-research-2026-03-02.md"
date: "2026-03-03"
author: "Karimmeguenni-tani"
---

# Product Brief: BodyOrthox

## Executive Summary

BodyOrthox est une application mobile iOS qui permet aux orthopédistes
d'analyser objectivement la biomécanique de leurs patients — marche et
course — en moins de 30 secondes, depuis le démarrage de l'app jusqu'à
l'envoi du rapport, en utilisant uniquement leur smartphone. L'analyse
se fait 100% on-device : aucune donnée vidéo n'est transmise vers le
cloud. Le résultat : des données cliniques objectives, portables,
accessibles, au prix d'un abonnement mensuel — là où les concurrents
facturent 3 000 à 15 000€/an avec du matériel dédié.

---

## Core Vision

### Problem Statement

Les orthopédistes manquent d'un outil simple, rapide et abordable pour
analyser objectivement la biomécanique de leurs patients. Selon les
praticiens, les méthodes varient : analyse visuelle manuelle (subjective,
non traçable) ou solutions spécialisées onéreuses nécessitant du matériel
dédié et une expertise technique. Dans les deux cas, le résultat n'est
ni rapide ni directement intégrable dans le dossier patient.

### Problem Impact

- Décisions cliniques appuyées sur des données subjectives et non
  documentées
- Impossibilité de tracer l'évolution biomécanique d'un patient dans
  le temps de manière standardisée
- Charge cognitive et temporelle additionnelle sur un temps de
  consultation déjà contraint
- Absence de preuve objective exportable pour le dossier médical

### Why Existing Solutions Fall Short

- **Coût prohibitif** : Kinetisense, Dartfish → 3 000-15 000€/an,
  inaccessibles pour la majorité des cabinets
- **Matériel dédié** : non portable, requiert une salle ou une
  installation spécifique
- **Complexité d'usage** : courbe d'apprentissage incompatible avec
  le rythme de consultation
- **Aucune solution intermédiaire** : le marché offre "rien" ou
  "trop cher + trop complexe", pas de middle ground

### Proposed Solution

BodyOrthox résout ce problème avec un flux en 4 taps : ouvrir l'app →
créer/sélectionner un patient → filmer la marche → obtenir les angles
articulaires et envoyer le rapport PDF. L'analyse (genou, hanche,
cheville) est calculée en temps différé directement sur l'iPhone via
Google ML Kit. Aucune donnée vidéo ne quitte l'appareil. Le rapport est
nommé automatiquement et exportable en un tap.

Objectif core : **30 secondes du démarrage à l'envoi du rapport.**

### Key Differentiators

1. **100% On-Device** — traitement ML local, zéro transmission vidéo,
   RGPD-compliant nativement sans effort de conformité
2. **Portabilité absolue** — uniquement un iPhone, aucun matériel,
   utilisable dans n'importe quelle salle de consultation
3. **Simplicité radicale** — flux 4 taps, 30 secondes, aucune formation
   technique requise
4. **Prix disruptif** — modèle freemium ~39-49€/mois vs 3-15k€/an des
   alternatives spécialisées
5. **Architecture IA évolutive** — conçu pour absorber rapidement les
   avancées en analyse de pose sans refonte (modèles ML Kit,
   intégration agents IA future)

> **⚠️ Hypothèse critique à valider :** Le workflow exact des orthopédistes
> (méthodes actuelles, fréquence d'analyse, format rapport attendu) est une
> inconnue — à valider par 3-5 entretiens praticiens avant le MVP.

---

## Target Users

### Primary Users

#### Dr. Marc — Orthopédiste Libéral (Persona Principal)

**Profil :** Orthopédiste en cabinet libéral (solo ou groupe), 42 ans,
10-15 ans d'expérience. Équipé d'un iPhone personnel. Aucun budget
matériel dédié à l'analyse biomécanique — les solutions existantes
(3-15k€/an) sont hors de portée ou injustifiables pour son cabinet.

**Contexte d'usage :** Sur 3 consultations, environ 1 nécessite une
analyse biomécanique de la marche ou de la course. Il n'a ni salle dédiée
ni assistant technique — il filme seul, entre deux examens.

**Frustration actuelle :** Analyse visuelle subjective et non traçable,
ou absence totale d'outil. Ce qu'il a essayé (si quoi que ce soit) était
trop complexe, trop cher, ou inadapté au rythme du cabinet.

**Ce qu'il veut :** Un outil qu'il sort de sa poche, utilise en 30
secondes, et range. Pas de formation, pas de branchement, pas de compte
à configurer. Le résultat doit être immédiatement lisible et exportable.

**Moment "aha" :** Il voit le premier résultat d'analyse s'afficher —
angles articulaires, visualisation — sans avoir rien configuré. Ce moment
de "ça marche, vraiment" déclenche l'adoption.

**Décision d'achat :** Il décide seul (solo) ou avec les associés du
cabinet (groupe). Sensible au rapport qualité/prix : ~39-49€/mois
est dans sa zone de confort, perçu comme une dépense de productivité
plutôt qu'un investissement matériel.

---

### Secondary Users

#### La Secrétaire Médicale

**Rôle :** N'utilise pas l'application directement. Elle reçoit le PDF
généré par le médecin (nommé automatiquement `NomPatient_AnalyseMarche_DATE.pdf`)
et effectue deux actions : classement dans le dossier patient (logiciel
médical ou système de fichiers) et envoi au patient par email ou courrier.

**Ce qui compte pour elle :** Le PDF doit être prêt à classer sans
renommage manuel, sans manipulation technique. Si le fichier est mal nommé
ou arrive dans un format inattendu, elle devient un frein passif à
l'adoption. Si le workflow est fluide, elle devient un ambassadeur invisible.

**Interaction avec BodyOrthox :** Zéro interaction avec l'app — 100%
avec le PDF en sortie.

---

### User Journey — Dr. Marc

| Étape               | Expérience                                                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Découverte**      | Voit une démo live au congrès SoFCOT, ou un confrère lui montre son rapport sur son téléphone. L'absence de matériel est le message — il repart avec son propre rapport généré en démo. |
| **Onboarding**      | Télécharge l'app, crée son premier patient en 2 taps. Le wizard 3 écrans lui montre le résultat final avant de lui expliquer les boutons.                                               |
| **Premier usage**   | Filme son patient qui marche. Attend ~20 secondes. Voit les angles s'afficher.                                                                                                          |
| **Moment "aha"**    | Il voit le résultat — angles, visualisation articulaire — s'afficher sur son iPhone. Réaction : "ça marche vraiment."                                                                   |
| **Usage quotidien** | 1 consultation sur 3 : il filme, analyse, exporte le PDF en 1 tap. La secrétaire classe et envoie.                                                                                      |
| **Ancrage**         | Il commence à montrer le rapport au patient comme outil de communication, pas juste de documentation. L'app entre dans son rituel de consultation.                                      |

> **Note :** Les cliniques constituent un segment différé (validation par les pairs
> requise, processus d'adoption institutionnel). Les kinés, médecins du sport
> et coachs sont identifiés comme segments post-MVP.

---

## Success Metrics

### North Star Metric

**Nombre d'analyses réalisées par praticien actif par semaine.**

Ce chiffre capture à la fois l'engagement (fréquence), la valeur perçue
(l'outil est utilisé en consultation réelle) et l'ancrage dans le
workflow. Un praticien qui analyse plusieurs patients par semaine est
un praticien converti.

---

### User Success Metrics

| Métrique                 | Définition                                            | Seuil cible                                    |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------- |
| **Rétention J+7**        | % utilisateurs qui ouvrent l'app dans la 1ère semaine | > 70%                                          |
| **Rétention M+1**        | % utilisateurs encore actifs après 30 jours           | > 50% (alarme si < 50%)                        |
| **Fréquence d'usage**    | Analyses réalisées par praticien actif / semaine      | ≥ 3 analyses/semaine                           |
| **Habit lock**           | % praticiens utilisant l'app 3+ semaines consécutives | > 40% à M+2                                    |
| **Intégration workflow** | Praticien utilise l'app sans session d'apprentissage  | Qualitatif — détecté via support et entretiens |

**Définition "utilisateur converti" :** Praticien qui utilise BodyOrthox
sans y réfléchir — l'app fait partie de son geste clinique naturel.
Signal mesurable : 3+ analyses par semaine pendant 4 semaines consécutives.

---

### Business Objectives

| Horizon  | Objectif                                                        |
| -------- | --------------------------------------------------------------- |
| **M+3**  | 15-20 praticiens actifs (validation product-market fit initial) |
| **M+12** | 100 praticiens actifs (freemium + payant confondus)             |
| **M+6**  | Premier signal de conversion freemium → payant                  |

**Métrique business principale : Taux de rétention mensuel.**
Un utilisateur qui reste est un utilisateur accroché. La rétention
prime sur l'acquisition — mieux vaut 20 praticiens fidèles que
100 qui churne après 2 semaines.

---

### Key Performance Indicators

| KPI                              | Mesure                                 | Signal d'alarme            |
| -------------------------------- | -------------------------------------- | -------------------------- |
| **Churn M+1**                    | % utilisateurs inactifs après 30 jours | > 50% de churn             |
| **Praticiens actifs**            | Utilisateurs avec ≥ 1 analyse/semaine  | < 15 à M+3                 |
| **Croissance mensuelle**         | Nouveaux praticiens/mois               | Stagnation > 2 mois        |
| **Conversion freemium → payant** | % passage au plan payant               | À calibrer après lancement |
| **Analyses/utilisateur/mois**    | Volume d'usage par compte actif        | < 8 analyses/mois          |

> **⚠️ Note :** Les 100 praticiens à M+12 incluent freemium et payants.
> La conversion freemium → payant (seuil des 10 analyses/mois) sera
> le signal économique clé, à calibrer après les 3 premiers mois de données.

---

## MVP Scope

### Core Features

**Flux principal (non négociable) :**

- Flux 4 taps : Nouveau patient → Filmer → Résultat → Exporter
- Capture guidée : cadre visuel, détection luminosité, guidage vue profil strict
- Analyse post-capture (pas de traitement temps réel)
- 3 articulations : genou, hanche, cheville
- Analyse marche et course

**Résultats & Rapport :**

- Affichage angles articulaires avec normes de référence par âge/profil
- Vue annotation expert : replay image par image avec angles superposés
- Interface deux niveaux : simple (praticien) / expert (données brutes)
- Rapport PDF nommé automatiquement (`NomPatient_AnalyseMarche_DATE.pdf`)
- Export 1 tap (AirDrop, email, partage iOS natif)

**Gestion patients :**

- Création et gestion patients (local)
- Historique analyses par patient
- Timeline progression clinique

**Technique & Confidentialité :**

- Analyse 100% on-device — Google ML Kit, zéro transmission vidéo
- Stockage local uniquement — Drift + SQLCipher (AES-256)
- Sécurité device : Face ID / Touch ID iOS natif (pas d'auth propriétaire)
- Script réassurance RGPD intégré avant capture

**Onboarding :**

- Wizard 3 écrans : motivationnel — montre la destination avant les boutons
- Compteur d'analyses (freemium : 10/mois → upgrade)

---

### Out of Scope for MVP

| Feature                                  | Raison du report                                  |
| ---------------------------------------- | ------------------------------------------------- |
| Stockage cloud / sync multi-appareils    | Complexité HDS France, pas certifié RGPD pour MVP |
| Authentification compte utilisateur      | Dépend du cloud — sécurité iOS native suffit MVP  |
| Intégration logiciels médicaux (DPI)     | Complexité technique + standards variés par pays  |
| Gestion multi-praticiens / rôles         | Nécessite back-end cloud + permissions            |
| Interface patient (auto-suivi)           | Segment secondaire, post-validation               |
| Comparaison inter-patients               | Requiert cloud + base de données centralisée      |
| Analyse temps réel                       | Performance GPU, post-validation clinique         |
| Autres spécialités (kiné, médecin sport) | Post product-market fit orthopédistes             |

---

### MVP Success Criteria

Le MVP est validé et on passe à la Phase 2 si à M+3 :

- ✅ 15-20 praticiens actifs (≥ 1 analyse/semaine)
- ✅ Rétention M+1 > 50%
- ✅ North Star ≥ 3 analyses/semaine/praticien actif
- ✅ Zéro incident de confidentialité critique
- ✅ Premiers signaux qualitatifs d'intégration workflow
  ("j'utilise BodyOrthox sans y réfléchir")

---

### Future Vision (2-3 ans)

**Phase 2 — Extension verticale :**

- Stockage cloud + sync multi-appareils (avec conformité HDS)
- Authentification compte praticien
- Nouvelles spécialités : kinésithérapie, médecine du sport, podologie

**Phase 3 — Extension horizontale :**

- Marché international (multilangue, normes cliniques locales)
- Intégrations DPI / logiciels médicaux (HL7, FHIR)
- Plateforme multi-praticiens / cabinet / clinique
- Modèles ML spécialisés par pathologie (gonarthrose, PTH, etc.)

**Vision long terme :**
BodyOrthox devient la référence de l'analyse biomécanique clinique
accessible — "le stéthoscope numérique de l'orthopédiste" —
présent dans toutes les spécialités musculo-squelettiques,
sur tous les marchés, avec une précision validée cliniquement.
