# Déploiement BodyOrthox Web

Le déploiement est **centralisé dans le repo externe** [`kamegg13/orthopedist_gen_ai-deployment`](https://github.com/kamegg13/orthopedist_gen_ai-deployment). Ce repo-ci ne fait que le déclencher.

## Architecture réelle

```
Push sur main (bodyorthox-rn/**)
    ↓ .github/workflows/deploy.yml
    ↓ repository_dispatch "deploy-bodyorthox"
kamegg13/orthopedist_gen_ai-deployment
    ↓ build webpack + rsync + restart du service
Raspberry Pi — service systemd --user (sans sudo)
    ↓ https://orthogenai.inconnu-elevator.ts.net/ (Tailscale)
```

## Workflow local : `.github/workflows/deploy.yml`

- **Déclencheurs** : push sur `main` touchant `bodyorthox-rn/**`, ou manuel (`workflow_dispatch`).
- **Unique étape** : un `curl` qui envoie l'événement `deploy-bodyorthox` au repo de déploiement.
- **Suivi** : le vrai pipeline (build, rsync, restart) est visible dans [les Actions du repo de déploiement](https://github.com/kamegg13/orthopedist_gen_ai-deployment/actions).

## Secret requis (un seul)

| Secret | Rôle |
|--------|------|
| `GH_PAT` | Personal Access Token avec accès `repo` sur `orthopedist_gen_ai-deployment`, pour autoriser le `repository_dispatch`. |

À configurer dans **Settings → Secrets and variables → Actions** de ce repo. Aucun secret Tailscale ni clé SSH n'est nécessaire ici : la connexion au Pi est gérée par le repo de déploiement.

## Procédure de déploiement assistée

Le skill Claude Code `deploy` (`bodyorthox-rn/.claude/commands/deploy/SKILL.md`) exécute le pipeline complet : tsc + tests → commit → push → surveillance du CI → vérification que l'app répond en live. C'est la référence la plus à jour.

## Checklist release de l'app (Android, keystore, env vars)

Voir `bodyorthox-rn/DEPLOYMENT.md`.
