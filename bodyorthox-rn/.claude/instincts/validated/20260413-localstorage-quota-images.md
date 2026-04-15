# Instinct : localStorage 5MB quota — images → IndexedDB

## Observation

Session 2026-04-13 : la WebDatabase stockait toutes les données (y compris les images base64 de la caméra) dans `localStorage`. Les images JPEG en base64 font facilement 200-500KB chacune. Après quelques analyses, le quota 5MB était dépassé — `localStorage.setItem` échouait silencieusement dans le bloc `catch { // ignore }`, provoquant la perte de toutes les données de la session.

## Règle

**Ne jamais stocker des images base64 dans localStorage** sur une app web.

Architecture duale obligatoire :
- `localStorage` → métadonnées légères (IDs, texte, nombres, dates)
- `IndexedDB` → données binaires lourdes (images, audio, blobs)

## Pattern appliqué

```typescript
// Lors de l'INSERT : sauvegarder l'image dans IndexedDB
if (tableName === 'analyses' && row['captured_image_url'] && row['id']) {
  saveImageToIDB(row['id'] as string, row['captured_image_url'] as string);
}

// Lors du persist() vers localStorage : exclure les images
data[k] = v.map(({ captured_image_url: _img, ...rest }) => rest);

// Lors du initialize() : réattacher depuis IndexedDB
rows.map(row => ({
  ...row,
  captured_image_url: imageCache.get(row['id'] as string) ?? null,
}))
```

## Type

error_fix + architecture

## Confiance

0.90
