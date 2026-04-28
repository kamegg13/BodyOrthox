# Instinct : Canvas API > html2canvas pour capture image+overlay

## Observation

Session 2026-04-13 : `html2canvas` était utilisé pour capturer un `<div>` positionné à `top: -10000px` (hors viewport) avec l'image de la caméra + l'overlay SVG du skeleton. L'approche échouait silencieusement — le fallback `catch` renvoyait l'image brute sans skeleton.

Causes : timing de chargement de l'image, div hors viewport, CORS implicites même sur base64.

## Règle

Dans une app React Native Web, **ne jamais utiliser html2canvas** pour dessiner une image + overlay sur canvas. Utiliser directement le Canvas API :

1. `new Image()` + `img.onload` (garantit que l'image est chargée)
2. `canvas.getContext('2d').drawImage(img, 0, 0)` pour l'image
3. Dessiner l'overlay (segments, cercles, texte) avec les méthodes 2D canvas
4. `canvas.toDataURL('image/jpeg', 0.88)` pour exporter

## Pattern appliqué

```typescript
async function captureWithOverlay(imageUrl: string, ...): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      drawOverlay(ctx, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(imageUrl); // fallback propre
    img.src = imageUrl;
  });
}
```

## Type

error_fix + best_practice

## Confiance

0.92
