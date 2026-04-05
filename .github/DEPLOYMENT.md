# Déploiement Automatique BodyOrthox

Ce document décrit le système de déploiement automatique de BodyOrthox Web sur Raspberry Pi via GitHub Actions.

## Architecture

```
GitHub Actions (Ubuntu runner)
    ↓ (1) Build webpack
    ↓ (2) Tailscale connection
    ↓ (3) rsync web-dist/
    ↓ (4) systemctl restart
Raspberry Pi (192.168.1.73)
    ↓ Service systemd (bodyorthox-web)
    ↓ serve port 3000
Application accessible
```

## Workflow: `.github/workflows/deploy.yml`

**Déclencheurs:**

- ✋ Manuel (`workflow_dispatch`)
- 🔄 Push sur `main` (fichiers dans `bodyorthox-rn/**`)

**Étapes:**

1. **Build** - Génère le bundle webpack (`npm run build:web`)
2. **Tailscale** - Connexion sécurisée au Pi via Tailscale
3. **Deploy** - Transfert `web-dist/` via rsync
4. **Restart** - Redémarre le service systemd
5. **Health Check** - Vérifie que l'app répond sur port 3000

## Configuration des Secrets GitHub

Aller dans **Settings → Secrets and variables → Actions** du repo BodyOrthox.

### Secrets requis

| Secret                 | Description                         | Comment l'obtenir                                                                                   |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `TS_OAUTH_CLIENT_ID`   | Tailscale OAuth Client ID           | [Tailscale Admin Console](https://login.tailscale.com/admin/settings/oauth) → Generate OAuth Client |
| `TS_OAUTH_SECRET`      | Tailscale OAuth Secret              | Généré avec le Client ID                                                                            |
| `RASPBERRY_PI_SSH_KEY` | Clé privée SSH pour connexion au Pi | `cat ~/.ssh/id_ed25519` (celle utilisée pour `pi@raspberrypi.local`)                                |
| `RASPBERRY_PI_HOST`    | Hostname/IP du Pi sur Tailscale     | Exemple: `orthogenai` ou `100.97.170.113`                                                           |
| `RASPBERRY_PI_USER`    | Utilisateur SSH                     | `pi`                                                                                                |

### Obtenir les credentials Tailscale OAuth

1. Aller sur https://login.tailscale.com/admin/settings/oauth
2. Cliquer **Generate OAuth client**
3. Sélectionner les scopes :
   - ✅ `devices:write` (pour connecter le runner CI)
4. Ajouter un tag : `tag:ci`
5. Copier le **Client ID** et le **Secret**
6. Les ajouter dans les secrets GitHub

### Configurer la clé SSH

**Si la clé existe déjà** (utilisée localement pour `pi@raspberrypi.local`) :

```bash
cat ~/.ssh/id_ed25519
```

**Si pas de clé, en créer une nouvelle** :

```bash
# Sur votre Mac
ssh-keygen -t ed25519 -C "github-actions-bodyorthox" -f ~/.ssh/bodyorthox_deploy

# Copier la clé publique sur le Pi
ssh-copy-id -i ~/.ssh/bodyorthox_deploy.pub pi@raspberrypi.local

# Copier la clé privée pour GitHub
cat ~/.ssh/bodyorthox_deploy
```

⚠️ **Important** : Ajouter la clé **privée** complète (y compris `-----BEGIN` et `-----END`).

### Vérifier la configuration Tailscale sur le Pi

Le Pi doit être connecté à Tailscale avec le tag `tag:ci` autorisé :

```bash
ssh pi@raspberrypi.local "tailscale status"
```

Si Tailscale n'est pas installé sur le Pi :

```bash
ssh pi@raspberrypi.local
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

## Déploiement Manuel

### Via GitHub Actions UI

1. Aller dans l'onglet **Actions** du repo BodyOrthox
2. Sélectionner **Deploy to Raspberry Pi**
3. Cliquer **Run workflow** → choisir `main` → **Run workflow**

### Via GitHub CLI

```bash
gh workflow run deploy.yml --repo kamegg13/BodyOrthox
```

### Via script local

Le script `./deploy-to-pi.sh` fonctionne toujours pour déploiement depuis votre Mac :

```bash
./deploy-to-pi.sh
```

## Monitoring

**Voir les logs du workflow** :

```bash
gh run list --workflow=deploy.yml --repo kamegg13/BodyOrthox
gh run view <run-id> --repo kamegg13/BodyOrthox
```

**Voir les logs du service sur le Pi** :

```bash
ssh pi@raspberrypi.local "journalctl -u bodyorthox-web -f"
```

**Vérifier le status du service** :

```bash
ssh pi@raspberrypi.local "systemctl status bodyorthox-web"
```

## Dépannage

### Le workflow échoue à "Setup Tailscale"

- Vérifier que `TS_OAUTH_CLIENT_ID` et `TS_OAUTH_SECRET` sont corrects
- Vérifier que le tag `tag:ci` est configuré dans Tailscale OAuth

### Le workflow échoue à "Setup SSH"

- Vérifier que `RASPBERRY_PI_SSH_KEY` contient la clé privée complète
- Vérifier que la clé publique correspondante est dans `~/.ssh/authorized_keys` sur le Pi

### Le workflow échoue à "Deploy web bundle"

- Vérifier que `RASPBERRY_PI_HOST` est correct (hostname Tailscale ou IP)
- Vérifier que le répertoire `/home/pi/bodyorthox-web` existe sur le Pi

### Le service ne redémarre pas

- Vérifier que le fichier `/etc/systemd/system/bodyorthox-web.service` existe
- Vérifier les permissions sudo pour systemctl :
  ```bash
  ssh pi@raspberrypi.local "sudo systemctl status bodyorthox-web"
  ```

## Différences avec le déploiement local

| Aspect      | Local (`./deploy-to-pi.sh`) | CI/CD (GitHub Actions)    |
| ----------- | --------------------------- | ------------------------- |
| Connexion   | Réseau local WiFi           | Tailscale VPN             |
| Build       | Sur votre Mac               | Dans le runner Ubuntu     |
| Déclencheur | Manuel                      | Push sur `main` ou manuel |
| Secrets     | Dans `~/.ssh/config`        | GitHub Secrets            |
| Logs        | Terminal local              | GitHub Actions UI         |

## Sécurité

- ✅ Clés SSH stockées dans GitHub Secrets (chiffrées)
- ✅ Connexion via Tailscale (tunnel chiffré)
- ✅ Pas d'exposition publique du Pi
- ✅ Tag `tag:ci` limite l'accès Tailscale aux runners CI
- ✅ Service systemd tourne sous utilisateur `pi` (pas root)

## Prochaines étapes

- [ ] Ajouter un workflow `auto-deploy.yml` déclenché par webhook
- [ ] Ajouter des notifications Slack/Discord en cas d'échec
- [ ] Implémenter blue-green deployment
- [ ] Ajouter monitoring avec Prometheus/Grafana
