# Améliorations ML Analysis — Roadmap

**Date :** 2026-03-23
**Status :** En cours

---

## Implémenté (cette session)

### ✅ Multi-pass analysis (5 passes moyennées)

Exécuter 5 détections sur la même image avec légers crops/rotations et moyenner les landmarks. Réduit le bruit de détection de ~15-20%.

### ✅ Upscale image 1920px

Redimensionner l'image à 1920px minimum avant analyse. MediaPipe performe mieux sur les grandes images.

### ✅ Smoothing des landmarks (visibility² weighting)

Moyenne pondérée par visibility² pour supprimer les détections bruitées.

### ✅ ROI crop jambes

Re-détection focalisée sur la zone hanches→pieds pour plus de précision.

### ✅ Auto-rotation

Détection et correction de l'inclinaison de l'image via les épaules.

### ✅ Validation anatomique

Vérification des proportions (fémur/tibia, symétrie, position genoux).

### ✅ Détection qualité photo

Analyse résolution, luminosité, contraste, netteté avant ML.

### ✅ Multi-modèle (heavy + full)

Fusion des résultats de 2 modèles par moyenne pondérée.

### ❌ Coordonnées Z (3D) — Retiré

Implémenté puis retiré : les coordonnées Z de MediaPipe sur des photos 2D frontales sont trop bruitées et donnaient des angles incorrects (~90° au lieu de ~175°).

---

## À implémenter plus tard

### 🔲 Modèle custom fine-tuné (gain +20-30%)

Appliquer un filtre de lissage (weighted average par confiance) sur les landmarks détectés pour stabiliser les positions. Les landmarks avec haute visibilité pèsent plus que ceux avec faible visibilité.

**Approche :**

```typescript
function smoothLandmarks(passes: PoseLandmarks[]): PoseLandmarks {
  // Pour chaque landmark, calculer la moyenne pondérée par visibility
  // weight = landmark.visibility^2 (favorise les détections confiantes)
}
```

**Effort :** ~2h — Faible complexité

### 🔲 Multi-modèle (gain +10%)

Exécuter 2 modèles (`pose_landmarker_heavy` + `pose_landmarker_full`) et fusionner les résultats par average pondéré. Les deux modèles ont des biais différents — la fusion réduit les erreurs systématiques.

**Approche :**

- Charger les 2 modèles en parallèle
- Exécuter la détection sur chacun
- Fusionner les landmarks par weighted average (weight = confidence du modèle)

**Effort :** ~4h — Complexité moyenne (gestion mémoire 2 modèles WASM)

### 🔲 Calibration automatique de l'image (gain +5%)

Détecter si l'image est inclinée via la ligne des épaules (landmarks 11-12) et la corriger par rotation avant l'analyse ML.

**Approche :**

1. Première détection rapide avec le modèle lite
2. Calculer l'angle d'inclinaison via `atan2(shoulder_right.y - shoulder_left.y, shoulder_right.x - shoulder_left.x)`
3. Si angle > 2°, redresser l'image via canvas rotation
4. Relancer la détection sur l'image corrigée

**Effort :** ~3h — Complexité moyenne

### 🔲 Zone d'intérêt (ROI) crop (gain +5-10%)

Après une première détection, cropper l'image autour de la zone des jambes (hip → ankle + marge) et relancer une détection sur la zone croppée. La résolution effective augmente pour les articulations ciblées.

**Approche :**

1. Première détection sur l'image complète
2. Identifier le bounding box des landmarks 23-32 (jambes)
3. Cropper avec 20% de marge
4. Relancer la détection sur le crop
5. Remapper les coordonnées vers l'image originale

**Effort :** ~3h — Complexité moyenne

### 🔲 Modèle custom fine-tuné (gain +20-30%)

Entraîner un modèle MediaPipe spécialisé sur des photos cliniques HKA (patients en position frontale, éclairage cabinet). Le modèle générique est entraîné sur des poses variées — un modèle spécialisé serait beaucoup plus précis pour notre cas d'usage spécifique.

**Approche :**

1. Collecter 500+ photos cliniques annotées
2. Fine-tuner le modèle via MediaPipe Model Maker
3. Déployer le modèle custom sur le CDN

**Effort :** 2-4 semaines — Haute complexité, nécessite des données annotées

### 🔲 Validation croisée avec normes anatomiques (gain fiabilité)

Après détection, vérifier que les proportions du squelette sont anatomiquement plausibles (ratio fémur/tibia ~1.0-1.2, distance inter-hanches cohérente avec la taille). Rejeter les détections aberrantes.

**Approche :**

- Définir des ratios anatomiques de référence
- Calculer les ratios détectés
- Score de plausibilité anatomique
- Avertir si les proportions sont aberrantes

**Effort :** ~4h — Complexité faible

### 🔲 Détection de la qualité photo avant analyse

Avant de lancer MediaPipe, analyser la photo pour vérifier :

- Contraste suffisant (histogramme)
- Patient centré dans le cadre
- Résolution minimale
- Pas de flou de bougé

Rejeter les photos de mauvaise qualité avec un message explicatif.

**Effort :** ~4h — Complexité faible

---

## Priorité recommandée

1. Smoothing landmarks — quick win, facile
2. ROI crop jambes — bon gain pour l'analyse HKA spécifiquement
3. Calibration auto-rotation — utile en conditions terrain
4. Validation anatomique — fiabilité, confiance clinique
5. Détection qualité photo — UX, prévention des mauvaises analyses
6. Multi-modèle — gain significatif, effort moyen
7. Modèle custom — le plus gros gain, mais nécessite des données
