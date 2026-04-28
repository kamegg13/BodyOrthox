---
name: use-canvas-api-not-html2canvas
description: Interdit html2canvas dans React Native Web — impose Canvas API directement. Déclenché quand Claude est sur le point d'utiliser html2canvas, html-to-image, dom-to-image, ou toute lib de capture DOM pour générer une image depuis un composant React.
---

# Règle : Canvas API directement, jamais html2canvas

## Pourquoi html2canvas échoue dans RN Web

Dans une app React Native Web, `html2canvas` (et les libs similaires : `html-to-image`, `dom-to-image`) échoue silencieusement lors de la capture d'une image + overlay pour 3 raisons fondamentales :

1. **Timing de chargement** : `html2canvas` ne garantit pas que l'image `<img>` est entièrement chargée avant de sérialiser le DOM. L'image peut apparaître blanche ou absente dans le canvas capturé.

2. **Div hors viewport** : Le pattern courant consiste à positionner le `<div>` à `top: -10000px` pour l'invisibilité. `html2canvas` ne rend pas correctement les éléments hors viewport — il les considère comme non-visibles.

3. **CORS implicites même sur base64** : Même si l'image source est une data URL base64, `html2canvas` applique des restrictions CORS selon le contexte de sécurité du navigateur, ce qui peut provoquer un canvas "tainted" inutilisable avec `toDataURL()`.

**Résultat** : le `catch` du fallback renvoie l'image brute sans skeleton — l'erreur est silencieuse et le bug est difficile à diagnostiquer.

## Pattern obligatoire

Utiliser directement le Canvas API avec `new Image()` + `onload` :

```typescript
/**
 * Capture une image avec son overlay (skeleton, annotations, etc.)
 * en utilisant directement le Canvas API 2D.
 *
 * @param imageUrl - URL ou data URL de l'image source
 * @param drawOverlay - fonction qui dessine l'overlay sur le contexte 2D
 * @returns Promise<string> - data URL JPEG de l'image composite
 */
async function captureWithOverlay(
  imageUrl: string,
  drawOverlay: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();

    img.onload = () => {
      // Créer le canvas aux dimensions naturelles de l'image
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d')!;

      // 1. Dessiner l'image de fond
      ctx.drawImage(img, 0, 0);

      // 2. Dessiner l'overlay (segments, cercles, texte HKA, etc.)
      drawOverlay(ctx, canvas.width, canvas.height);

      // 3. Exporter en JPEG avec qualité 0.88
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };

    // Fallback propre : si l'image ne charge pas, retourner l'URL brute
    img.onerror = () => resolve(imageUrl);

    // Déclencher le chargement (doit être après onload/onerror)
    img.src = imageUrl;
  });
}

// Exemple : dessin du skeleton overlay pour BodyOrthox
function drawSkeletonOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  keypoints: Array<{ x: number; y: number; name: string }>,
  segments: Array<[string, string]>
): void {
  // Dessiner les segments (lignes entre keypoints)
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  for (const [from, to] of segments) {
    const fromKp = keypoints.find(kp => kp.name === from);
    const toKp = keypoints.find(kp => kp.name === to);
    if (fromKp && toKp) {
      ctx.beginPath();
      ctx.moveTo(fromKp.x * width, fromKp.y * height);
      ctx.lineTo(toKp.x * width, toKp.y * height);
      ctx.stroke();
    }
  }

  // Dessiner les keypoints (cercles)
  ctx.fillStyle = '#FF0000';
  for (const kp of keypoints) {
    ctx.beginPath();
    ctx.arc(kp.x * width, kp.y * height, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dessiner les annotations texte (angle HKA, etc.)
  ctx.font = `${Math.max(12, width * 0.02)}px Arial`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
}
```

## Anti-pattern interdit

```typescript
// NE JAMAIS FAIRE CA dans RN Web :

import html2canvas from 'html2canvas';

async function captureWithHtml2canvas(containerRef: React.RefObject<HTMLDivElement>): Promise<string> {
  try {
    // Problème 1 : timing — l'image dans le div n'est peut-être pas chargée
    // Problème 2 : si le div est à top: -10000px, html2canvas ne le voit pas
    // Problème 3 : CORS sur toDataURL même si source est base64
    const canvas = await html2canvas(containerRef.current!, {
      useCORS: true,
      allowTaint: false,
    });
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (error) {
    // Echec silencieux — retourne l'image sans overlay, bug invisible
    console.error('html2canvas failed:', error);
    return rawImageUrl; // l'utilisateur ne voit pas le skeleton
  }
}

// Pourquoi ça échoue silencieusement :
// - L'erreur est catchée et retourne l'image brute
// - L'utilisateur voit une image "valide" mais sans overlay skeleton
// - En prod, ce bug est quasi-invisible jusqu'à inspection du PDF
```

## Cas d'usage BodyOrthox

Dans BodyOrthox, ce pattern est utilisé pour générer les captures du rapport PDF médical :

- **Source** : image caméra (data URL base64 depuis MediaPipe)
- **Overlay** : skeleton SVG converti en dessin Canvas (segments osseux, keypoints articulaires, angle HKA, annotations textuelles)
- **Export** : JPEG 88% qualité pour inclusion dans le PDF via `react-pdf`

Session 2026-04-13 : la migration de `html2canvas` vers Canvas API directe a résolu le bug où le skeleton n'apparaissait pas dans les captures PDF — le fallback silencieux masquait le problème depuis plusieurs itérations.

**Fichiers concernés dans le projet** :
- `src/features/report/` — génération des captures pour le rapport
- `src/features/analysis/` — pipeline MediaPipe + canvas overlay
