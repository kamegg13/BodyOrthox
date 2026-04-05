# Configuration des Secrets GitHub - Guide Rapide

## 🎯 Objectif

Configurer les secrets nécessaires pour le déploiement automatique de BodyOrthox sur Raspberry Pi via GitHub Actions.

## 📋 Checklist

- [ ] Créer OAuth client Tailscale
- [ ] Récupérer la clé SSH
- [ ] Ajouter les 5 secrets dans GitHub
- [ ] Tester le workflow

---

## 1️⃣ Créer OAuth Client Tailscale

### Étapes

1. Aller sur https://login.tailscale.com/admin/settings/oauth
2. Cliquer **"Generate OAuth client"**
3. Configurer :
   - **Name** : `BodyOrthox CI/CD`
   - **Scopes** : cocher `devices:write`
   - **Tags** : ajouter `tag:ci`
4. Cliquer **"Generate client"**
5. **⚠️ IMPORTANT** : Copier immédiatement le **Client ID** et le **Secret** (ne seront plus affichés)

### Ce que vous aurez

- `TS_OAUTH_CLIENT_ID` : ressemble à `k...ABC123`
- `TS_OAUTH_SECRET` : ressemble à `tskey-client-k...XYZ789`

---

## 2️⃣ Récupérer la Clé SSH

Vous utilisez déjà SSH pour vous connecter au Pi. Récupérons la clé privée :

```bash
cat ~/.ssh/id_ed25519
```

**Output attendu :**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(plusieurs lignes)
...
-----END OPENSSH PRIVATE KEY-----
```

⚠️ **Copiez TOUT le contenu** (y compris les lignes `-----BEGIN` et `-----END`).

---

## 3️⃣ Identifier le Hostname Tailscale du Pi

### Option A : Vous avez déjà Tailscale sur le Pi

```bash
ssh pi@raspberrypi.local "tailscale status | grep raspberrypi"
```

**Output exemple :**

```
100.97.170.113  orthogenai           pi@          linux   -
```

→ Le hostname est `orthogenai` (ou utilisez l'IP `100.97.170.113`)

### Option B : Tailscale pas encore installé sur le Pi

```bash
ssh pi@raspberrypi.local
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Puis relancez la commande `tailscale status`.

---

## 4️⃣ Ajouter les Secrets dans GitHub

### Aller sur la page des secrets

1. Ouvrir https://github.com/kamegg13/BodyOrthox/settings/secrets/actions
2. Cliquer **"New repository secret"** pour chaque secret ci-dessous

### Secrets à créer

| Nom du Secret          | Valeur                             | Exemple                                    |
| ---------------------- | ---------------------------------- | ------------------------------------------ |
| `TS_OAUTH_CLIENT_ID`   | Client ID Tailscale (étape 1)      | `k...ABC123`                               |
| `TS_OAUTH_SECRET`      | Secret Tailscale (étape 1)         | `tskey-client-k...XYZ789`                  |
| `RASPBERRY_PI_SSH_KEY` | Clé privée SSH complète (étape 2)  | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `RASPBERRY_PI_HOST`    | Hostname Tailscale ou IP (étape 3) | `orthogenai` ou `100.97.170.113`           |
| `RASPBERRY_PI_USER`    | Utilisateur SSH                    | `pi`                                       |

### Vérification

Après ajout, vous devriez voir 5 secrets dans la liste :

```
TS_OAUTH_CLIENT_ID         Updated XX seconds ago
TS_OAUTH_SECRET            Updated XX seconds ago
RASPBERRY_PI_SSH_KEY       Updated XX seconds ago
RASPBERRY_PI_HOST          Updated XX seconds ago
RASPBERRY_PI_USER          Updated XX seconds ago
```

---

## 5️⃣ Tester le Workflow

### Option A : Merger dans main

```bash
git checkout main
git merge feature/android-apk-build
git push origin main
```

Le workflow se déclenchera automatiquement.

### Option B : Déclenchement manuel (recommandé pour le test)

1. Aller sur https://github.com/kamegg13/BodyOrthox/actions
2. Sélectionner **"Deploy to Raspberry Pi"** dans la liste
3. Cliquer **"Run workflow"**
4. Sélectionner la branche `feature/android-apk-build`
5. Cliquer **"Run workflow"**

### Vérifier l'exécution

- ✅ **Success** : Le workflow s'est exécuté sans erreur
- ❌ **Failed** : Cliquer sur le run pour voir les logs d'erreur

---

## 🐛 Dépannage

### Erreur : "Setup Tailscale" échoue

**Cause** : OAuth credentials incorrects

**Solution** :

- Vérifier que `TS_OAUTH_CLIENT_ID` et `TS_OAUTH_SECRET` sont exacts
- Recréer un OAuth client si nécessaire

### Erreur : "Setup SSH" échoue

**Cause** : Clé SSH incorrecte ou manquante

**Solution** :

- Vérifier que `RASPBERRY_PI_SSH_KEY` contient la clé **privée** complète
- Vérifier que la clé publique est dans `~/.ssh/authorized_keys` sur le Pi :
  ```bash
  ssh pi@raspberrypi.local "cat ~/.ssh/authorized_keys"
  ```

### Erreur : "Deploy web bundle" échoue avec "Host key verification failed"

**Cause** : Le Pi n'est pas connu du runner

**Solution** : C'est géré automatiquement par l'étape "Add Raspberry Pi to known hosts", mais vérifier que `RASPBERRY_PI_HOST` est correct.

### Erreur : "Health check" échoue

**Cause** : Le service ne répond pas sur le port 3000

**Solution** :

```bash
ssh pi@raspberrypi.local "systemctl status bodyorthox-web"
ssh pi@raspberrypi.local "journalctl -u bodyorthox-web -n 50"
```

---

## 📚 Documentation complète

Voir `.github/DEPLOYMENT.md` pour plus de détails sur l'architecture et le monitoring.

---

## ✅ Prêt !

Une fois les secrets configurés, chaque push sur `main` déploiera automatiquement BodyOrthox sur votre Raspberry Pi via Tailscale ! 🚀
