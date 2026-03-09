# Sprint Change Proposal — BodyOrthox

**Auteur :** Karimmeguenni-tani
**Date :** 2026-03-08
**Statut :** En attente d'approbation
**Scope de changement :** Major — replan fondamental requis

---

## Section 1 : Résumé du Problème

### Déclencheur

**Story :** Story 3.5 — Replay Expert & Correction Manuelle (dernière story complétée, Epic 3)

### Problème

L'analyse vidéo biomécanique sagittale (marche/course) mise en oeuvre dans l'Epic 3 n'est pas assez intégrée dans les workflows cliniques réels des orthopédistes. Le pipeline vidéo (guidage caméra animé, temporal smoothing, buffer frames, script RGPD enregistrement) représente la source de complexité #1 du codebase et génère des bugs sans apporter la valeur clinique espérée.

**Problème #1 — Clinique :** L'analyse sagittale de la marche est complexe à capturer et difficile à interpréter rapidement en consultation. L'angle HKA (Hip-Knee-Ankle) sur photo statique debout est le gold standard clinique pour genu varum/valgum, planification ostéotomie et alignement prothétique — directement exploitable par un orthopédiste en 30 secondes.

**Problème #2 — Technique :** Le codebase actuel est bugué. La base de code accumulée (Stories 1.1 à 3.5) contient suffisamment de dette technique pour justifier un reset complet. Continuer sur cette base risque de faire croître la dette plutôt que de la résorber.

**Problème #3 — Architectural :** L'architecture actuelle est monolithique. Ajouter un nouveau module d'analyse (angle de Cobb, axe fémoral, membre supérieur) nécessiterait une refonte majeure. L'opportunité du pivot est d'introduire une architecture plugin dès le départ.

### Phrase boussole (inchangée)

> _"BodyOrthox permet à un orthopédiste d'analyser les angles articulaires en 30 secondes, sans friction."_

### Repositionnement produit

BodyOrthox n'est pas un outil de diagnostic définitif — c'est un **outil de screening pre-radio** qui évite une X-ray inutile ou prépare la consultation radiologique. Ce positionnement est plus honnête cliniquement et plus vendable commercialement.

---

## Section 2 : Analyse d'Impact

### Impact sur les Epics

| Epic                                 | Status     | Nature du changement                                        |
| ------------------------------------ | ---------- | ----------------------------------------------------------- |
| Epic 1 — Fondation Sécurisée         | Simplifier | Reporter Stories 1.2 (Face ID) et 1.3 (AES-256) en post-MVP |
| Epic 2 — Gestion Patients            | Réordonner | Déplacer après l'Epic Architecture — contenu inchangé       |
| Epic 3 — Capture Guidée & Analyse ML | Réécrire   | Pivot complet : vidéo sagittale → photo statique HKA        |
| Epic 4 — Rapport PDF & Export        | Adapter    | Changements mineurs : nommage + contenu HKA                 |
| Epic 5 — Monétisation Freemium       | Modifier   | FreemiumCounter devient module-aware                        |
| Epic 6 — Onboarding & UX             | Adapter    | Écran résultat onboarding → exemple HKA                     |
| [NOUVEAU] Epic Architecture          | Créer      | Interface AnalysisModule + Registry pattern                 |

### Impact sur les Stories

**Stories supprimées (code à effacer) :**

| Story                                              | Raison                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Story 1.2 — Face ID / Touch ID                     | Reporter post-MVP : friction sans valeur immédiate au stade screening                  |
| Story 1.3 — AES-256 + Isolation Réseau             | Reporter post-MVP : sandbox iOS protège les données locales pour un outil de screening |
| Story 3.1 — Lancement Session & Guidage Caméra     | Pipeline vidéo obsolète — guidage temps réel inutile sur photo statique                |
| Story 3.2 — Script RGPD & Démarrage Enregistrement | L'enregistrement vidéo disparaît — script RGPD à simplifier radicalement               |

**Stories réécrites :**

| Story                                    | Nouvelle cible                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| Story 3.3 — Pipeline ML On-Device        | Photo unique → `PoseDetector.processImage()` → 3 landmarks H/K/A → calcul angle HKA |
| Story 3.4 — Affichage Résultats + Normes | Adapter pour angle HKA (genu varum/valgum) et normes de référence HKA               |

**Stories réutilisées (réimplémenter proprement) :**

| Story                                    | Raison                                                           |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Story 3.5 — Replay + Correction Manuelle | Infrastructure directement applicable aux points H/K/A sur photo |

**Stories ajoutées :**

| Story                                    | Description                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Story 3.0 (nouvelle) — Capture Photo HKA | Ouvrir appareil photo iOS natif → photo debout face antérieure → lancer analyse                 |
| Stories Epic Architecture                | Définir `AnalysisModule` abstract class + Registry pattern + `HKAModule` premier module concret |

### Décision codebase

**Reset complet du codebase Flutter.** Tout le code implémenté (Stories 1.1 à 3.5) est abandonné. On repart depuis `flutter create` avec la nouvelle architecture comme fondation dès le premier commit.

**Rationale :** La dette technique accumulée est suffisante pour que le coût du reset soit inférieur au coût de continuer sur une base buggée. Le pivot architectural (AnalysisModule) est de toute façon incompatible avec la structure actuelle.

### Impact sur les Artefacts

**PRD — 6 sections en conflit :**

| Section                               | Conflit                                          | Action                                                                       |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Résumé exécutif                       | "analyse la biomécanique — marche et course"     | Remplacer par "analyse les angles articulaires (HKA) en position anatomique" |
| Journey 1 — Dr. Marc (chemin heureux) | Scénario basé sur vidéo de marche 12s            | Réécrire : photo debout → angle HKA → rapport                                |
| Journey 2 — Capture difficile         | Vidéo, cheville, temporal smoothing              | Adapter : photo + correction manuelle H/K/A                                  |
| Features MVP P0/P1                    | "Analyse ML Kit genou/hanche/cheville" sagittale | Remplacer par "Analyse HKA sur photo statique"                               |
| FR7-FR12 — Capture & Guidage          | FR8/FR9/FR10/FR12 orientés vidéo                 | Réécrire pour photo statique                                                 |
| FR13 — Analyse ML                     | "analyse la vidéo capturée"                      | Remplacer par "analyse la photo capturée"                                    |
| NFR-P5                                | Latence overlay caméra < 100ms                   | Supprimer — N/A sur photo statique                                           |

**Architecture — Composants en conflit :**

| Composant                               | Action                                                         |
| --------------------------------------- | -------------------------------------------------------------- | ------- |
| `features/capture/` — structure entière | Refondre pour photo statique                                   |
| `guided_camera_overlay.dart`            | Supprimer                                                      |
| `ml_isolate_runner.dart`                | Simplifier : 1 image → 3 landmarks → 1 angle                   |
| `capture_state.dart`                    | Mettre à jour : `Idle → PhotoCaptured → Processing → Completed | Failed` |
| [NOUVEAU] `core/analysis/`              | Créer : `AnalysisModule` abstract class + `AnalysisRegistry`   |
| `paywall/domain/quota.dart`             | Ajouter `moduleId` au modèle `Quota`                           |

**UX Design — Écrans en conflit :**

| Écran                                 | Action                             |
| ------------------------------------- | ---------------------------------- |
| Écran de capture (guidage vidéo)      | Remplacer par flux photo natif iOS |
| Script RGPD (écran dédié)             | Simplifier en bannière légère      |
| Onboarding screen 1 (résultat marche) | Remplacer par exemple analyse HKA  |
| Composant `GuidedCameraOverlay`       | Supprimer                          |

### Impact Technique

**Ce qui disparaît :**

- Pipeline vidéo complet (capture, streaming, temporal smoothing, buffer frames)
- Guidage caméra animé temps réel
- Script RGPD enregistrement vidéo
- Face ID / AES-256 (reportés post-MVP)

**Ce qui est simplifié :**

- ML pipeline : frames multiples → 1 image unique
- `CaptureState` : 5 états → 4 états
- `pubspec.yaml` : `camera` plugin remplacé par `image_picker`

**Ce qui est ajouté :**

- `core/analysis/analysis_module.dart` — abstract class `AnalysisModule`
- `core/analysis/analysis_registry.dart` — Registry pattern
- `features/capture/data/hka_module.dart` — premier module concret
- Module-awareness dans `paywall/domain/quota.dart`

---

## Section 3 : Approche Recommandée

### Option retenue : Hybride Reset + Ajustement Direct + Révision MVP

**Chemin forward :**

1. **Reset codebase** — `git rm -r bodyorthox/` + `flutter create` propre
2. **Révision PRD** — 6 sections mises à jour, repositionnement screening pre-radio, NFR-P5 supprimée
3. **Révision Architecture** — ajout `core/analysis/` (AnalysisModule + Registry), mise à jour `features/capture/`
4. **Révision Epics** — nouvel Epic Architecture, Epic 3 refondu, stories supprimées/ajoutées
5. **Implémentation** — dans l'ordre : Architecture → HKA → PDF → Patients → Freemium → UX

**Justification :**

| Dimension               | Evaluation                                                             |
| ----------------------- | ---------------------------------------------------------------------- |
| Effort d'implémentation | Reduit — on supprime plus de code qu'on n'en écrit                     |
| Impact timeline         | Favorable — MVP potentiellement plus rapide                            |
| Risque technique        | Faible — ML Kit validé pour landmarks statiques, pas de modele custom  |
| Valeur clinique         | Amelioree — HKA directement exploitable vs analyse sagittale theorique |
| Maintenabilite          | Amelioree — architecture plugin extensible                             |
| Morale                  | Positive — simplification = clarte + base saine                        |

**Risques et mitigations :**

| Risque                                                 | Mitigation                                                                                    |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| ML Kit détecte mal H/K/A sur photo statique (vs vidéo) | Valider `PoseDetector.processImage()` sur 10 photos test avant d'écrire les nouvelles stories |
| Reset codebase = perte de logique Story 3.5            | Documenter le pattern correction manuelle dans les AC de la nouvelle Story 3.5                |
| Scope creep lors de la réécriture                      | Appliquer la règle boussole : si absent de Journey 1 (Dr. Marc / HKA), c'est hors MVP         |

---

## Section 4 : Propositions de Changement Détaillées

### 4.1 Epics & Stories

**SUPPRIMER ces stories (retirer des docs + effacer le code) :**

```
Story 1.2 — Face ID / Touch ID
Story 1.3 — AES-256 + Isolation Réseau
Story 3.1 — Lancement Session & Guidage Caméra
Story 3.2 — Script RGPD & Démarrage Enregistrement
```

**AJOUTER ce nouvel epic (avant Epic 3) :**

```
[NOUVEAU] Epic Architecture — AnalysisModule & Registry

Goal : Définir l'interface plugin commune à tous les modules d'analyse
       pour qu'ajouter une future analyse = ajouter un module, zéro touche au core.

Stories :
  Story A.1 — Interface AnalysisModule
    - abstract class AnalysisModule { String get moduleId; Future<AnalysisResult> analyze(XFile photo); }
    - AnalysisRegistry — map moduleId → AnalysisModule
    - Tests unitaires de l'interface

  Story A.2 — HKAModule : premier module concret
    - class HKAModule implements AnalysisModule
    - PoseDetector.processImage() → landmarks leftHip/leftKnee/leftAnkle (et right)
    - Calcul angle HKA depuis les coordonnées 2D
    - Tests unitaires du calcul angulaire
```

**RÉÉCRIRE Story 3.0 (nouvelle) — Capture Photo HKA :**

```
OLD : (n'existe pas)
NEW :
  As a practitioner,
  I want to take a photo of a patient standing upright (anterior face view)
  in one tap using the native iOS camera,
  So that I can launch the HKA analysis without any complex camera guidance.

  AC :
  Given je suis sur la fiche patient
  When je tape "Nouvelle analyse"
  Then image_picker ouvre l'appareil photo iOS natif
  And je prends la photo
  And l'analyse HKA démarre immédiatement
  And aucun guidage caméra animé n'est requis

Rationale : Suppression du GuidedCameraOverlay — l'appareil photo natif iOS gère l'exposition et la mise au point.
```

**RÉÉCRIRE Story 3.3 — Pipeline ML :**

```
OLD :
  Section : Acceptance Criteria
  "Google ML Kit extrait les poses frame par frame dans l'isolate — vidéo jamais écrite sur disque"
  "les angles articulaires (genou, hanche, cheville) sont calculés"

NEW :
  Section : Acceptance Criteria
  Given une photo est capturée (XFile)
  When HKAModule.analyze(photo) est appelé
  Then PoseDetector.processImage() extrait les landmarks (leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle)
  And l'angle HKA est calculé depuis les coordonnées 2D des 3 landmarks
  And un score de confiance est calculé par articulation
  And l'analyse se termine en < 5 secondes
  And si la détection échoue (confiance < seuil), MLLowConfidence est retourné

Rationale : Photo unique au lieu de pipeline vidéo streaming — complexité réduite d'un ordre de grandeur.
```

**ADAPTER Story 3.4 — Affichage Résultats :**

```
OLD :
  "ArticularAngleCard affichent genou, hanche et cheville avec leur valeur en degrés"
  "plages normatives de référence par âge et profil morphologique"

NEW :
  "ArticularAngleCard affiche l'angle HKA (valeur en degrés, 1 décimale)"
  "Interprétation : Genu varum (<177°) / Neutre (177-183°) / Genu valgum (>183°)"
  "Normes HKA de référence par sexe et âge adulte"
  "BodySkeletonOverlay visualise l'axe mécanique H-K-A sur la photo"

Rationale : HKA au lieu d'angles sagittaux multiples — lecture clinique immédiate.
```

**ADAPTER Story 4.1 — Rapport PDF :**

```
OLD :
  "nommé automatiquement NomPatient_AnalyseMarche_YYYY-MM-DD.pdf"

NEW :
  "nommé automatiquement NomPatient_AnalyseHKA_YYYY-MM-DD.pdf"

Rationale : Convention de nommage alignée sur le type d'analyse.
```

**MODIFIER Story 5.1 — Freemium :**

```
OLD :
  "quota de 10 analyses gratuites par mois"

NEW :
  "quota de 10 analyses gratuites par mois PAR MODULE d'analyse"
  "Quota { moduleId: 'hka', count: 10, used: 0 }"
  "futurs modules ont leur propre compteur indépendant"

Rationale : Monétisation granulaire — chaque nouveau module = nouvelle opportunité de revenus distincte.
```

### 4.2 PRD

**Section : Résumé Exécutif**

```
OLD :
  "permet aux orthopédistes d'analyser objectivement la biomécanique de leurs patients
   — marche et course — en 30 secondes chrono"

NEW :
  "permet aux orthopédistes d'analyser objectivement les angles articulaires de leurs patients
   — angle HKA (Hip-Knee-Ankle) sur photo statique — en 30 secondes chrono,
   comme outil de screening pre-radio pour la planification des consultations"

Rationale : Repositionnement screening pre-radio + HKA comme core value proposition.
```

**NFR-P5 — Supprimer :**

```
OLD :
  NFR-P5 : Réactivité UI capture — cadre visuel et détection luminosité en temps réel, latence < 100ms

NEW :
  [SUPPRIMÉE] — N/A sur photo statique. L'appareil photo iOS natif gère la réactivité.
```

### 4.3 Architecture

**Ajouter `core/analysis/` :**

```dart
// core/analysis/analysis_module.dart
abstract class AnalysisModule {
  String get moduleId;
  String get displayName;
  Future<AnalysisResult> analyze(XFile photo);
}

// core/analysis/analysis_registry.dart
class AnalysisRegistry {
  final Map<String, AnalysisModule> _modules = {};
  void register(AnalysisModule module) => _modules[module.moduleId] = module;
  AnalysisModule? get(String moduleId) => _modules[moduleId];
}
```

**Mettre à jour `capture_state.dart` :**

```dart
OLD :
  CaptureIdle | CaptureRecording | CaptureProcessing | CaptureCompleted | CaptureFailed

NEW :
  CaptureIdle | CapturePhotoTaken | CaptureProcessing | CaptureCompleted | CaptureFailed
```

**Remplacer `camera` par `image_picker` dans pubspec.yaml :**

```yaml
OLD:
  camera: ^x.x.x

NEW:
  image_picker: ^x.x.x
```

---

## Section 5 : Plan de Handoff

### Classification du scope

**MAJOR** — Replan fondamental requis :

- Reset complet du codebase
- Révision de 3 artefacts de planning (PRD, Architecture, Epics)
- Nouveau epic créé
- Réordonnancement des epics

### Destinataires et responsabilités

| Rôle                     | Responsabilité                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Product Manager (PM)** | Valider le repositionnement "screening pre-radio" dans le PRD + approuver la suppression FR26/FR27 du MVP                         |
| **Architecte**           | Valider le design `AnalysisModule` + Registry + confirmer `image_picker` vs `camera` plugin                                       |
| **Scrum Master (SM)**    | Mettre à jour `epics.md` : supprimer stories, ajouter Epic Architecture, réordonner                                               |
| **Dev**                  | Reset codebase → `flutter create` → implémenter dans l'ordre : Epic Architecture → Epic 3 HKA → Epic 4 → Epic 2 → Epic 5 → Epic 6 |

### Séquence d'implémentation après approbation

```
1. Valider ML Kit sur photo statique (Action 2 du brainstorming) — AVANT d'écrire les stories
   → PoseDetector.processImage() sur 10 photos test debout face antérieure

2. Reset codebase
   → git rm -r bodyorthox/
   → flutter create --org com.bodyorthox --platforms ios --project-name bodyorthox bodyorthox

3. Mettre à jour les artefacts de planning
   → PRD : 6 sections + suppression NFR-P5
   → Architecture : ajout core/analysis/ + update capture_state
   → Epics : supprimer 1.2/1.3/3.1/3.2 + ajouter Epic Architecture + réordonner

4. Implémenter dans l'ordre
   → Epic 1 (Story 1.1 only) → Epic Architecture → Epic 3 (HKA) → Epic 4 → Epic 2 → Epic 5 → Epic 6
```

### Critères de succès

- [ ] `PoseDetector.processImage()` retourne des landmarks H/K/A valides sur photo statique debout (< 5% échec)
- [ ] `flutter create` + structure Feature-First buildable sans erreur
- [ ] `AnalysisModule` interface + `HKAModule` : tests unitaires passent
- [ ] Angle HKA calculé depuis landmarks avec précision ≤ 2° vs mesure manuelle
- [ ] Rapport PDF généré avec nommage `NomPatient_AnalyseHKA_DATE.pdf`
- [ ] Flux complet photo → angle → export en < 30 secondes

---

_Document généré dans le cadre du workflow Correct Course — BodyOrthox Sprint Change Management_
