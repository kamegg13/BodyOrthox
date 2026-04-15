---
name: no-base64-in-localstorage
description: Rappelle la règle d'architecture duale localStorage/IndexedDB quand du code stocke des images ou blobs. Déclenché quand Claude est sur le point de stocker des images base64, des blobs, ou des données binaires dans localStorage ou sessionStorage.
---

# Règle : Ne jamais stocker des images base64 dans localStorage

## Pourquoi

`localStorage` est limité à **5MB par origine** dans tous les navigateurs. Une image JPEG capturée par caméra en base64 pèse facilement **200-500KB**. Après seulement quelques analyses, le quota est dépassé.

Le piège critique : `localStorage.setItem()` **échoue silencieusement** quand le quota est atteint — surtout si l'erreur est avalée dans un `catch { // ignore }`. Résultat : toutes les données de la session sont perdues sans aucun message d'erreur visible.

Ce bug a été découvert en production sur BodyOrthox le 2026-04-13, quand la `WebDatabase` stockait les images base64 de la caméra directement dans localStorage avec les métadonnées.

## Architecture obligatoire

| Stockage | Contenu autorisé |
|----------|-----------------|
| `localStorage` | Métadonnées légères : IDs, texte, nombres, dates, booléens |
| `IndexedDB` | Données binaires lourdes : images, audio, blobs, fichiers |

**Règle absolue** : jamais de `base64`, `data:image/`, `blob:`, ou `ArrayBuffer` dans `localStorage` ou `sessionStorage`.

## Pattern à appliquer

```typescript
// 1. INSERT — sauvegarder l'image dans IndexedDB au moment de l'insertion
if (tableName === 'analyses' && row['captured_image_url'] && row['id']) {
  saveImageToIDB(row['id'] as string, row['captured_image_url'] as string);
}

// 2. persist() vers localStorage — exclure les images avant sérialisation
data[k] = v.map(({ captured_image_url: _img, ...rest }) => rest);

// 3. initialize() — réattacher les images depuis IndexedDB au chargement
rows.map(row => ({
  ...row,
  captured_image_url: imageCache.get(row['id'] as string) ?? null,
}))
```

### Utilitaires IndexedDB typiques

```typescript
// Sauvegarder une image base64 dans IndexedDB
async function saveImageToIDB(id: string, base64: string): Promise<void> {
  const db = await openImageDB();
  const tx = db.transaction('images', 'readwrite');
  tx.objectStore('images').put({ id, data: base64 });
  await tx.done;
}

// Charger toutes les images au démarrage (cache mémoire)
async function loadImageCache(): Promise<Map<string, string>> {
  const db = await openImageDB();
  const all = await db.getAll('images');
  return new Map(all.map(entry => [entry.id, entry.data]));
}
```

## Anti-pattern à éviter

```typescript
// ❌ INTERDIT — stocke des images base64 dans localStorage
const analyses = [
  { id: '123', captured_image_url: 'data:image/jpeg;base64,/9j/4AAQ...', date: '2026-04-13' }
];
localStorage.setItem('analyses', JSON.stringify(analyses));
// → Quota 5MB dépassé silencieusement après quelques sessions
// → Toutes les données perdues sans erreur visible

// ✅ CORRECT — séparer métadonnées et binaire
const analysesMeta = analyses.map(({ captured_image_url: _img, ...meta }) => meta);
localStorage.setItem('analyses', JSON.stringify(analysesMeta));
// + images sauvegardées dans IndexedDB séparément
```

## Checklist avant d'écrire dans localStorage

- [ ] La valeur contient-elle `data:image/` ou `data:audio/` ? → IndexedDB obligatoire
- [ ] La valeur est-elle un blob URL (`blob:`) ? → IndexedDB obligatoire
- [ ] La valeur dépasse-t-elle ~10KB ? → Envisager IndexedDB
- [ ] Le `setItem` est-il dans un try/catch qui avale les erreurs ? → Logger explicitement `QuotaExceededError`
