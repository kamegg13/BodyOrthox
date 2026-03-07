---
stepsCompleted:
  - "step-01-validate-prerequisites"
  - "step-02-design-epics"
  - "step-03-create-stories"
  - "step-04-final-validation"
workflow_completed: true
completedDate: "2026-03-05"
inputDocuments:
  - "docs/planning-artifacts/prd.md"
  - "docs/planning-artifacts/architecture.md"
  - "docs/planning-artifacts/ux-design-specification.md"
---

# BodyOrthox - Epic Breakdown

## Overview

Ce document fournit la décomposition complète en épics et stories pour BodyOrthox, décomposant les exigences du PRD, de la spécification UX et de l'architecture en stories implémentables.

## Requirements Inventory

### Functional Requirements

**Gestion Patients**
FR1: Le praticien peut créer un profil patient (nom, date de naissance, profil morphologique)
FR2: Le praticien peut consulter la liste de ses patients existants
FR3: Le praticien peut sélectionner un patient existant pour lancer une nouvelle analyse
FR4: Le praticien peut consulter l'historique complet des analyses d'un patient
FR5: Le praticien peut visualiser la progression clinique d'un patient dans le temps (timeline)
FR6: Le praticien peut supprimer un patient et toutes ses données associées

**Capture & Guidage**
FR7: Le praticien peut lancer une session de capture vidéo depuis l'interface patient
FR8: L'app fournit un cadre visuel temps réel indiquant si le cadrage est correct pour l'analyse
FR9: L'app détecte la luminosité ambiante et alerte le praticien si elle est insuffisante
FR10: L'app guide le praticien pour positionner le patient en vue de profil strict
FR11: Le praticien peut arrêter la capture et relancer une nouvelle prise sans quitter le flux
FR12: L'app affiche un script de réassurance RGPD à lire au patient avant toute capture

**Analyse ML On-Device**
FR13: L'app analyse la vidéo capturée pour extraire les angles articulaires (genou, hanche, cheville) entièrement sur l'appareil, sans transmission de données
FR14: L'app traite l'analyse en arrière-plan et notifie le praticien à la fin du traitement
FR15: L'app affiche les angles articulaires mesurés avec les plages de référence normatives par âge et profil
FR16: L'app évalue et communique le niveau de confiance de chaque mesure articulaire
FR17: Le praticien peut ajuster manuellement un point articulaire si la confiance ML est insuffisante
FR18: Le praticien peut visualiser un replay image par image avec les angles superposés sur la vidéo
FR19: L'app supprime automatiquement la vidéo brute après analyse et propose la confirmation au praticien

**Rapport & Export**
FR20: L'app génère un rapport PDF structuré à partir des données d'analyse
FR21: Le rapport est nommé automatiquement selon la convention `NomPatient_AnalyseMarche_DATE.pdf`
FR22: Le rapport inclut un disclaimer légal permanent non modifiable sur chaque page
FR23: Le rapport présente les données en deux niveaux : vue simplifiée (praticien) et vue détaillée (données brutes)
FR24: Le praticien peut exporter le rapport en un tap via le share sheet iOS natif (AirDrop, email, autres apps)
FR25: Le rapport inclut les métadonnées de la session : date, patient, appareil utilisé, niveau de confiance ML

**Sécurité & Confidentialité**
FR26: L'accès à l'app est protégé par biométrie iOS (Face ID ou Touch ID)
FR27: Toutes les données patients sont chiffrées localement avec AES-256
FR28: Aucune donnée vidéo ou patient n'est transmise vers un serveur externe
FR29: L'app fonctionne intégralement sans connexion réseau
FR30: Chaque analyse est horodatée et traçable localement

**Monétisation & Accès**
FR31: Le praticien dispose d'un quota de 10 analyses gratuites par mois (freemium)
FR32: L'app affiche le compteur d'analyses restantes de manière visible
FR33: L'app présente une offre d'upgrade contextuelle lorsque le quota freemium est atteint
FR34: Le praticien peut souscrire à un abonnement mensuel via In-App Purchase iOS
FR35: Le praticien peut gérer et annuler son abonnement via les réglages iOS natifs

**Onboarding & Expérience Utilisateur**
FR36: L'app présente un wizard d'onboarding motivationnel (3 écrans maximum) au premier lancement, montrant le résultat final avant les instructions
FR37: L'app demande les permissions système (caméra, notifications) au moment contextuel, avec explication en contexte
FR38: Le praticien peut basculer entre la vue simplifiée et la vue experte dans les résultats d'analyse
FR39: L'app s'adapte aux formats iPhone (portrait) et iPad (portrait et landscape)
FR40: L'app envoie une notification locale lorsqu'une analyse post-capture est terminée

### NonFunctional Requirements

**Performance**
NFR-P1: Temps d'analyse post-capture < 30 secondes dans 95% des cas (objectif ~20s)
NFR-P2: Fluidité interface ≥ 58 FPS constant sur iPhone 12+ (Impeller activé)
NFR-P3: Démarrage application < 3 secondes cold start sur iPhone 12+
NFR-P4: Génération rapport PDF < 5 secondes après validation de l'analyse
NFR-P5: Réactivité UI capture — cadre visuel et détection luminosité en temps réel, latence < 100ms
NFR-P6: Chargement liste patients < 1 seconde pour 500 patients stockés localement

**Sécurité**
NFR-S1: Chiffrement données au repos AES-256 (SQLCipher) pour toutes les données Drift — aucune donnée patient en clair
NFR-S2: Authentification biométrique iOS obligatoire (Face ID / Touch ID) à chaque ouverture de session
NFR-S3: Isolation réseau — zéro requête réseau sortante lors d'une analyse (testable par inspection trafic)
NFR-S4: Clé de chiffrement dérivée du Keychain iOS (flutter_secure_storage) — jamais exposée en mémoire persistante
NFR-S5: Vidéo brute traitée en mémoire uniquement (isolate Flutter) — jamais écrite sur disque non chiffrée
NFR-S6: Conformité RGPD — architecture locale-first garantit structurellement l'absence de transfert de données personnelles

**Fiabilité**
NFR-R1: Taux de crash < 0.1% par session utilisateur
NFR-R2: Atomicité de l'analyse — si l'analyse échoue, aucune donnée corrompue n'est persistée (transactions Drift)
NFR-R3: Durabilité des données — les données patients survivent à un crash app, redémarrage appareil, ou mise à jour iOS
NFR-R4: Taux d'échec ML < 5% sur vidéos correctement filmées (conditions terrain normales)
NFR-R5: Cohérence des données — aucune analyse partielle stockée (une analyse est soit complète, soit absente)

**Capacité Locale**
NFR-C1: Support de 500+ patients sans dégradation de performance
NFR-C2: Support de 5 000+ analyses stockées sans dégradation
NFR-C3: Base de données locale < 500 MB pour 5 000 analyses (hors vidéos brutes)
NFR-C4: App bundle < 150 MB (modèle ML Kit inclus)

### Additional Requirements

**De l'Architecture :**

- Starter template : `flutter create --org com.bodyorthox --platforms ios --project-name bodyorthox bodyorthox` — constitue la première story d'implémentation (Epic 1, Story 1)
- Structure Feature-First à scaffolder manuellement immédiatement après `flutter create`
- Flavors dev/prod configurés manuellement (RevenueCat sandbox vs prod, logs ML Kit, SQLite optionnel non-chiffré en dev)
- Incompatibilité critique : `sqlcipher_flutter_libs` et `sqlite3_flutter_libs` sont incompatibles — exclusion explicite de `sqlite3_flutter_libs` requise dans pubspec.yaml
- Code generation via build_runner : `dart run build_runner build --delete-conflicting-outputs` (Freezed + Drift + riverpod_generator + go_router_builder)
- Index Drift obligatoires : `idx_patients_name` sur `patients(name)` et `idx_analyses_patient` sur `analyses(patient_id, created_at DESC)`
- Migration Strategy MVP : `MigrationStrategy.recreateTablesOnSchemaChanges()` — migrations manuelles versionnées en Phase 2
- Distribution MVP : TestFlight uniquement — pas de soumission App Store en Phase 1
- CI/CD : manuel Xcode (Organizer/Transporter) pour MVP — GitHub Actions + Fastlane différé en Phase 2

**De la spécification UX :**

- Design system hybride Cupertino + Material 3 (Clinical White — fond blanc, SF Pro Display/Text)
- Palette obligatoire : Primary `#1B6FBF`, Success `#34C759`, Warning `#FF9500`, Error `#FF3B30`, Surface `#FFFFFF`, Text `#1C1C1E`
- Espacement : base 8pt, marges 16pt, touch target minimum 44×44pt (conformité WCAG + Apple HIG)
- Composants custom documentés : `GuidedCameraOverlay`, `ArticularAngleCard`, `AnalysisProgressBanner`, `BodySkeletonOverlay`, `FreemiumCounterBadge`, `ContextualPaywallSheet`
- Layout adaptatif : breakpoint unique `shortestSide >= 600` → iPad, sinon iPhone portrait
- Accessibilité : VoiceOver compatible, Dynamic Type pour les labels médicaux
- Animations : durées 200-300ms (Impeller), transitions guidées par iOS Human Interface Guidelines

### FR Coverage Map

FR1: Epic 2 — Création de profil patient
FR2: Epic 2 — Liste des patients
FR3: Epic 2 — Sélection patient pour nouvelle analyse
FR4: Epic 2 — Historique des analyses d'un patient
FR5: Epic 2 — Timeline de progression clinique
FR6: Epic 2 — Suppression patient et données associées
FR7: Epic 3 — Lancement session capture depuis interface patient
FR8: Epic 3 — Cadre visuel temps réel (guidage cadrage)
FR9: Epic 3 — Détection luminosité ambiante
FR10: Epic 3 — Guidage positionnement vue de profil
FR11: Epic 3 — Relance capture sans quitter le flux
FR12: Epic 3 — Script de réassurance RGPD avant capture
FR13: Epic 3 — Analyse ML on-device (genou, hanche, cheville)
FR14: Epic 3 — Traitement background + notification fin d'analyse
FR15: Epic 3 — Affichage angles + plages normatives par âge/profil
FR16: Epic 3 — Score de confiance par mesure articulaire
FR17: Epic 3 — Correction manuelle d'un point articulaire
FR18: Epic 3 — Replay image par image avec angles superposés
FR19: Epic 3 — Suppression vidéo brute post-analyse
FR20: Epic 4 — Génération rapport PDF structuré
FR21: Epic 4 — Nommage automatique NomPatient_AnalyseMarche_DATE.pdf
FR22: Epic 4 — Disclaimer légal EU MDR permanent sur chaque page
FR23: Epic 4 — Rapport deux niveaux (vue simplifiée / vue détaillée)
FR24: Epic 4 — Export 1 tap via share sheet iOS natif
FR25: Epic 4 — Métadonnées session dans le rapport
FR26: Epic 1 — Authentification biométrique Face ID / Touch ID
FR27: Epic 1 — Chiffrement local AES-256 (Drift + SQLCipher)
FR28: Epic 1 — Zéro transmission de données vidéo/patient
FR29: Epic 1 — Fonctionnement 100% offline
FR30: Epic 1 — Horodatage et traçabilité locale de chaque analyse
FR31: Epic 5 — Quota freemium 10 analyses/mois
FR32: Epic 5 — Compteur d'analyses restantes visible
FR33: Epic 5 — Upgrade contextuel à l'atteinte du quota
FR34: Epic 5 — Souscription abonnement Pro via IAP iOS
FR35: Epic 5 — Gestion/annulation abonnement via réglages iOS natifs
FR36: Epic 6 — Wizard onboarding motivationnel (3 écrans, résultat d'abord)
FR37: Epic 6 — Permissions système demandées au moment contextuel
FR38: Epic 6 — Bascule vue simple / vue expert dans les résultats
FR39: Epic 6 — Layout adaptatif iPhone portrait + iPad
FR40: Epic 6 — Notification locale "Analyse prête"

## Epic List

### Epic 1 : Fondation Sécurisée

Le praticien peut accéder à l'app de manière sécurisée ; ses données patients sont chiffrées localement et ne quittent jamais son appareil. Cette fondation technique (scaffolding Flutter, SQLCipher, biométrie) rend toutes les autres fonctionnalités possibles.
**FRs couvertes :** FR26, FR27, FR28, FR29, FR30

### Epic 2 : Gestion des Patients

Le praticien peut créer des profils patients, consulter sa liste, accéder à l'historique complet des analyses d'un patient et visualiser sa progression clinique dans le temps.
**FRs couvertes :** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 3 : Capture Guidée & Analyse ML

Le praticien peut filmer un patient en 12 secondes et obtenir les angles articulaires (genou, hanche, cheville) en ~20 secondes, 100% on-device, avec guidage en temps réel, score de confiance, replay expert et correction manuelle.
**FRs couvertes :** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19

### Epic 4 : Rapport PDF & Export

Le praticien peut générer un rapport PDF structuré (2 niveaux de lecture), nommé automatiquement, avec disclaimer légal permanent, et l'exporter en 1 tap via AirDrop, email ou toute autre app iOS.
**FRs couvertes :** FR20, FR21, FR22, FR23, FR24, FR25

### Epic 5 : Monétisation Freemium

Le praticien rencontre la limite freemium (10 analyses/mois) de manière contextuelle et non intrusive, peut visualiser son quota restant, et upgrader vers BodyOrthox Pro en 2 taps via IAP iOS.
**FRs couvertes :** FR31, FR32, FR33, FR34, FR35

### Epic 6 : Onboarding & Expérience Utilisateur

Le praticien adopte l'app dès le premier lancement grâce à un onboarding montrant le résultat avant les instructions, bénéficie d'une expérience adaptée iPhone/iPad, et peut basculer entre vue simple et vue expert.
**FRs couvertes :** FR36, FR37, FR38, FR39, FR40

---

## Epic 1 : Fondation Sécurisée

Le praticien peut accéder à l'app de manière sécurisée ; ses données patients sont chiffrées localement et ne quittent jamais son appareil. Cette fondation technique (scaffolding Flutter, SQLCipher, biométrie) rend toutes les autres fonctionnalités possibles.

### Story 1.1 : Initialisation du Projet & Infrastructure Technique

As a developer,
I want a properly initialized Flutter project with Feature-First architecture, flavors dev/prod, and the full dependency stack configured,
So that all subsequent features can be built on a consistent, maintainable, and buildable foundation.

**Acceptance Criteria:**

**Given** la commande `flutter create --org com.bodyorthox --platforms ios --project-name bodyorthox bodyorthox` est exécutée
**When** la structure Feature-First est scaffoldée manuellement (`core/`, `features/`, `shared/`) et les flavors dev/prod configurés
**Then** `flutter run --flavor dev -t lib/main_dev.dart` se lance sans erreur
**And** `dart run build_runner build --delete-conflicting-outputs` génère le code sans conflit
**And** `pubspec.yaml` déclare `sqlcipher_flutter_libs` avec exclusion explicite de `sqlite3_flutter_libs`
**And** les entry points `main_dev.dart` et `main_prod.dart` existent et pointent vers un `AppConfig` flavor-aware
**And** `analysis_options.yaml` est configuré avec les règles Dart strictes

### Story 1.2 : Accès Biométrique par Face ID / Touch ID

As a practitioner,
I want to unlock the app with Face ID or Touch ID at each session,
So that patient data is protected from unauthorized access without requiring a password.

**Acceptance Criteria:**

**Given** l'app est lancée ou ramenée au premier plan
**When** le prompt biométrique iOS est affiché
**Then** un Face ID / Touch ID réussi donne accès à l'app
**And** un échec biométrique verrouille l'app sans fallback PIN propriétaire
**And** le redirect `biometric_guard.dart` dans go_router protège toutes les routes applicatives
**And** `local_auth` est le seul mécanisme d'authentification — zéro couche auth propriétaire
**And** l'écran de verrouillage `biometric_lock_screen.dart` est affiché tant que l'auth n'est pas validée

### Story 1.3 : Chiffrement Local AES-256 & Isolation Réseau

As a practitioner,
I want all my patient data to be encrypted on my device and never transmitted externally,
So that I comply with RGPD natively and my patients' confidentiality is structurally guaranteed.

**Acceptance Criteria:**

**Given** la base de données Drift est ouverte avec SQLCipher via `NativeDatabase.createInBackground`
**When** des données sont écrites (patient, analyse, timestamps)
**Then** le fichier SQLite sur disque est chiffré AES-256
**And** la clé de chiffrement est stockée dans le Keychain iOS via `flutter_secure_storage` — jamais en mémoire persistante
**And** chaque analyse inclut un timestamp `created_at` au format ISO 8601 (FR30)
**And** aucune requête réseau n'est émise pendant aucune opération (vérifiable par inspection trafic)
**And** l'app fonctionne intégralement en mode avion (NFR-S3, FR29)

---

## Epic 2 : Gestion des Patients

Le praticien peut créer des profils patients, consulter sa liste, accéder à l'historique complet des analyses d'un patient et visualiser sa progression clinique dans le temps.

### Story 2.1 : Créer un Profil Patient

As a practitioner,
I want to create a patient profile with their name, date of birth, and morphological profile,
So that I can associate analyses to a named patient and provide age-appropriate reference norms.

**Acceptance Criteria:**

**Given** l'écran de création patient est ouvert
**When** je saisis le nom, la date de naissance et le profil morphologique, puis confirme
**Then** le patient est persisté en base Drift (chiffré, avec UUID v4 et `created_at` ISO 8601)
**And** le patient apparaît immédiatement dans la liste patients
**And** les données respectent le modèle Freezed `Patient` (immutabilité garantie)
**And** la validation empêche la création d'un patient sans nom

### Story 2.2 : Consulter la Liste des Patients et Sélectionner pour Analyse

As a practitioner,
I want to browse my patient list and select a patient to start a new analysis,
So that I can quickly find the right patient during a consultation.

**Acceptance Criteria:**

**Given** au moins un patient existe en base
**When** j'ouvre l'écran patients
**Then** la liste se charge en < 1 seconde pour 500+ patients (NFR-P6, index `idx_patients_name`)
**And** je peux rechercher/filtrer par nom en temps réel
**When** je sélectionne un patient
**Then** je suis navigué vers la fiche patient, prêt à lancer une analyse (FR3)

### Story 2.3 : Historique des Analyses d'un Patient

As a practitioner,
I want to view the complete history of analyses for a patient,
So that I can track changes over time and prepare for a consultation with context.

**Acceptance Criteria:**

**Given** un patient a au moins une analyse enregistrée
**When** j'ouvre la fiche patient
**Then** toutes ses analyses sont listées par ordre chronologique décroissant (index `idx_analyses_patient`)
**And** chaque entrée affiche la date, les angles principaux et le score de confiance ML
**And** la liste se charge sans dégradation pour 5 000+ analyses (NFR-C2)

### Story 2.4 : Timeline de Progression Clinique et Suppression Patient

As a practitioner,
I want to visualize a patient's clinical progression over time and be able to delete a patient,
So that I can track treatment effectiveness and maintain data hygiene.

**Acceptance Criteria:**

**Given** un patient a 2+ analyses enregistrées
**When** j'accède à la vue timeline
**Then** les angles articulaires sont affichés sur un graphe temporel comparatif (FR5)
**When** je supprime un patient
**Then** le patient et toutes ses analyses associées sont supprimés en transaction Drift atomique (NFR-R2, FR6)
**And** une confirmation explicite est demandée avant suppression irréversible
**And** aucune donnée orpheline ne subsiste en base après suppression

---

## Epic 3 : Capture Guidée & Analyse ML

Le praticien peut filmer un patient en 12 secondes et obtenir les angles articulaires (genou, hanche, cheville) en ~20 secondes, 100% on-device, avec guidage en temps réel, score de confiance, replay expert et correction manuelle.

### Story 3.1 : Lancement de Session & Guidage Caméra

As a practitioner,
I want real-time visual guidance when positioning my iPhone to film a patient,
So that I capture footage that the ML engine can analyze successfully.

**Acceptance Criteria:**

**Given** je sélectionne un patient et lance une analyse
**When** l'écran de capture s'ouvre
**Then** le `GuidedCameraOverlay` affiche un cadre vert (correct) / orange (luminosité insuffisante) / rouge (mauvais angle) en temps réel, latence < 100ms (NFR-P5)
**And** la détection de luminosité ambiante est active et affiche un message actionnable si insuffisante (FR9)
**And** le guidage de position indique "vue de profil strict" (FR10)
**And** je peux arrêter et relancer une prise sans quitter l'écran (FR11)
**And** l'UI reste fluide à ≥ 58 FPS pendant la capture (NFR-P2, Impeller)

### Story 3.2 : Script RGPD & Démarrage Enregistrement

As a practitioner,
I want to read a RGPD reassurance script to my patient before recording, and start recording with a single tap,
So that patients are informed and consent is managed before any capture begins.

**Acceptance Criteria:**

**Given** l'écran de capture est prêt
**When** j'arrive à l'étape de capture
**Then** le script de réassurance RGPD est affiché : _"Cette vidéo est analysée localement sur cet appareil. Elle n'est pas transmise ni stockée sur un serveur externe."_ (FR12)
**And** je peux démarrer l'enregistrement d'un seul tap après avoir pris connaissance du script
**And** la permission caméra est demandée au moment contextuel avec explication si non encore accordée

### Story 3.3 : Pipeline ML On-Device & Extraction des Angles

As a practitioner,
I want the app to analyze the captured video on-device and extract articular angles automatically,
So that I get clinical measurements in ~20 seconds without any data leaving the device.

**Acceptance Criteria:**

**Given** une vidéo de marche vient d'être enregistrée
**When** l'analyse démarre en arrière-plan (Flutter isolate via `ml_isolate_runner.dart`)
**Then** Google ML Kit extrait les poses frame par frame dans l'isolate — vidéo jamais écrite sur disque (NFR-S5, FR13)
**And** les angles articulaires (genou, hanche, cheville) sont calculés et retournés via `AnalysisResult` sealed class
**And** un score de confiance est calculé pour chaque articulation (FR16)
**And** l'analyse se termine en < 30s dans 95% des cas (NFR-P1)
**And** une notification locale "Analyse de [Nom] prête" est envoyée à la fin du traitement (FR14)
**And** la vidéo brute est supprimée après analyse avec confirmation au praticien (FR19)
**And** si l'analyse échoue, aucune donnée partielle n'est persistée en base (NFR-R2)
**And** le taux d'échec ML est < 5% sur vidéos correctement filmées (NFR-R4)

### Story 3.4 : Affichage des Résultats avec Normes de Référence

As a practitioner,
I want to see the measured articular angles alongside age-appropriate reference norms, in simple or expert view,
So that I can immediately interpret the clinical significance of the results.

**Acceptance Criteria:**

**Given** l'analyse ML est terminée avec succès
**When** j'accède à l'écran de résultats
**Then** les `ArticularAngleCard` affichent genou, hanche et cheville avec leur valeur en degrés (1 décimale) (FR15)
**And** les plages normatives de référence par âge et profil morphologique sont affichées
**And** la vue simple montre les angles et un indicateur visuel (dans/hors norme) (FR38)
**And** je peux basculer vers la vue experte pour voir les données brutes et le score de confiance
**And** le `BodySkeletonOverlay` visualise la posture analysée

### Story 3.5 : Replay Expert & Correction Manuelle

As a practitioner,
I want to review the analysis frame-by-frame with angles overlaid, and manually adjust a joint point if the ML confidence is low,
So that I can validate or correct results before generating a report.

**Acceptance Criteria:**

**Given** je suis sur l'écran de résultats d'une analyse
**When** j'accède au replay
**Then** la vidéo se joue image par image avec les angles articulaires superposés (FR18)
**And** les articulations à faible confiance ML sont visuellement signalées
**When** une articulation a une confiance ML insuffisante
**Then** je peux ajuster manuellement le point articulaire sur le frame (FR17)
**And** le rapport généré après correction inclut un disclaimer : _"Données [articulation] : estimées — vérification manuelle effectuée."_

---

## Epic 4 : Rapport PDF & Export

Le praticien peut générer un rapport PDF structuré (2 niveaux de lecture), nommé automatiquement, avec disclaimer légal permanent, et l'exporter en 1 tap via AirDrop, email ou toute autre app iOS.

### Story 4.1 : Génération du Rapport PDF Structuré

As a practitioner,
I want a structured PDF report generated automatically from analysis results,
So that I have a professional, legally compliant document ready to share without any manual formatting.

**Acceptance Criteria:**

**Given** une analyse est validée (avec ou sans correction manuelle)
**When** je déclenche la génération du rapport
**Then** le PDF est généré en < 5 secondes (NFR-P4)
**And** le fichier est nommé automatiquement `NomPatient_AnalyseMarche_YYYY-MM-DD.pdf` (FR21)
**And** chaque page contient le disclaimer `LegalConstants.mdrDisclaimer` permanent et non modifiable (FR22)
**And** le rapport présente 2 niveaux : vue simplifiée (angles + indicateurs visuels) et vue détaillée (données brutes + score confiance) (FR23)
**And** les métadonnées sont incluses : date, nom patient, appareil iOS utilisé, niveau de confiance ML (FR25)
**And** le PDF est généré localement sans aucune requête réseau

### Story 4.2 : Export du Rapport via Share Sheet iOS

As a practitioner,
I want to export the PDF report in one tap to any app on my iPhone,
So that I can send it to my secretary via AirDrop, email it to the patient, or save it anywhere.

**Acceptance Criteria:**

**Given** le rapport PDF est généré
**When** j'appuie sur le bouton "Exporter"
**Then** le share sheet iOS natif s'ouvre avec le PDF prêt à partager (FR24)
**And** AirDrop, Mail, Messages et toutes apps iOS compatibles sont disponibles
**And** le nom de fichier `NomPatient_AnalyseMarche_DATE.pdf` est pré-rempli dans le share sheet
**And** l'export fonctionne sans connexion réseau (AirDrop, sauvegarde locale)

---

## Epic 5 : Monétisation Freemium

Le praticien rencontre la limite freemium (10 analyses/mois) de manière contextuelle et non intrusive, peut visualiser son quota restant, et upgrader vers BodyOrthox Pro en 2 taps via IAP iOS.

### Story 5.1 : Quota Freemium & Compteur Visible

As a practitioner,
I want to see how many free analyses I have left this month, and be gently informed when I reach the limit,
So that I understand the freemium model without feeling pressured before I've experienced the value.

**Acceptance Criteria:**

**Given** je suis en plan freemium
**When** j'utilise l'app
**Then** le `FreemiumCounterBadge` affiche le nombre d'analyses restantes ce mois (FR32)
**And** le compteur est décrémenté après chaque analyse complétée
**And** le quota est mensuel (remise à zéro le 1er du mois) — pas temporel (FR31)
**And** le quota est stocké localement — fonctionne offline sans vérification serveur
**And** à 0 analyses restantes, l'accès à la nouvelle capture est bloqué et le `ContextualPaywallSheet` s'affiche (FR33)

### Story 5.2 : Upgrade Pro & Gestion de l'Abonnement

As a practitioner,
I want to subscribe to BodyOrthox Pro in 2 taps using Face ID, and manage my subscription from iOS Settings,
So that the upgrade feels frictionless once I've seen enough value from the free tier.

**Acceptance Criteria:**

**Given** j'ai atteint mon quota de 10 analyses/mois
**When** le `ContextualPaywallSheet` s'affiche
**Then** je vois mon historique d'usage (proof of value) avant le CTA d'upgrade
**And** je peux souscrire à l'abonnement mensuel en 2 taps + Face ID via IAP iOS (FR34)
**And** RevenueCat (`purchases_flutter`) gère la transaction et retourne le statut d'abonnement
**And** après upgrade, le quota devient illimité immédiatement
**And** je peux gérer ou annuler mon abonnement depuis les Réglages iOS natifs sans flow in-app (FR35)
**And** en cas d'absence de réseau, l'app utilise le statut d'abonnement caché localement (RevenueCat offline cache)

---

## Epic 6 : Onboarding & Expérience Utilisateur

Le praticien adopte l'app dès le premier lancement grâce à un onboarding montrant le résultat avant les instructions, bénéficie d'une expérience adaptée iPhone/iPad, et peut basculer entre vue simple et vue expert.

### Story 6.1 : Wizard d'Onboarding Motivationnel

As a practitioner opening BodyOrthox for the first time,
I want to see the final result before any instructions, and grant permissions at the right moment,
So that I understand the value immediately and feel confident launching my first analysis.

**Acceptance Criteria:**

**Given** c'est le premier lancement de l'app
**When** l'onboarding s'affiche
**Then** 3 écrans maximum sont présentés dans l'ordre : résultat → flux capture → confidentialité RGPD (FR36)
**And** l'écran résultat montre un exemple d'analyse réelle — pas une liste de fonctionnalités
**And** la permission caméra est demandée au moment de l'écran "flux capture", avec explication contextuelle (FR37)
**And** la permission notifications est demandée après la première analyse complétée
**And** l'onboarding n'est affiché qu'une seule fois — jamais revu après complétion

### Story 6.2 : Layout Adaptatif iPhone & iPad

As a practitioner using BodyOrthox on iPhone or iPad,
I want the interface to adapt naturally to my device format,
So that the app feels native whether I'm standing with my iPhone or seated at my desk with an iPad.

**Acceptance Criteria:**

**Given** l'app est ouverte sur iPhone portrait
**Then** le flux de capture est optimisé pour la main droite, boutons en bas de l'écran (FR39)
**Given** l'app est ouverte sur iPad
**Then** le layout utilise l'espace supplémentaire avec split view liste + détail (`shortestSide >= 600`)
**And** tous les touch targets sont ≥ 44×44pt sur tous les formats (Apple HIG)
**And** `LayoutExtensions.isTablet` est le seul breakpoint utilisé — pas de breakpoints dispersés

### Story 6.3 : Notification Locale "Analyse Prête"

As a practitioner who has started an analysis,
I want to receive a local notification when the ML processing is complete,
So that I can attend to my patient while the analysis runs in the background and return when ready.

**Acceptance Criteria:**

**Given** une analyse ML est en cours de traitement en background
**When** le traitement se termine (succès ou échec)
**Then** une notification locale est envoyée : "L'analyse de [Nom Patient] est prête — 23°/67°/41°" (FR40)
**And** la notification fonctionne sans connexion réseau (`flutter_local_notifications`)
**And** tapper la notification navigue directement vers l'écran de résultats via deep link go_router
**And** aucune notification push / APNs n'est utilisée — local uniquement
