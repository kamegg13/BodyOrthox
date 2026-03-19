# Story 3.3b: Intégration MediaPipe Pose Detection (Web)

Status: ready-for-dev

## Story

As a practitioner (Dr. Marc),
I want the app to detect real articular landmarks from my captured photo using MediaPipe Pose,
so that the HKA angles displayed are based on the actual patient's anatomy instead of simulated data.

## Acceptance Criteria

**AC1 — MediaPipe Pose chargé et initialisé**
**Given** l'app web est ouverte
**When** le module MediaPipe est initialisé (lazy, au premier accès Capture)
**Then** `@mediapipe/tasks-vision` PoseLandmarker est chargé avec le modèle `pose_landmarker_lite`
**And** le chargement est asynchrone et non-bloquant (ne retarde pas le premier render)
**And** un indicateur "Chargement du modèle ML..." s'affiche si l'utilisateur accède à Capture avant la fin du chargement

**AC2 — Détection de pose sur une photo capturée (webcam)**
**Given** l'utilisateur a pris une photo via la webcam
**When** il clique "Analyser"
**Then** la photo (data URL) est convertie en HTMLImageElement
**And** PoseLandmarker.detect(image) est appelé
**And** les landmarks extraits (indices 11,12,23,24,25,26,27,28,29,30) sont passés à `processFrames(landmarks)`
**And** les angles (genou, hanche, cheville) sont calculés via `angle-calculator.ts` (code existant)
**And** le score de confiance est calculé à partir des visibilités des landmarks

**AC3 — Détection de pose sur une photo importée**
**Given** l'utilisateur a importé une photo depuis sa galerie
**When** il clique "Analyser"
**Then** le même pipeline MediaPipe → angle-calculator est exécuté
**And** les résultats sont identiques en qualité à une photo webcam

**AC4 — Gestion des échecs de détection**
**Given** MediaPipe ne détecte aucune pose dans la photo (personne absente, photo floue, mauvais cadrage)
**When** la détection retourne 0 landmarks ou des landmarks avec visibility < 0.3
**Then** un message d'erreur s'affiche : "Aucune personne détectée. Assurez-vous que le patient est entièrement visible dans la photo."
**And** le bouton "Recommencer" permet de reprendre une photo
**And** aucune analyse partielle n'est sauvegardée

**AC5 — Détection partielle (confiance faible)**
**Given** MediaPipe détecte une pose mais certains landmarks ont visibility < 0.5
**When** les angles sont calculés
**Then** le score de confiance reflète les visibilités réelles
**And** si confidenceScore < 0.60, l'utilisateur est averti : "Confiance faible — la photo pourrait ne pas être optimale. Vous pouvez réessayer ou continuer."
**And** l'utilisateur peut choisir de continuer ou recommencer

**AC6 — Suppression du fallback simulé**
**Given** MediaPipe est intégré
**When** le code est nettoyé
**Then** `SIMULATED_LANDMARKS` est supprimé de `capture-screen.tsx`
**And** aucun landmark hardcodé ne subsiste dans le flux de capture web
**And** le flux natif (iOS/Android) reste inchangé (toujours simulé jusqu'à intégration native)

**AC7 — Performance**
**Given** une photo de 1280x720 est analysée
**When** MediaPipe Pose détecte les landmarks
**Then** la détection prend < 3 secondes sur un MacBook/PC moderne
**And** l'interface reste responsive pendant l'analyse (pas de gel)

## Tasks / Subtasks

- [ ] Tâche 1 — Créer le service MediaPipe (AC: 1)
  - [ ] T1.1 — Installer `@mediapipe/tasks-vision` via npm
  - [ ] T1.2 — Créer `src/features/capture/data/pose-detector.web.ts` : initialisation lazy de PoseLandmarker
  - [ ] T1.3 — Créer `src/features/capture/data/pose-detector.ts` : interface IPoseDetector
  - [ ] T1.4 — Créer `src/features/capture/data/pose-detector.native.ts` : stub (retourne erreur "non disponible sur mobile")
  - [ ] T1.5 — Configurer webpack pour servir les fichiers WASM de MediaPipe (si nécessaire)
  - [ ] T1.6 — Écrire tests unitaires pour pose-detector

- [ ] Tâche 2 — Brancher MediaPipe dans le flux capture (AC: 2, 3)
  - [ ] T2.1 — Modifier `capture-screen.tsx` : remplacer `processFrames(SIMULATED_LANDMARKS)` par appel à `poseDetector.detect(imageDataUrl)`
  - [ ] T2.2 — Convertir data URL en HTMLImageElement pour PoseLandmarker.detect()
  - [ ] T2.3 — Mapper les résultats MediaPipe (NormalizedLandmark[]) vers PoseLandmarks (le format existant)
  - [ ] T2.4 — Afficher "Analyse en cours..." pendant la détection

- [ ] Tâche 3 — Gestion des erreurs et cas limites (AC: 4, 5)
  - [ ] T3.1 — Détecter l'absence de pose (0 landmarks ou tous visibility < 0.3)
  - [ ] T3.2 — Afficher message d'erreur + bouton "Recommencer"
  - [ ] T3.3 — Détecter la confiance faible et proposer continuer/recommencer
  - [ ] T3.4 — Écrire tests pour chaque cas d'erreur

- [ ] Tâche 4 — Nettoyage (AC: 6)
  - [ ] T4.1 — Supprimer `SIMULATED_LANDMARKS` de `capture-screen.tsx`
  - [ ] T4.2 — Vérifier qu'aucun landmark hardcodé ne subsiste (grep)
  - [ ] T4.3 — Mettre à jour les tests existants si nécessaire

- [ ] Tâche 5 — Validation (AC: 1-7)
  - [ ] T5.1 — `npx jest` → tous les tests passent
  - [ ] T5.2 — `npx tsc --noEmit` → 0 erreurs
  - [ ] T5.3 — Test manuel dans le navigateur : photo webcam → vraies valeurs d'angles
  - [ ] T5.4 — Test manuel : photo importée → vraies valeurs d'angles
  - [ ] T5.5 — Test manuel : photo sans personne → message d'erreur correct

## Dev Notes

### Architecture existante (prête pour le branchement)

```
Photo (webcam data URL / uploaded file data URL)
     ↓
[À IMPLÉMENTER] IPoseDetector.detect(imageDataUrl) → PoseLandmarks
     ↓
processFrames(landmarks)           ← EXISTE (capture-store.ts)
     ↓
angle-calculator.ts                ← EXISTE (calculateKneeAngle, calculateHipAngle, calculateAnkleAngle)
     ↓
ResultsScreen                      ← EXISTE
```

### MediaPipe Tasks Vision — API cible

```typescript
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Initialisation (une seule fois, lazy)
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
);
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    delegate: "GPU",
  },
  runningMode: "IMAGE",
  numPoses: 1,
});

// Détection sur une image
const result = poseLandmarker.detect(htmlImageElement);
// result.landmarks[0] = NormalizedLandmark[] (33 points)
```

### Mapping MediaPipe → PoseLandmarks existant

```typescript
// MediaPipe indices (identiques à ceux de angle-calculator.ts)
// 11 = left_shoulder, 12 = right_shoulder
// 23 = left_hip, 24 = right_hip
// 25 = left_knee, 26 = right_knee
// 27 = left_ankle, 28 = right_ankle
// 29 = left_heel, 30 = right_heel

function mediapipeToPoseLandmarks(
  mpLandmarks: NormalizedLandmark[],
): PoseLandmarks {
  const result: PoseLandmarks = {};
  const indices = [11, 12, 23, 24, 25, 26, 27, 28, 29, 30];
  for (const i of indices) {
    if (mpLandmarks[i]) {
      result[i] = {
        x: mpLandmarks[i].x,
        y: mpLandmarks[i].y,
        visibility: mpLandmarks[i].visibility ?? 0,
      };
    }
  }
  return result;
}
```

### Fichiers à modifier

| Fichier                                             | Action                                       |
| --------------------------------------------------- | -------------------------------------------- |
| `src/features/capture/data/pose-detector.ts`        | CRÉER — interface IPoseDetector              |
| `src/features/capture/data/pose-detector.web.ts`    | CRÉER — implémentation MediaPipe             |
| `src/features/capture/data/pose-detector.native.ts` | CRÉER — stub natif                           |
| `src/features/capture/screens/capture-screen.tsx`   | MODIFIER — remplacer SIMULATED_LANDMARKS     |
| `package.json`                                      | MODIFIER — ajouter `@mediapipe/tasks-vision` |
| `webpack.config.js`                                 | PEUT-ÊTRE — config WASM si nécessaire        |

### Stack technique

- **MediaPipe Tasks Vision** : `@mediapipe/tasks-vision` (npm package)
- **Modèle** : `pose_landmarker_lite` (léger, ~5MB, suffisant pour photo statique)
- **Mode** : `IMAGE` (pas de streaming — analyse photo unique)
- **Delegate** : `GPU` (WebGL) avec fallback `CPU`
- **WASM** : chargé depuis CDN `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`

### Design system

Pas de changement UI — seul le pipeline de données change.

### Anti-patterns à éviter

- **NE PAS** charger MediaPipe au démarrage de l'app — lazy load au premier accès Capture
- **NE PAS** stocker le modèle ML dans le bundle — charger depuis CDN
- **NE PAS** bloquer l'UI pendant la détection — utiliser async/await
- **NE PAS** modifier `angle-calculator.ts` — le format PoseLandmarks est déjà compatible
- **NE PAS** toucher au flux natif (iOS/Android) — cette story est web-only

### Commandes de vérification

```bash
cd bodyorthox-rn

# TypeScript
npx tsc --noEmit

# Tests
npx jest --verbose

# Test manuel web
npm run web  # → http://localhost:8080
# Naviguer vers un patient → Nouvelle analyse → Prendre photo → Vérifier les angles
```

### Previous story intelligence

- Story 3-3 a établi le pattern `processFrames(landmarks)` avec `PoseLandmarks` et `angle-calculator.ts`
- Story 3-0 a établi le `CaptureScreen` avec webcam + upload
- Le mapping MediaPipe indices ↔ angle-calculator indices est **déjà aligné** (voir commentaires angle-calculator.ts:5-10)

### References

- [Source: bodyorthox-rn/src/features/capture/data/angle-calculator.ts] — Calcul d'angles, format PoseLandmarks
- [Source: bodyorthox-rn/src/features/capture/store/capture-store.ts] — processFrames(), PoseLandmarks import
- [Source: bodyorthox-rn/src/features/capture/screens/capture-screen.tsx] — SIMULATED_LANDMARKS à remplacer
- [Source: bodyorthox-rn/src/features/capture/components/web-camera.tsx] — takePhoto() retourne data URL
- [Source: docs/planning-artifacts/epics.md#Story-3.3] — Acceptance criteria originaux
- [MediaPipe Pose Landmarker Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List
