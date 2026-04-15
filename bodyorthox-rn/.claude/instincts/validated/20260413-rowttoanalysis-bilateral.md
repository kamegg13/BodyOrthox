# Instinct : rowToAnalysis doit recalculer bilateralAngles

## Observation

Lors de la session du 2026-04-13, `rowToAnalysis` dans `sqlite-analysis-repository.ts` hydratait l'objet `Analysis` depuis la DB **sans** recalculer `bilateralAngles` à partir des `allLandmarks` stockés. Résultat : toute analyse chargée depuis la DB avait `bilateralAngles = undefined`, ce qui provoquait "Aucune donnée angulaire disponible" dans le rapport PDF.

## Règle

Quand tu lis un repository SQLite qui hydrate un domaine `Analysis`, **toujours** vérifier que les champs calculés (comme `bilateralAngles`) sont recomputed depuis les données brutes persistées (comme `landmarks_json`). Ne pas supposer qu'ils sont directement stockés.

## Pattern appliqué

```typescript
// MAUVAIS — oublie de recalculer
function rowToAnalysis(row): Analysis {
  const allLandmarks = parseLandmarksJson(r.landmarks_json);
  return { ...r, allLandmarks }; // bilateralAngles manquant !
}

// BON — recalcule à partir des données brutes
function rowToAnalysis(row): Analysis {
  const allLandmarks = parseLandmarksJson(r.landmarks_json);
  const bilateralAngles = allLandmarks
    ? calculateBilateralAngles(allLandmarks)
    : undefined;
  return { ...r, allLandmarks, bilateralAngles };
}
```

## Type

error_fix — pattern récurrent à risque

## Confiance

0.95
