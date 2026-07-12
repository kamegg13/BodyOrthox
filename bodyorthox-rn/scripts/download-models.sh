#!/usr/bin/env bash
# Télécharge les modèles MediaPipe Pose Landmarker (heavy + full) pour les builds natifs.
# Les fichiers .task sont gitignorés : exécuter ce script après un clone, avant un build iOS/Android.
# Versions épinglées (float16/1) — mêmes modèles que la version web (pose-detector.web.ts).
set -euo pipefail

BASE_URL="https://storage.googleapis.com/mediapipe-models/pose_landmarker"
MODELS=("pose_landmarker_heavy" "pose_landmarker_full")

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_ASSETS="$ROOT_DIR/android/app/src/main/assets"
IOS_RESOURCES="$ROOT_DIR/ios/BodyOrthox/Resources"

mkdir -p "$ANDROID_ASSETS" "$IOS_RESOURCES"

for model in "${MODELS[@]}"; do
  url="$BASE_URL/$model/float16/1/$model.task"
  target="$ANDROID_ASSETS/$model.task"
  if [[ -f "$target" ]]; then
    echo "✓ $model.task déjà présent (android)"
  else
    echo "→ Téléchargement $model.task…"
    curl -fSL --retry 3 -o "$target" "$url"
  fi
  cp -f "$target" "$IOS_RESOURCES/$model.task"
  echo "✓ $model.task ($(du -h "$target" | cut -f1 | tr -d ' ')) → android/assets + ios/Resources"
done

echo "Terminé. Modèles prêts pour les builds natifs."
