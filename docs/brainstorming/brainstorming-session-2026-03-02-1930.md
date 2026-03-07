---
stepsCompleted: [1, 2, 3, 4]
session_active: false
workflow_completed: true
inputDocuments: []
session_topic: "BodyOrthox — Application mobile MVP pour orthopédistes : analyse de marche par vidéo smartphone, calcul des angles articulaires (MediaPipe), génération de rapport médical"
session_goals: "Définir le flux utilisateur idéal, prioriser le MVP vs post-MVP, identifier les points de friction (guidage caméra, qualité vidéo, affichage résultats), formuler la proposition de valeur praticien"
selected_approach: "ai-recommended"
techniques_used: ["Question Storming", "Role Playing", "SCAMPER Method"]
ideas_generated: []
context_file: ""
---

# Brainstorming Session Results

**Facilitateur :** Karimmeguenni-tani
**Date :** 2026-03-02

## Session Overview

**Sujet :** BodyOrthox — Application mobile MVP pour orthopédistes : analyse de marche par vidéo smartphone, calcul automatique des angles articulaires (genou, hanche, cheville) via MediaPipe, génération de rapport médical pour dossier patient.

**Objectifs :**

1. Définir le flux utilisateur idéal (création patient → rapport)
2. Prioriser les fonctionnalités MVP vs post-MVP
3. Identifier les points de friction critiques (guidage caméra, qualité vidéo, affichage résultats en cabinet)
4. Formuler une proposition de valeur convaincante pour l'adoption quotidienne par les praticiens

**Défi central :** Concevoir une expérience simple et fiable pour un praticien en cabinet, avec un budget minimal.

## Sélection des Techniques

**Approche :** Techniques recommandées par l'IA
**Contexte d'analyse :** Application médicale MVP — mix résolution de problèmes + stratégie + validation de valeur

**Techniques sélectionnées :**

- **Question Storming** (Deep) : Générer toutes les questions à se poser avant toute solution — révèle les zones d'incertitude sur le workflow praticien
- **Role Playing** (Collaborative) : Explorer les perspectives de chaque partie prenante (orthopédiste, patient, secrétaire) — ancre l'idéation dans la réalité terrain
- **SCAMPER Method** (Structured) : 7 lentilles systématiques appliquées aux fonctionnalités — décision MVP vs post-MVP rigoureuse

**Rationale IA :** Séquence conçue pour diagnostiquer le vrai problème → empathie terrain → décision MVP rigoureuse. Adapté au domaine médical formel avec contraintes techniques et budget limité.

## Technique 1 — Question Storming

**Questions générées (~29) :**

### Workflow praticien

- [Q#1] Quel est le workflow exact d'utilisation en consultation ?
- [Q#2] Comment va-t-il physiquement interagir avec l'app ?
- [Q#3] Quelles informations cliniques lui apporte l'analyse ?
- [Q#4] L'app est-elle suffisamment simple pour un praticien non-tech ?
- [Q#5] Pourquoi l'utiliser plutôt que ses méthodes actuelles ?
- [Q#6] Quel est son avantage concurrentiel réel ?
- [Q#7] Combien de temps a-t-il par consultation pour faire l'analyse ?
- [Q#8] Le patient est-il debout ? en mouvement ? dans une salle dédiée ?
- [Q#9] Qui filme — lui, l'assistant, le patient seul ?
- [Q#10] Que fait-il de son téléphone pendant qu'il parle au patient ?

### Valeur clinique

- [Q#11] Est-ce que l'orthopédiste fait déjà cette analyse aujourd'hui ? Comment ?
- [Q#12] Quelle précision angulaire est médicalement utile vs juste "impressionnante" ?
- [Q#13] Le rapport remplace-t-il quelque chose, ou s'ajoute-t-il à la charge ?

### Adoption

- [Q#14] A-t-il déjà un logiciel de dossier médical — et comment BodyOrthox s'y intègre-t-il ?
- [Q#15] Fera-t-il confiance à une IA pour des données qui vont dans un dossier médical ?
- [Q#16] Qui lui a recommandé l'outil — un confrère ? un commercial ? une publication ?

### Fiabilité technique

- [Q#17] L'analyse est-elle cliniquement pertinente pour la décision médicale ?
- [Q#18] Le modèle MediaPipe fonctionnera-t-il dans les conditions réelles d'un cabinet ?
- [Q#19] Quelle est la différence entre un angle "correct" et un angle "utile cliniquement" ?
- [Q#20] Qui valide que les angles calculés correspondent à ce qu'un orthopédiste mesure manuellement ?
- [Q#21] Existe-t-il des normes médicales de référence pour la mesure de marche ?
- [Q#22] Le praticien fera-t-il confiance à un résultat sans comprendre comment il est calculé ?
- [Q#23] Un seul passage de marche suffit-il, ou faut-il plusieurs prises ?
- [Q#24] Quelle luminosité y a-t-il typiquement dans un cabinet d'orthopédie ?
- [Q#25] Le patient peut-il marcher librement, ou l'espace est-il limité ?
- [Q#26] MediaPipe fonctionne-t-il aussi bien sur un patient en vêtements larges ? avec une prothèse ?
- [Q#27] Que se passe-t-il si la vidéo est floue, trop rapide, mal cadrée ?
- [Q#28] Qui est responsable si l'analyse est fausse et influence une décision médicale ?

### Le rapport

- [Q#29] À quoi ressemble-t-il ? Qui l'a défini — le médecin ou le développeur ?
- [Q#30] Qui d'autre que le praticien va lire ce rapport ?
- [Q#31] Où va-t-il — imprimé, PDF, directement dans le logiciel médical ?
- [Q#32] Que se passe-t-il si le patient conteste les résultats ?
- [Q#33] Ce rapport a-t-il une valeur légale ?

**Zones d'incertitude critiques révélées :** workflow praticien, conditions terrain du cabinet, fiabilité clinique, responsabilité légale du rapport
**Question la plus inconfortable :** _"Qui est responsable si l'analyse est fausse et influence une décision médicale ?"_
**Thème sous-jacent :** La confiance — praticien envers l'IA, patient envers le rapport, système légal envers le document

## Technique 2 — Role Playing

### Persona 1 — Dr. Martin, orthopédiste 47 ans

**[UX#1] : Le Bouton Unique de Démarrage**
_Concept_ : L'écran d'accueil n'a qu'une seule action visible : "Nouvelle analyse". Zéro menu, zéro configuration préalable. Dr. Martin arrive, tape une fois, filme.
_Nouveauté_ : La plupart des apps médicales surchargent l'écran d'accueil. Ici, l'app s'efface derrière l'acte médical.

**[UX#2] : Le Wizard de Première Consultation**
_Concept_ : Un onboarding en 3 écrans maximum, déclenché uniquement à la première utilisation. Chaque écran montre une vraie valeur ("Voici ce que vous obtiendrez") plutôt qu'une instruction.
_Nouveauté_ : L'onboarding est motivationnel, pas instructionnel — il vend la vision avant de montrer les boutons.

**[UX#3] : L'Analyse Silencieuse**
_Concept_ : Le traitement se fait en arrière-plan pendant que le Dr. parle au patient. Une notification discrète signale que le rapport est prêt.
_Nouveauté_ : Transforme un temps d'attente en temps médical utile, réduit la pression sur la vitesse de traitement.

**[UX#4] : La Vue Annotation Expert**
_Concept_ : En un tap sur le rapport, Dr. Martin bascule vers une vue vidéo image par image avec les angles superposés en temps réel. Il peut pointer l'écran au patient.
_Nouveauté_ : Transforme un rapport statique en outil de communication patient-praticien.

**[UX#5] : Le Replay Annoté**
_Concept_ : Dr. Martin peut dessiner directement sur la frame vidéo — cercler une articulation, tracer une flèche — et ces annotations sont sauvegardées dans le rapport.
_Nouveauté_ : Les annotations du médecin deviennent de la donnée clinique, pas juste des gestes dans l'air.

**[UX#6] : L'Autorité Par La Comparaison**
_Concept_ : L'app affiche en parallèle : l'angle mesuré du patient vs la plage de référence clinique normale pour son âge/profil.
_Nouveauté_ : Le praticien dispose du contexte normatif qui légitime son diagnostic aux yeux du patient.

### Persona 2 — Fatima, patiente 58 ans

**[UX#7] : Le Rapport Patient**
_Concept_ : Un export simplifié en langage non-médical que le patient peut recevoir sur son téléphone. "Votre marche — expliquée simplement."
_Nouveauté_ : Crée une boucle de valeur entre médecin et patient — renforce la relation thérapeutique.

**[UX#8] : Le Script de Réassurance Intégré**
_Concept_ : Avant la capture, l'app affiche une phrase humaine que le Dr. lit au patient : "Cette vidéo est analysée localement, elle n'est pas stockée ni partagée."
_Nouveauté_ : L'app scripte le moment de confiance, déchargeant le praticien d'improviser son explication.

**[UX#9] : La Promesse de Suppression**
_Concept_ : L'app propose de supprimer la vidéo brute après analyse. Un indicateur confirme : "Vidéo supprimée — seules les données analytiques sont conservées."
_Nouveauté_ : Transforme une contrainte RGPD en argument de confiance actif.

**[UX#10] : La Valeur Visible Immédiate**
_Concept_ : Pendant que le patient marche, l'app lui montre ses points articulaires se dessiner en temps réel — un miroir augmenté.
_Nouveauté_ : Retourne l'expérience de surveillance en expérience de révélation.

**[UX#11] : Analyse 100% On-Device**
_Concept_ : MediaPipe tourne entièrement sur le smartphone, sans envoyer la vidéo vers un serveur.
_Nouveauté_ : Dans un contexte médical RGPD-sensible, le traitement local est la proposition de valeur centrale.

**[UX#12] : La Traduction Analogique**
_Concept_ : À côté de chaque angle mesuré, une silhouette humaine montre le mouvement normal vs le mouvement du patient, sans chiffres.
_Nouveauté_ : Les données deviennent une histoire visuelle que le patient comprend immédiatement.

### Persona 3 — La secrétaire médicale

**[UX#13] : L'Export En Un Tap**
_Concept_ : Un bouton unique génère un PDF structuré partageable directement par email, AirDrop ou lien — sans compte ni portail.
_Nouveauté_ : Le rapport voyage dans le workflow existant de la secrétaire, pas l'inverse.

**[UX#14] : Le Nommage Automatique**
_Concept_ : Le PDF est nommé automatiquement `NomPatient_AnalyseMarche_2026-03-02.pdf` — prêt à classer sans renommage manuel.
_Nouveauté_ : Élimine une micro-friction répétée des dizaines de fois par semaine.

**[UX#15] : Le QR Code De Rapport**
_Concept_ : Chaque rapport génère un QR code que la secrétaire scanne depuis son ordinateur pour récupérer le PDF instantanément.
_Nouveauté_ : Pont entre le monde mobile du médecin et le monde desktop de la secrétaire, sans intégration logicielle complexe.

**Insight clé :** La secrétaire est un vecteur d'adoption invisible — si elle trouve l'outil pénible, elle le sabote passivement. Si elle le trouve fluide, elle devient ambassadrice.

## Technique 3 — SCAMPER

### S — Substitute

**[MVP#1]** Cadre visuel simple (rectangle vert) → ✅ MVP
**[MVP#2]** Rapport personnalisé → ✅ MVP obligatoire
**[MVP#3]** Gestion patients → ✅ MVP obligatoire
**[MVP#4]** 3 articulations (genou + hanche + cheville) → ✅ MVP obligatoires
**[MVP#5]** Traitement post-capture (vs temps réel) → ✅ MVP
**[MVP#6]** Stockage cloud + authentification → ✅ MVP obligatoire

### C — Combine

**[MVP#7]** Capture + guidage fusionnés en un seul écran → ✅ MVP
**[MVP#8]** Création patient + lancement analyse → ✅ MVP
**[MVP#9]** Rapport + export sur même vue → ✅ MVP

### A — Adapt

**[MVP#10]** Pattern "scan document" bancaire (cadre vert = bien positionné) → ✅ MVP
**[MVP#11]** Timeline suivi clinique (style Doctolib) → ✅ MVP

### M — Modify

**[MVP#12]** Interface à deux niveaux (simple / expert) → ✅ MVP
**[MVP#13]** Flux en 4 taps maximum → ✅ MVP
**[MVP#14]** Suivi de progression clinique (timeline patient) → ✅ MVP

### E — Eliminate

**[ELIM#1]** Zéro gestion multi-praticiens / rôles → ❌ Post-MVP
**[ELIM#2]** Zéro intégration logiciels médicaux → ❌ Post-MVP (export PDF uniquement)
**[ELIM#5]** Zéro comparaison inter-patients → ❌ Post-MVP

### P — Put to other uses

**[OPP#1]** Kinésithérapeutes → ⚠️ Post-MVP
**[OPP#2]** Auto-suivi patient à domicile → ⚠️ Post-MVP
**[OPP#3]** Formation médicale → ⚠️ Post-MVP

### R — Reverse

**[MVP#15]** Onboarding par le rapport final (montrer la destination d'abord) → ✅ MVP

---

## Angles Complémentaires

### Monétisation

**[BIZ#1]** Freemium inversé — 10 analyses/mois gratuites → ✅ Modèle retenu
**[BIZ#4]** Prix psychologique — 39-49€/mois (seuil "invisible" cabinet médical)
**[BIZ#5]** Limite mensuelle, pas temporelle — l'habitude précède le paiement
**[BIZ#6]** Upgrade déclenché par la valeur — le praticien voit ses progrès avant de payer

### Acquisition

**[GO#2]** Démo live aux congrès médicaux (SoFCOT) → stratégie principale
**[GO#4]** Stand Zéro Hardware — l'absence de matériel EST le message
**[GO#5]** QR Code Post-Démo — le praticien repart avec son propre rapport
**[GO#6]** Effet réseau au congrès — le rapport devient objet social médical

### Risques Techniques

**[TECH#1]** Échec vêtements sombres/luminosité faible → détection avant capture
**[TECH#2]** Échec morphologies atypiques (obésité, prothèses) → correction manuelle + disclaimer
**[TECH#3]** Dérive angulaire par mauvais angle caméra → guidage strict vue de profil

### Positionnement Concurrentiel

**[COMP#1]** Kinetisense/Dartfish = 3-15K€/an, matériel dédié → BodyOrthox = "prix d'un abonnement Spotify, sur votre iPhone"
**[COMP#2]** Concurrents = graphiques chercheurs → BodyOrthox = rapport médical intégrable dossier
**[COMP#3]** Simplicité = moat — marché différent, pas bataille frontale

---

## Organisation et Synthèse Finale

### Thèmes identifiés

**Thème 1 — Flux Utilisateur & Simplicité** : UX#1, MVP#13, MVP#12, MVP#7, MVP#8, MVP#15, UX#2
**Thème 2 — Confiance, RGPD & Fiabilité** : UX#11, UX#8, UX#9, TECH#1, TECH#2, TECH#3
**Thème 3 — Valeur Clinique & Rapport** : UX#6, MVP#14, UX#4, UX#12, UX#7, MVP#9, UX#13, UX#14, UX#15
**Thème 4 — Monétisation** : BIZ#1, BIZ#4, BIZ#5, BIZ#6
**Thème 5 — Acquisition** : GO#2, GO#4, GO#5, GO#6
**Thème 6 — Positionnement** : COMP#1, COMP#2, COMP#3

### 3 Idées Percées

1. **Analyse 100% On-Device** — résout RGPD + confiance patient + adoption cabinet en un seul argument
2. **Interface à Deux Niveaux** — résout le paradoxe simplicité/puissance sans compromis
3. **Proposition de valeur** : _"Analysez la marche de vos patients en 30 secondes. Juste votre iPhone."_

### Périmètre MVP Définitif

**Dans le MVP :**

- Flux 4 taps : Nouveau patient → Filmer → Résultat → Exporter
- Interface simple/expert (deux niveaux)
- Capture guidée (cadre visuel + détection luminosité + guidage profil strict)
- Traitement post-capture (pas de temps réel)
- 3 articulations : genou + hanche + cheville
- Analyse marche clinique + course/sport
- Gestion patients avec historique et suivi de progression
- Rapport personnalisé + export PDF 1 tap + nommage automatique
- Stockage cloud + authentification
- Script réassurance RGPD intégré
- Analyse 100% on-device
- Onboarding wizard 3 écrans (motivationnel, pas instructionnel)
- Vue annotation expert (replay image par image avec angles)
- Normes de référence par âge/profil
- Timeline progression clinique patient

**Post-MVP :**

- Intégration logiciels médicaux
- Gestion multi-praticiens
- Interface patient (auto-suivi)
- Comparaison inter-patients
- Kinésithérapeutes / segments secondaires

### Prochaines Étapes

| Priorité | Action                                                       | Horizon     |
| -------- | ------------------------------------------------------------ | ----------- |
| 1        | Valider flux 4 taps avec 3 orthopédistes réels (test papier) | Semaine 1   |
| 2        | Tester MediaPipe sur 10 vidéos en conditions cabinet réelles | Semaine 1   |
| 3        | Identifier prochain congrès SoFCOT pour démo live            | Semaine 1   |
| 4        | Prototyper interface deux niveaux simple/expert              | Semaine 2-3 |
| 5        | Rédiger script onboarding wizard (3 écrans)                  | Semaine 2   |
