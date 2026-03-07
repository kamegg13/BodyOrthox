---
stepsCompleted:
  [
    "step-01-init",
    "step-02-discovery",
    "step-02b-vision",
    "step-02c-executive-summary",
    "step-03-success",
    "step-04-journeys",
    "step-05-domain",
    "step-06-innovation",
    "step-07-project-type",
    "step-08-scoping",
    "step-09-functional",
    "step-10-nonfunctional",
    "step-11-polish",
  ]
classification:
  projectType: mobile_app
  domain: healthcare
  complexity: high
  projectContext: greenfield
inputDocuments:
  - "docs/planning-artifacts/product-brief-BodyOrthox-2026-03-03.md"
  - "docs/planning-artifacts/research/technical-bodyorthox-stack-research-2026-03-02.md"
  - "docs/brainstorming/brainstorming-session-2026-03-02-1930.md"
briefCount: 1
researchCount: 1
brainstormingCount: 1
projectDocsCount: 0
workflowType: "prd"
workflow_completed: true
completedDate: "2026-03-03"
---

# Product Requirements Document — BodyOrthox

**Auteur :** Karimmeguenni-tani
**Date :** 2026-03-03

## Résumé Exécutif

BodyOrthox est une application mobile iOS (Flutter) qui permet aux orthopédistes d'analyser objectivement la biomécanique de leurs patients — marche et course — en 30 secondes chrono, depuis n'importe quel cabinet, sans matériel dédié et sans formation technique. L'analyse (genou, hanche, cheville) s'exécute 100% on-device via Google ML Kit (97.2% PCK), sans transmission de données vidéo. Résultat : des angles articulaires cliniques, un rapport PDF auto-nommé exportable en 1 tap, un historique de progression patient — à ~39-49€/mois là où les concurrents (Kinetisense, Dartfish) facturent 3 000 à 15 000€/an avec matériel dédié.

**Persona principal :** Dr. Marc, orthopédiste libéral, ~42 ans. Sur 3 consultations, ~1 nécessite une analyse biomécanique. Pas de budget matériel, pas d'assistant technique. Il filme seul entre deux examens. Critère d'adoption : "ça marche la première fois, sans explication."

**Problème résolu :** Le marché offre soit "rien" (analyse visuelle subjective, non traçable) soit "trop cher + trop complexe" (matériel dédié, salle spécialisée, formation). Aucune solution intermédiaire accessible en cabinet libéral n'existe. BodyOrthox occupe ce vide.

### Ce Qui Rend BodyOrthox Unique

1. **100% On-Device** — Google ML Kit tourne entièrement sur l'iPhone. Aucune donnée vidéo ne quitte l'appareil. Conformité RGPD native sans effort additionnel.
2. **Portabilité absolue** — Zéro matériel, zéro installation, zéro salle dédiée. L'outil s'adapte au cabinet, pas l'inverse.
3. **Simplicité radicale** — Flux 4 taps, 30 secondes du démarrage au rapport. Le moment "aha" — voir les angles articulaires s'afficher sans rien avoir configuré — est le déclencheur d'adoption.
4. **Prix disruptif** — ~39-49€/mois vs 3-15k€/an. Perçu comme dépense de productivité, pas investissement matériel.
5. **Architecture ML évolutive** — Conçu pour absorber les modèles futurs (RTMPose, modèles pathologie-spécifiques) sans refonte architecturale.

**Insight timing :** Google ML Kit a atteint en 2025-2026 une précision cliniquement pertinente (97.2% PCK) — seuil non atteint en 2022-2023. La fenêtre d'opportunité est ouverte maintenant.

**Modèle économique :** Freemium — 10 analyses/mois gratuites → upgrade ~39-49€/mois. La limite est mensuelle (pas temporelle) : l'habitude précède le paiement.

### Classification Projet

| Dimension           | Valeur                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **Type de projet**  | Application mobile (iOS, Flutter)                                                                     |
| **Domaine**         | Santé / analyse clinique biomécanique                                                                 |
| **Complexité**      | Haute — médical réglementé, validation clinique, RGPD, responsabilité légale du rapport, ML on-device |
| **Contexte**        | Greenfield — nouveau produit from scratch                                                             |
| **Stack technique** | Flutter + Google ML Kit + Drift + SQLCipher (AES-256)                                                 |
| **Architecture**    | Locale-first MVP — zéro cloud, zéro contrainte HDS en Phase 1                                         |

## Critères de Succès

### Succès Utilisateur

| Métrique                 | Définition                                            | Cible                                          |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------- |
| **Rétention J+7**        | % utilisateurs qui ouvrent l'app dans la 1ère semaine | > 70%                                          |
| **Rétention M+1**        | % utilisateurs encore actifs après 30 jours           | > 50%                                          |
| **Fréquence d'usage**    | Analyses réalisées par praticien actif / semaine      | ≥ 3 analyses/semaine                           |
| **Habit lock**           | % praticiens utilisant l'app 3+ semaines consécutives | > 40% à M+2                                    |
| **Intégration workflow** | Praticien utilise l'app sans session d'apprentissage  | Qualitatif — détecté via support et entretiens |

**Définition "utilisateur converti" :** Praticien qui réalise 3+ analyses/semaine pendant 4 semaines consécutives — signal que BodyOrthox est entré dans son geste clinique naturel.

**North Star Metric :** Nombre d'analyses réalisées par praticien actif par semaine.

### Succès Business

| Horizon  | Objectif                                                        | Signal d'alarme        |
| -------- | --------------------------------------------------------------- | ---------------------- |
| **M+3**  | 15-20 praticiens actifs (≥ 1 analyse/semaine)                   | < 15 praticiens actifs |
| **M+6**  | Premier signal de conversion freemium → payant : 10% des actifs | 0 conversion           |
| **M+12** | 100 praticiens actifs (freemium + payant)                       | Stagnation > 2 mois    |

**Priorité absolue : rétention > acquisition.** Le churn M+1 > 50% est le signal d'alarme principal.

**Seuil de conversion :** 10 analyses/mois déclenche l'upgrade freemium → payant. Cible à M+6 : 10% des praticiens actifs.

### Succès Technique

| Critère                          | Cible                                            | Priorité       |
| -------------------------------- | ------------------------------------------------ | -------------- |
| **Temps d'analyse post-capture** | ~20 secondes (objectif) — < 30s dans 95% des cas | Haute          |
| **Taux d'échec ML**              | < 5% sur vidéos correctement filmées             | Critique       |
| **Précision angulaire**          | 97.2% PCK (ML Kit baseline)                      | Critique       |
| **Confidentialité**              | Zéro incident de fuite de données                | Non négociable |
| **Traitement on-device**         | 100% — aucune donnée vidéo transmise             | Non négociable |

### Validation MVP à M+3

Le MVP est validé si et seulement si :

- ✅ 15-20 praticiens actifs (≥ 1 analyse/semaine)
- ✅ Rétention M+1 > 50%
- ✅ North Star ≥ 3 analyses/semaine/praticien actif
- ✅ Taux d'échec ML < 5% en conditions terrain
- ✅ Zéro incident de confidentialité critique
- ✅ Premiers signaux qualitatifs d'intégration workflow

## Parcours Utilisateurs

### Journey 1 — Dr. Marc : Le Premier Résultat (Chemin Heureux)

**Persona :** Dr. Marc, 42 ans, orthopédiste libéral en cabinet solo. 3ème consultation de la matinée. Patient : Paul Martin, 67 ans, douleurs chroniques au genou gauche, démarche compensatoire probable.

**Scène d'ouverture :** Dr. Marc termine l'examen clinique. Il a une intuition sur la marche de Paul — une asymétrie de la flexion du genou — mais aucune donnée objective pour l'inscrire dans le dossier. Il sort son iPhone.

**Rising Action :**

- Il ouvre BodyOrthox (1 tap). L'écran n'a qu'un bouton : "Nouvelle analyse".
- Il tape le nom "Martin Paul" (2ème tap). L'app propose de filmer.
- Il positionne son iPhone : le cadre passe au vert fixe — bonne luminosité, bon angle de profil. "Filmez maintenant." (3ème tap)
- Paul marche 8 mètres dans le couloir. Dr. Marc filme. 12 secondes de vidéo.
- L'analyse démarre en arrière-plan pendant qu'il raccompagne Paul en salle d'attente. 20 secondes.

**Climax :** Il regarde son écran. Flexion genou gauche : 42°. Flexion genou droit : 67°. Plage normale pour 67 ans : 60-70°. L'asymétrie est objectivée. Il voit les angles superposés sur le replay image par image. Ce qu'il ressentait à l'œil nu est maintenant documenté, mesurable, traçable. _"Ça marche vraiment."_

**Résolution :** Il bascule sur la vue simple, appuie sur "Exporter" (4ème tap). AirDrop vers son Mac. Le fichier `Martin_Paul_AnalyseMarche_2026-03-03.pdf` atterrit sur le bureau de la secrétaire. Total : 30 secondes de son temps médical.

**Capacités révélées :** Flux 4 taps, capture guidée (cadre visuel + luminosité), analyse post-capture ~20s, vue annotation expert, export 1 tap, nommage automatique PDF.

---

### Journey 2 — Dr. Marc : La Capture Difficile + Upgrade (Cas Limite)

**Scène d'ouverture :** Fin de journée. Salle de consultation secondaire — luminosité artificielle faible, néons jaunes. Patient en survêtement sombre.

**Rising Action :**

- Il positionne l'iPhone. Le cadre passe en orange : "Luminosité insuffisante — activez la lumière ambiante ou déplacez le patient."
- Il allume le plafonnier de secours. Le cadre repasse au vert. Il filme.
- L'analyse tourne. Résultat : détection partielle de la cheville gauche — vêtements trop larges. L'app affiche : "Confiance faible sur cheville gauche — données partielles. Correction manuelle disponible."
- Il ajuste manuellement le point articulaire sur le replay. Le rapport est généré avec disclaimer : _"Données cheville gauche : estimées — vérification manuelle effectuée."_

**Climax — Upgrade :** Il veut exporter. L'app affiche : "10/10 analyses ce mois — limite freemium atteinte. Continuer avec BodyOrthox Pro : 39€/mois." Il voit son historique : 10 analyses en 3 semaines. L'app a fonctionné. Il tape "S'abonner". 2 taps. Face ID. C'est fait.

**Résolution :** L'export se déroule normalement. Dr. Marc a upgradé non pas parce qu'on lui a demandé, mais parce qu'il avait déjà la preuve que ça valait la dépense.

**Capacités révélées :** Détection luminosité, détection confiance ML, correction manuelle, disclaimer rapport, compteur freemium, écran d'upgrade contextuel, In-App Purchase iOS.

---

### Journey 3 — Marie, la Secrétaire : Le PDF Parfait

**Persona :** Marie, 38 ans, secrétaire médicale du cabinet de Dr. Marc. Elle gère 20-30 dossiers patients par semaine. Elle n'a jamais vu l'app BodyOrthox.

**Scène d'ouverture :** 11h47. Notification AirDrop : _"Martin_Paul_AnalyseMarche_2026-03-03.pdf reçu de iPhone de Dr. Marc."_ Elle clique "Accepter".

**Rising Action :**

- Le fichier s'ouvre : 2 pages, en-tête cabinet, nom patient, date, angles articulaires avec visuels, section interprétation, signature numérique Dr. Marc.
- Le nom du fichier est déjà au bon format : glissé directement dans le dossier patient de son logiciel médical.
- Elle prépare l'email patient : joint le PDF, envoie.

**Climax :** Elle réalise qu'elle n'a rien eu à renommer, rien à reformater, rien à demander au médecin.

**Résolution :** En 3 semaines, 10 PDFs de Dr. Marc. Chaque fois : même format, même nommage. Elle n'a jamais rappelé le médecin pour une correction. Elle mentionne l'outil à son amie secrétaire dans un autre cabinet.

**Capacités révélées :** Nommage automatique `NomPatient_AnalyseMarche_DATE.pdf`, format PDF structuré 2 pages, lisibilité desktop, partage AirDrop/email natif.

---

### Journey 4 — Fatima : Comprendre Son Corps

**Persona :** Fatima, 58 ans, patiente de Dr. Marc. Gonarthrose débutante genou droit. Elle ne comprend pas pourquoi elle boite.

**Scène d'ouverture :** Dr. Marc lui montre l'écran de son iPhone après l'analyse. Deux silhouettes côte à côte : sa marche, une marche de référence pour son âge. L'écart est visible à l'œil nu, sans lire un seul chiffre.

**Rising Action :**

- Il lui pointe la cheville droite sur le replay : "Vous voyez, ici, votre cheville compense — 18° au lieu de 25°. C'est pour ça que votre hanche fatigue."
- Fatima voit. Pour la première fois, elle comprend pourquoi elle est fatiguée après 20 minutes de marche.
- Elle reçoit le PDF le soir par email. Page 2 : _"Votre cheville droite absorbe moins le choc qu'attendu pour votre profil. Cela entraîne un effort supplémentaire sur votre hanche et votre dos."_ Elle comprend. Elle montre le rapport à son kinésithérapeute le lendemain.

**Résolution :** Le kiné lit le rapport en 30 secondes, comprend l'analyse de Dr. Marc, adapte sa séance. Médecin et kiné parlent avec le même document objectif.

**Capacités révélées :** Rapport 2 niveaux (médecin / patient), section langage naturel, visualisation comparative silhouette, export email.

## Exigences Réglementaires & Domaine

### EU MDR 2017/745 — Positionnement "Outil de Documentation"

BodyOrthox se positionne explicitement comme un **outil de documentation clinique**, non comme un dispositif médical de diagnostic. Ce positionnement exclut l'obligation de marquage CE pour le MVP.

Conséquences obligatoires :

- Disclaimer permanent sur chaque rapport : _"BodyOrthox est un outil de documentation clinique. Les données produites ne constituent pas un acte de diagnostic médical et ne se substituent pas au jugement clinique du praticien."_
- Formulations UI **autorisées** : "documenter", "mesurer", "objectiver", "tracer", "enregistrer"
- Formulations UI **interdites** : "diagnostiquer", "détecter", "identifier la pathologie", "analyser cliniquement"
- Review marketing obligatoire avant toute communication externe
- Consultation réglementaire DM recommandée avant passage au plan payant au-delà de 100 utilisateurs

### RGPD — Conforme par Architecture

L'architecture locale-first rend BodyOrthox RGPD-conforme nativement :

- Zéro transmission de données vidéo → pas de traitement de données de santé sur serveur
- Stockage local uniquement (Drift + SQLCipher AES-256) → données sous contrôle exclusif du praticien
- Script de réassurance patient avant capture : _"Cette vidéo est analysée localement sur cet appareil. Elle n'est pas transmise ni stockée sur un serveur externe."_
- Suppression vidéo brute proposée après analyse

### HDS — Non Applicable MVP

L'architecture locale-first élimine toute contrainte HDS. Aucun hébergement de données de santé sur infrastructure cloud → aucune certification HDS requise. À traiter en Phase 2 lors de l'introduction du stockage cloud.

### Contraintes Techniques Réglementaires

| Contrainte                      | Exigence                              | Implémentation                                   |
| ------------------------------- | ------------------------------------- | ------------------------------------------------ |
| **Chiffrement données locales** | AES-256 obligatoire                   | Drift + SQLCipher                                |
| **Accès sécurisé**              | Biométrie iOS native                  | Face ID / Touch ID — pas d'auth propriétaire     |
| **Isolation données vidéo**     | Vidéo brute jamais persistée en clair | Traitement en mémoire → suppression post-analyse |
| **Disclaimer rapport**          | Visible sur chaque export PDF         | Pied de page permanent, non modifiable           |
| **Traçabilité**                 | Horodatage de chaque analyse          | Métadonnées stockées localement en Drift         |

### Watchlist Requalification DM

Si le marketing dérive vers un champ sémantique "diagnostic", BodyOrthox peut être requalifié dispositif médical → marquage CE obligatoire.

- **Audit réglementaire** recommandé à M+6 si > 50 praticiens actifs et/ou lever de fonds
- **Watchlist évolution :** ajout de modèles ML pathologie-spécifiques (gonarthrose, PTH…) → requalification DM probable → anticiper marquage CE 18 mois avant

### Intégration

**MVP :** Zéro intégration logicielle. Export PDF uniquement via share sheet iOS natif (AirDrop, email, autres apps).

**Post-MVP :** Intégration DPI/logiciels médicaux (Doctolib, Medistory, etc.) via export HL7/FHIR — à traiter après validation product-market fit.

## Innovation & Différenciation

### Patterns d'Innovation Identifiés

**Innovation #1 — On-Device ML Clinique**

Appliquer l'analyse biomécanique via ML embarqué dans un workflow médical opérationnel, à destination de praticiens libéraux, sans infrastructure, à moins de 50€/mois — c'est un premier. La combinaison `Google ML Kit (97.2% PCK) + Flutter + workflow 4 taps` crée une expérience sans équivalent dans ce segment de prix.

**Innovation #2 — RGPD by Architecture**

La plupart des solutions healthtech gèrent le RGPD comme une contrainte à résoudre (DPO, hébergement certifié, audits). BodyOrthox inverse le modèle : l'architecture locale-first rend la conformité RGPD structurellement garantie. La confidentialité devient argument marketing, pas coût de conformité.

**Innovation #3 — Blue Ocean Market Gap**

Le marché médical de l'analyse biomécanique est binaire : "rien d'accessible" vs "trop cher + trop complexe". BodyOrthox crée une catégorie inexistante : l'analyse clinique portable, opérable par le praticien seul, en 30 secondes. Positionnement Blue Ocean, pas amélioration incrémentale.

**Innovation #4 — Architecture ML Évolutive**

Le moteur ML est découplé du reste de l'application. Lorsque des modèles plus précis (RTMPose, modèles pathologie-spécifiques) seront disponibles, ils s'intègrent sans refonte de l'UX ni de l'architecture de données.

### Paysage Concurrentiel

| Segment           | Solution                     | Prix                | Friction                                             |
| ----------------- | ---------------------------- | ------------------- | ---------------------------------------------------- |
| **Haut de gamme** | Kinetisense, Dartfish, Vicon | 3k-15k€/an          | Matériel dédié, formation, salle spécialisée         |
| **Recherche**     | OpenPose, MMPose, RTMPose    | Gratuit/open source | Expertise technique requise, pas de workflow médical |
| **BodyOrthox**    | ML Kit + Flutter             | ~39-49€/mois        | Zéro — juste l'iPhone du praticien                   |

### Validation des Innovations

| Innovation             | Signal de validation                                       | Horizon                  |
| ---------------------- | ---------------------------------------------------------- | ------------------------ |
| On-device ML clinique  | Taux d'échec ML < 5% sur 100 vidéos terrain réelles        | Semaine 1-2 avant launch |
| RGPD by architecture   | Revue technique par un DPO sur l'architecture (1 heure)    | Avant TestFlight         |
| Market gap             | 3 praticiens early-adopters utilisent l'app sans formation | Semaine 1 post-launch    |
| Architecture évolutive | Swap de modèle ML réalisé en < 1 jour dev                  | Test interne Sprint 1    |

### Risques Innovation

| Risque                                             | Probabilité        | Mitigation                                                                     |
| -------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| ML Kit insuffisant en conditions terrain réelles   | Moyen              | Tests sur 50+ vidéos avant launch (luminosité variable, morphologies diverses) |
| Grand acteur copie le concept                      | Faible à 12 mois   | Avance terrain + adoption praticiens = moat relationnel                        |
| Modèle ML plus précis rend ML Kit obsolète         | Faible court terme | Architecture découplée → swap sans refonte                                     |
| Requalification DM si précision > seuil diagnostic | Moyen à 24 mois    | Positionnement "documentation" + audit réglementaire à M+6                     |

## Spécificités Mobile iOS

### Overview Plateforme

BodyOrthox est une application iOS universelle (iPhone + iPad), développée en Flutter avec le renderer Impeller. Distribution MVP via TestFlight uniquement — aucune soumission App Store pour la phase early-adopter. Cible : iOS 16+. Android hors scope MVP.

### Spécifications Plateforme

| Dimension                | Spécification                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Plateforme cible MVP** | iOS uniquement (iPhone + iPad)                                                               |
| **iOS minimum**          | iOS 16+ (Impeller stable, ML Kit performant)                                                 |
| **Framework**            | Flutter 3.x + Impeller renderer                                                              |
| **Appareils**            | iPhone (12 et supérieur recommandé) + iPad (toutes tailles)                                  |
| **Android**              | Post-MVP — architecture Flutter facilite le portage                                          |
| **Distribution MVP**     | TestFlight (jusqu'à 10 000 testeurs, 0 review App Store)                                     |
| **App Store**            | Décision différée — catégorie (Medical vs Productivity) à trancher avant soumission publique |

**Layout adaptatif :** iPhone portrait (mode consultation debout) + iPad landscape (mode bureau). Flux de capture optimisé iPhone — sur iPad, la caméra arrière est utilisée de la même façon.

### Permissions Système

| Permission              | Usage                                          | Obligatoire                                |
| ----------------------- | ---------------------------------------------- | ------------------------------------------ |
| **Camera**              | Capture vidéo de la marche patient             | Oui — sans caméra, l'app ne fonctionne pas |
| **Face ID / Touch ID**  | Accès sécurisé à l'app et aux données patient  | Oui                                        |
| **Local Notifications** | Notification "Analyse prête" post-traitement   | Oui                                        |
| **Photo Library**       | Non requis — partage via share sheet iOS natif | Non                                        |
| **Microphone**          | Non requis                                     | Non                                        |
| **Réseau**              | Non requis MVP — architecture locale-first     | Non                                        |

**Stratégie :** Permissions demandées au moment contextuel, pas au démarrage. La permission caméra est demandée au premier lancement d'une analyse, avec explication en contexte.

### Mode Offline

BodyOrthox est **100% offline par design**. Aucune connexion internet n'est requise à aucun moment du workflow MVP.

- Données stockées localement : Drift + SQLCipher (AES-256)
- Modèles ML embarqués : Google ML Kit — bundlés dans l'app (pas de téléchargement runtime)
- Export PDF : généré localement, partagé via share sheet iOS
- Taille app estimée : ~80-120 MB (modèle ML Kit ~40-60 MB inclus)

### Notifications Locales

**Notifications locales uniquement** — pas de serveur push, pas de backend APNs.

| Notification      | Déclencheur                       | Format                                               |
| ----------------- | --------------------------------- | ---------------------------------------------------- |
| **Analyse prête** | Fin du traitement ML post-capture | "L'analyse de [Nom Patient] est prête — 23°/67°/41°" |

Implémentation : `flutter_local_notifications`.

### Distribution & Store Compliance

**Phase MVP (TestFlight) :**

- Distribution directe aux early-adopters via lien TestFlight
- Limite : 90 jours par build, renouvellement simple
- Idéal pour les 15-20 praticiens pilotes

**Pré-requis App Store (à préparer pour M+6) :**

- Privacy Nutrition Labels : déclarer les données collectées
- App Privacy Policy URL obligatoire
- Choix catégorie : `Medical` vs `Productivity` — décision avec conseil réglementaire
- Screenshots : personas fictifs, pas de vrais patients

### Considérations d'Implémentation

- **Impeller** activé par défaut sur iOS 16+ — 58-60 FPS garantis pour les animations
- **Background processing** : ML Kit analysis lancée en `isolate` Flutter pour ne pas bloquer l'UI
- **Universal layout** : `LayoutBuilder` + breakpoints pour iPhone compact / iPad regular
- **Biometric auth** : `local_auth` package
- **In-App Purchase** : `purchases_flutter` (RevenueCat)

## MVP Scope & Roadmap

### Philosophie MVP

**Approche : Experience MVP**

L'objectif du MVP n'est pas de valider un concept — c'est de prouver que l'expérience complète est réalisable : 30 secondes, zéro friction, résultat cliniquement pertinent. La différenciation de BodyOrthox est dans l'expérience, pas dans le volume de features. Un flux 4 taps parfaitement exécuté bat 10 features moyennement polies.

**Ressources :** Solo developer + Claude Code. Multiplicateur de vélocité significatif, mais discipline de scope critique — chaque feature ajoutée est une feature à maintenir, tester et debugger seul.

**Règle directrice :** _"Si une feature n'est pas dans Journey 1 (chemin heureux de Dr. Marc), elle n'est pas dans le MVP v1."_

**Objectif :** v1.0 TestFlight en 8-12 semaines.

### Features MVP — Priorités

| Priorité | Feature                                              | Rationale                     |
| -------- | ---------------------------------------------------- | ----------------------------- |
| 🔴 P0    | Flux 4 taps (patient → filmer → résultat → exporter) | Sans ça, l'app n'existe pas   |
| 🔴 P0    | Analyse on-device ML Kit (genou, hanche, cheville)   | Core value proposition        |
| 🔴 P0    | Affichage angles + normes de référence               | Résultat cliniquement lisible |
| 🔴 P0    | Export PDF nommé automatiquement                     | Workflow secrétaire           |
| 🔴 P0    | Capture guidée (cadre visuel + détection luminosité) | Qualité données ML            |
| 🟠 P1    | Gestion patients + historique local                  | Contexte clinique             |
| 🟠 P1    | Face ID / Touch ID (accès sécurisé)                  | RGPD + confiance              |
| 🟠 P1    | Script réassurance RGPD avant capture                | Legal + confiance patient     |
| 🟠 P1    | Compteur freemium + upgrade In-App Purchase          | Modèle économique             |
| 🟠 P1    | Notification locale "Analyse prête"                  | UX arrière-plan               |
| 🟡 P2    | Vue annotation expert (replay + angles superposés)   | Valeur ajoutée praticien      |
| 🟡 P2    | Onboarding wizard 3 écrans                           | Adoption J+1                  |
| 🟡 P2    | Timeline progression clinique patient                | Rétention long terme          |
| 🟡 P2    | Interface deux niveaux (simple / expert)             | Réduction charge cognitive    |

**À reporter en v1.1 si contrainte de temps :**

- Section rapport langage patient (Journey 4)
- Visualisation comparative silhouette
- Correction manuelle points articulaires

### Roadmap Post-MVP

**Phase 2 — Growth (M+6 à M+12)**

| Feature                                 | Déclencheur                    | Complexité                 |
| --------------------------------------- | ------------------------------ | -------------------------- |
| Stockage cloud + sync multi-appareils   | Demande praticiens multi-sites | Haute (HDS)                |
| Authentification compte praticien       | Pré-requis cloud               | Haute                      |
| Rapport patient langage naturel         | Feedback early-adopters        | Faible                     |
| QR Code rapport (pont mobile → desktop) | Feedback secrétaires           | Faible                     |
| Support Android                         | Signal marché                  | Moyenne (Flutter facilite) |
| App Store public                        | > 50 praticiens actifs         | Administrative             |

**Phase 3 — Expansion (M+12+)**

| Feature                                              | Condition                           |
| ---------------------------------------------------- | ----------------------------------- |
| Nouvelles spécialités (kiné, médecine du sport)      | PMF orthopédistes validé            |
| Modèles ML pathologie-spécifiques (gonarthrose, PTH) | Marquage CE DM probable → anticiper |
| Intégration DPI / HL7-FHIR                           | Demande institutionnelle            |
| Marché international                                 | Après 100 praticiens actifs France  |
| Analyse temps réel                                   | Modèles ML suffisamment légers      |

### Mitigation des Risques

**Risque Technique — ML Kit en conditions réelles**

- Mitigation : 50+ vidéos terrain avant premier TestFlight (luminosité variable, morphologies diverses)
- Fallback : mode correction manuelle si confiance ML < seuil

**Risque Marché — Adoption praticiens**

- Mitigation : 3 orthopédistes early-adopters identifiés avant dev — feedback hebdomadaire
- Signal d'alarme : si après 2 semaines TestFlight aucun praticien n'a réalisé 3+ analyses → pivot UX immédiat

**Risque Solo Dev — Scope creep**

- Règle stricte : P0 d'abord, P1 ensuite, P2 si le temps le permet
- Claude Code comme force multiplicatrice : génération de code, tests, refacto

## Exigences Fonctionnelles

### Gestion Patients

- **FR1 :** Le praticien peut créer un profil patient (nom, date de naissance, profil morphologique)
- **FR2 :** Le praticien peut consulter la liste de ses patients existants
- **FR3 :** Le praticien peut sélectionner un patient existant pour lancer une nouvelle analyse
- **FR4 :** Le praticien peut consulter l'historique complet des analyses d'un patient
- **FR5 :** Le praticien peut visualiser la progression clinique d'un patient dans le temps (timeline)
- **FR6 :** Le praticien peut supprimer un patient et toutes ses données associées

### Capture & Guidage

- **FR7 :** Le praticien peut lancer une session de capture vidéo depuis l'interface patient
- **FR8 :** L'app fournit un cadre visuel temps réel indiquant si le cadrage est correct pour l'analyse
- **FR9 :** L'app détecte la luminosité ambiante et alerte le praticien si elle est insuffisante
- **FR10 :** L'app guide le praticien pour positionner le patient en vue de profil strict
- **FR11 :** Le praticien peut arrêter la capture et relancer une nouvelle prise sans quitter le flux
- **FR12 :** L'app affiche un script de réassurance RGPD à lire au patient avant toute capture

### Analyse ML On-Device

- **FR13 :** L'app analyse la vidéo capturée pour extraire les angles articulaires (genou, hanche, cheville) entièrement sur l'appareil, sans transmission de données
- **FR14 :** L'app traite l'analyse en arrière-plan et notifie le praticien à la fin du traitement
- **FR15 :** L'app affiche les angles articulaires mesurés avec les plages de référence normatives par âge et profil
- **FR16 :** L'app évalue et communique le niveau de confiance de chaque mesure articulaire
- **FR17 :** Le praticien peut ajuster manuellement un point articulaire si la confiance ML est insuffisante
- **FR18 :** Le praticien peut visualiser un replay image par image avec les angles superposés sur la vidéo
- **FR19 :** L'app supprime automatiquement la vidéo brute après analyse et propose la confirmation au praticien

### Rapport & Export

- **FR20 :** L'app génère un rapport PDF structuré à partir des données d'analyse
- **FR21 :** Le rapport est nommé automatiquement selon la convention `NomPatient_AnalyseMarche_DATE.pdf`
- **FR22 :** Le rapport inclut un disclaimer légal permanent non modifiable sur chaque page
- **FR23 :** Le rapport présente les données en deux niveaux : vue simplifiée (praticien) et vue détaillée (données brutes)
- **FR24 :** Le praticien peut exporter le rapport en un tap via le share sheet iOS natif (AirDrop, email, autres apps)
- **FR25 :** Le rapport inclut les métadonnées de la session : date, patient, appareil utilisé, niveau de confiance ML

### Sécurité & Confidentialité

- **FR26 :** L'accès à l'app est protégé par biométrie iOS (Face ID ou Touch ID)
- **FR27 :** Toutes les données patients sont chiffrées localement avec AES-256
- **FR28 :** Aucune donnée vidéo ou patient n'est transmise vers un serveur externe
- **FR29 :** L'app fonctionne intégralement sans connexion réseau
- **FR30 :** Chaque analyse est horodatée et traçable localement

### Monétisation & Accès

- **FR31 :** Le praticien dispose d'un quota de 10 analyses gratuites par mois (freemium)
- **FR32 :** L'app affiche le compteur d'analyses restantes de manière visible
- **FR33 :** L'app présente une offre d'upgrade contextuelle lorsque le quota freemium est atteint
- **FR34 :** Le praticien peut souscrire à un abonnement mensuel via In-App Purchase iOS
- **FR35 :** Le praticien peut gérer et annuler son abonnement via les réglages iOS natifs

### Onboarding & Expérience Utilisateur

- **FR36 :** L'app présente un wizard d'onboarding motivationnel (3 écrans maximum) au premier lancement, montrant le résultat final avant les instructions
- **FR37 :** L'app demande les permissions système (caméra, notifications) au moment contextuel, avec explication en contexte
- **FR38 :** Le praticien peut basculer entre la vue simplifiée et la vue experte dans les résultats d'analyse
- **FR39 :** L'app s'adapte aux formats iPhone (portrait) et iPad (portrait et landscape)
- **FR40 :** L'app envoie une notification locale lorsqu'une analyse post-capture est terminée

## Exigences Non-Fonctionnelles

### Performance

| NFR        | Critère                      | Mesure                                                              |
| ---------- | ---------------------------- | ------------------------------------------------------------------- |
| **NFR-P1** | Temps d'analyse post-capture | < 30 secondes dans 95% des cas — objectif ~20s                      |
| **NFR-P2** | Fluidité interface           | ≥ 58 FPS constant sur iPhone 12+ (Impeller activé)                  |
| **NFR-P3** | Démarrage application        | < 3 secondes cold start sur iPhone 12+                              |
| **NFR-P4** | Génération rapport PDF       | < 5 secondes après validation de l'analyse                          |
| **NFR-P5** | Réactivité UI capture        | Cadre visuel et détection luminosité en temps réel, latence < 100ms |
| **NFR-P6** | Chargement liste patients    | < 1 seconde pour 500 patients stockés localement                    |

**Contexte :** Les ~20 secondes sont un objectif motivationnel — permettre d'analyser pendant que le praticien parle au patient. Seuil d'alerte : 30 secondes.

### Sécurité

| NFR        | Critère                      | Implémentation                                                                                       |
| ---------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| **NFR-S1** | Chiffrement données au repos | AES-256 (SQLCipher) pour toutes les données Drift — aucune donnée patient en clair                   |
| **NFR-S2** | Authentification             | Biométrie iOS obligatoire (Face ID / Touch ID) à chaque ouverture de session                         |
| **NFR-S3** | Isolation réseau             | Zéro requête réseau sortante lors d'une analyse — testable par inspection trafic                     |
| **NFR-S4** | Clé de chiffrement           | Dérivée du Keychain iOS — jamais exposée en mémoire persistante                                      |
| **NFR-S5** | Vidéo brute                  | Traitée en mémoire uniquement — jamais écrite sur disque non chiffrée                                |
| **NFR-S6** | Conformité RGPD              | L'architecture locale-first garantit structurellement l'absence de transfert de données personnelles |

### Fiabilité

| NFR        | Critère                | Seuil                                                                                   |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------- |
| **NFR-R1** | Taux de crash          | < 0.1% par session utilisateur                                                          |
| **NFR-R2** | Atomicité de l'analyse | Si l'analyse échoue, aucune donnée corrompue n'est persistée — état de la base inchangé |
| **NFR-R3** | Durabilité des données | Les données patients survivent à un crash app, redémarrage appareil, ou mise à jour iOS |
| **NFR-R4** | Taux d'échec ML        | < 5% sur vidéos correctement filmées (conditions terrain normales)                      |
| **NFR-R5** | Cohérence des données  | Aucune analyse partielle stockée — une analyse est soit complète, soit absente          |

### Capacité Locale

| NFR        | Critère            | Seuil                                                                    |
| ---------- | ------------------ | ------------------------------------------------------------------------ |
| **NFR-C1** | Volume patients    | Support de 500+ patients sans dégradation de performance                 |
| **NFR-C2** | Volume analyses    | Support de 5 000+ analyses stockées sans dégradation                     |
| **NFR-C3** | Empreinte stockage | Base de données locale < 500 MB pour 5 000 analyses (hors vidéos brutes) |
| **NFR-C4** | Taille application | App bundle < 150 MB (modèle ML Kit inclus)                               |
