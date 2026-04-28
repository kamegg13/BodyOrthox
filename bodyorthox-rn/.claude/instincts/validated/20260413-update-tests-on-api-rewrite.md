# Instinct : mettre à jour les tests lors d'un rewrite d'API

## Observation

Session 2026-04-13 : rewrite complet de `report-generator.ts` (suppression de `metadata`, `practitionerView`, `detailedView`, `confidencePercent`). Le commit a été pushé sans mettre à jour les 3 suites de tests dépendantes. Le CI a échoué sur 18 tests. Correction nécessaire en post-push.

## Règle

Avant tout commit qui **change une interface ou API publique** d'un module :

1. `grep -r "from.*[module-name]" src/**/__tests__/` pour lister tous les tests qui importent le module
2. Vérifier que les tests référencent la nouvelle interface (pas d'anciens champs)
3. Mettre à jour les mocks et les fixtures si le type a changé
4. Lancer les tests ciblés **avant** le commit : `npx jest --testPathPattern="[module]"`

## Checklist avant commit d'un rewrite

```bash
# 1. Trouver les tests impactés
grep -rl "from.*report-generator\|from.*report-store" src --include="*.test.*"

# 2. Lancer ces tests
npx jest --testPathPattern="report-generator|report-store|report-screen" --no-coverage

# 3. Si échec → corriger les tests, puis committer ensemble
```

## Exemple concret

Ancienne interface : `data.metadata.patientName`, `data.practitionerView.angles`
Nouvelle interface : `data.patientName`, `data.bilateral`

Rechercher dans les tests : `metadata.patientName`, `practitionerView` → mettre à jour.

## Type

process — à appliquer systématiquement

## Confiance

0.95
