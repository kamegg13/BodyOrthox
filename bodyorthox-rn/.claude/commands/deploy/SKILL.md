---
name: deploy
description: Pipeline de déploiement complet BodyOrthox → Raspberry Pi. Lance automatiquement TypeScript + tests, commit, push, surveille le CI GitHub Actions, puis vérifie que l'app est live sur https://orthogenai.inconnu-elevator.ts.net/. Utiliser dès que l'utilisateur dit "déploie", "push en prod", "va commit push", "est-ce que c'est déployé", ou veut envoyer des changements sur le Pi.
---

# Deploy BodyOrthox → Raspberry Pi

Pipeline complet : pré-vérifications → commit → push → CI → déploiement → vérification live.

## Étape 1 — Pré-vérifications obligatoires

Ne jamais pusher sans avoir passé ces deux contrôles.

### TypeScript
```bash
npx tsc --noEmit 2>&1; echo "EXIT:$?"
```
Si EXIT non-zéro → **STOP**. Corriger les erreurs avant de continuer.

### Tests
```bash
npx jest --no-coverage 2>&1 | tail -15
```

Si des tests échouent :
1. Identifier quels fichiers source ont changé
2. Chercher les suites de tests impactées :
   ```bash
   grep -rl "from.*[nom-du-module-modifié]" src --include="*.test.*" --include="*.test.tsx"
   ```
3. Corriger les tests (mettre à jour fixtures/mocks si l'API a changé), puis relancer

Ne jamais pousser avec des tests cassés.

## Étape 2 — Commit & Push

```bash
git add <fichiers pertinents>
git commit -m "<type>(<scope>): <description courte>"
git push origin main
```

Utiliser les types conventionnels : `feat`, `fix`, `test`, `chore`, `refactor`.

## Étape 3 — Surveiller le CI BodyOrthox

```bash
# Récupérer le run déclenché par le push
gh run list --repo kamegg13/BodyOrthox --limit 3
```

Attendre la fin du CI :
```bash
gh run watch <run-id> --repo kamegg13/BodyOrthox
```

### Si le CI échoue
```bash
gh run view <run-id> --repo kamegg13/BodyOrthox --log-failed 2>&1 | tail -60
```

Patterns d'erreur courants :

| Symptôme | Cause probable | Action |
|---|---|---|
| Tests `report-generator` / `report-store` / `report-screen` | API du générateur changée | Mettre à jour les fixtures et testIDs dans les fichiers `__tests__` |
| `Cannot find module` | Import manquant ou mauvais chemin | Vérifier les imports et les fichiers `.web.ts` / `.native.ts` |
| TypeScript errors | Type cassé | `npx tsc --noEmit` localement pour reproduire |

Corriger, committer, pusher → retour étape 2.

## Étape 4 — Surveiller le déploiement

Le CI BodyOrthox déclenche automatiquement le workflow de déploiement centralisé.

```bash
gh run list --repo kamegg13/orthopedist_gen_ai-deployment --limit 3
gh run watch <deploy-run-id> --repo kamegg13/orthopedist_gen_ai-deployment
```

Le déploiement prend ~2 minutes (build webpack + rsync + redémarrage systemd).

## Étape 5 — Vérifier que l'app est live

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://orthogenai.inconnu-elevator.ts.net/
```

`HTTP 200` = déployé avec succès.

En cas de doute, vérifier le service sur le Pi :
```bash
ssh pi@100.97.170.113 "systemctl --user status bodyorthox-web --no-pager | tail -5"
```

## Dépannage

| Problème | Commande |
|---|---|
| App ne répond pas | `ssh pi@100.97.170.113 "systemctl --user restart bodyorthox-web"` |
| Voir les logs du service | `ssh pi@100.97.170.113 "journalctl --user -u bodyorthox-web -n 50"` |
| Déploiement manuel | `cd /Users/karimmeguenni-tani/orthopedist_gen_ai-deployment && ./apps/bodyorthox/deploy.sh` |
| CI bloqué | Vérifier les secrets GitHub Actions sur kamegg13/orthopedist_gen_ai-deployment |

## Rappels architecture

- **HTTPS live** : https://orthogenai.inconnu-elevator.ts.net/ (Tailscale + Let's Encrypt)
- **IP Tailscale Pi** : `100.97.170.113` (user: `pi`)
- **Service** : `systemd --user` (PAS sudo)
- **Build** : `npm ci --legacy-peer-deps` requis (react-native-web compat)
- **Trigger CI** : push sur `main` avec changements dans `bodyorthox-rn/**`
