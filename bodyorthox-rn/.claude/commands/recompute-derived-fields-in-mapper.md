---
name: recompute-derived-fields-in-mapper
description: Rappelle de toujours recalculer les champs dérivés (bilateralAngles, scores, etc.) lors de la lecture depuis un repository. Déclenché quand Claude écrit ou modifie une fonction rowToX, toRow, fromDb, hydrate, ou un mapper de repository qui transforme des données DB en domaine.
---

# Règle : Recalculer les champs dérivés dans les mappers de repository

## Pourquoi

Bug rencontré le 2026-04-13 : `rowToAnalysis` dans `sqlite-analysis-repository.ts` hydratait l'objet `Analysis` depuis la DB **sans** recalculer `bilateralAngles` à partir des `allLandmarks` stockés. Résultat : toute analyse chargée depuis la DB avait `bilateralAngles = undefined`, ce qui provoquait l'erreur "Aucune donnée angulaire disponible" dans le rapport PDF.

La cause racine : les champs calculés ne sont pas stockés directement en DB — seules les données brutes (landmarks_json) le sont. Un mapper qui oublie de recalculer les dérivés expose un objet domaine partiellement hydraté.

## Principe

**Ne jamais supposer qu'un champ calculé est stocké tel quel en base de données.** Les champs dérivés doivent être recalculés à la lecture, à partir des données brutes persistées.

Chaque fois que tu écris ou modifies une fonction nommée `rowToX`, `toRow`, `fromDb`, `hydrate`, `mapRow`, ou tout mapper de repository DB → domaine :

1. Identifier tous les champs de l'interface domaine
2. Pour chaque champ, déterminer s'il est **stocké** ou **calculé**
3. Les champs **calculés** → appeler la fonction de calcul correspondante depuis les données brutes

## Pattern à appliquer

```typescript
// MAUVAIS — oublie de recalculer bilateralAngles
function rowToAnalysis(row: Record<string, unknown>): Analysis {
  const r = row as AnalysisRow;
  const allLandmarks = parseLandmarksJson(r.landmarks_json);
  return {
    ...r,
    allLandmarks,
    // bilateralAngles absent ! sera undefined à la lecture
  };
}

// BON — recalcule bilateralAngles depuis les données brutes
function rowToAnalysis(row: Record<string, unknown>): Analysis {
  const r = row as AnalysisRow;
  const allLandmarks = parseLandmarksJson(r.landmarks_json);
  const bilateralAngles = allLandmarks
    ? calculateBilateralAngles(allLandmarks)
    : undefined;
  return {
    id: r.id,
    patientId: r.patient_id,
    // ... autres champs stockés
    allLandmarks,
    bilateralAngles, // recalculé depuis allLandmarks
  };
}
```

## Champs dérivés dans BodyOrthox

| Champ domaine | Données brutes en DB | Fonction de calcul |
|---|---|---|
| `bilateralAngles` | `landmarks_json` | `calculateBilateralAngles(allLandmarks)` |
| `allLandmarks` | `landmarks_json` | `parseLandmarksJson(r.landmarks_json)` (désérialisation) |
| `confidenceScore` | `confidence_score` | Stocké directement — pas de recalcul nécessaire |
| `morphologicalProfile` | `morphological_profile` | `JSON.parse(r.morphological_profile)` (désérialisation) |

> Note : `confidenceScore` est stocké directement en DB, contrairement à `bilateralAngles`. Toujours vérifier le schéma DB pour distinguer champs stockés vs calculés.

## Checklist avant de valider un mapper

- [ ] Tous les champs de l'interface domaine sont couverts (pas de champ silencieusement `undefined`)
- [ ] Les champs qui requièrent un calcul (ex : `bilateralAngles`) sont recalculés depuis les données brutes
- [ ] Les champs JSON sérialisés (ex : `landmarks_json`, `morphological_profile`) sont correctement désérialisés
- [ ] Un test unitaire vérifie que le champ dérivé est non-undefined après lecture depuis la DB

## Fichiers de référence dans ce projet

- Mapper correct : `/src/features/capture/data/sqlite-analysis-repository.ts` — `rowToAnalysis` (version corrigée)
- Fonction de calcul : `/src/features/capture/data/angle-calculator.ts` — `calculateBilateralAngles`
- Interface domaine : `/src/features/capture/domain/analysis.ts` — `Analysis`
