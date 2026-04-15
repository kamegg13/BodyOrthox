---
name: test-impact-before-api-commit
description: Checklist à appliquer avant tout commit qui modifie une interface ou API publique d'un module TypeScript. Déclenché quand Claude est sur le point de committer un rewrite, une suppression de champ, ou un changement de signature de fonction/type.
---

# Checklist : tester l'impact avant de committer un rewrite d'API

## Pourquoi

Le 2026-04-13, un rewrite complet de `report-generator.ts` a supprimé les champs `metadata`, `practitionerView`, `detailedView` et `confidencePercent` de l'interface publique. Le commit a été pushé sans mettre à jour les 3 suites de tests dépendantes. Résultat : **18 tests en échec en CI**, correction nécessaire en post-push.

Ce skill existe pour éviter ce pattern. Toute modification d'interface publique doit s'accompagner d'une vérification des tests impactés **avant** le commit.

## Étapes obligatoires

Avant tout commit qui change une interface ou API publique d'un module :

1. **Trouver les tests qui importent le module modifié**
   ```bash
   grep -rl "from.*[module-name]" src --include="*.test.*"
   grep -rl "from.*[module-name]" src --include="*.spec.*"
   ```

2. **Vérifier que les tests référencent la nouvelle interface**
   - Rechercher les anciens noms de champs supprimés ou renommés
   - S'assurer qu'aucun test n'utilise encore l'ancienne signature

3. **Mettre à jour les mocks et fixtures si le type a changé**
   - Adapter les `jest.mock()` et `mockReturnValue()` à la nouvelle interface
   - Mettre à jour les fixtures JSON ou les objets de test statiques

4. **Lancer les tests ciblés AVANT le commit**
   ```bash
   npx jest --testPathPattern="[module-name]" --no-coverage
   ```
   Ne committer que si tous les tests passent.

## Commandes de diagnostic

Adapter `[module-name]` au module modifié :

```bash
# 1. Trouver tous les fichiers de test qui importent le module
grep -rl "from.*[module-name]" src --include="*.test.*"
grep -rl "from.*[module-name]" src --include="*.spec.*"

# 2. Rechercher les anciens champs dans les tests (exemple concret)
grep -r "metadata\.patientName\|practitionerView\|detailedView\|confidencePercent" src --include="*.test.*"

# 3. Lancer les tests liés au module (adapter le pattern)
npx jest --testPathPattern="report-generator|report-store|report-screen" --no-coverage

# 4. Exemple générique pour tout module
npx jest --testPathPattern="[module-name]" --no-coverage
```

## Exemple concret (incident 2026-04-13)

Avant le rewrite :
```typescript
data.metadata.patientName
data.practitionerView.angles
```

Après le rewrite :
```typescript
data.patientName
data.bilateral
```

Les tests utilisaient encore `metadata.patientName` et `practitionerView` → **18 tests cassés en CI**.

Diagnostic rapide :
```bash
grep -r "metadata\.patientName\|practitionerView" src --include="*.test.*"
```

## Règle d'or

**Ne jamais pousser avec des tests cassés.**

Si les tests échouent après une modification d'interface :
1. Corriger les tests pour refléter la nouvelle API
2. Vérifier que les mocks sont cohérents
3. Relancer jusqu'à ce que tous les tests passent
4. Committer le code ET les tests ensemble dans le même commit (ou PR)

Un rewrite d'API sans mise à jour des tests n'est pas terminé.
