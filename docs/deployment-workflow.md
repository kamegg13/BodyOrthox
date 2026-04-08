# Workflow de Déploiement BodyOrthox

## Architecture Actuelle (Avril 2026)

```
┌─────────────────────────────────┐
│  Développement Local (Mac)      │
│  - bodyorthox-rn/               │
│  - npm run build:web            │
└────────────┬────────────────────┘
             │ git push
             ↓
┌─────────────────────────────────┐
│  GitHub Repository              │
│  - main branch                  │
└────────────┬────────────────────┘
             │ deploy-to-pi.sh
             ↓
┌─────────────────────────────────┐
│  Raspberry Pi (réseau local)    │
│  - /home/pi/bodyorthox-web/     │
│  - systemd: bodyorthox-web      │
│  - serve :3000                  │
└────────────┬────────────────────┘
             │ Tailscale Serve
             ↓
┌─────────────────────────────────┐
│  HTTPS via Tailscale            │
│  https://orthogenai             │
│    .inconnu-elevator.ts.net/    │
└─────────────────────────────────┘
```

---

## Déploiement d'une Nouvelle Feature

### Étape 1 : Développement Local

```bash
cd /Users/karimmeguenni-tani/BodyOrthox/bodyorthox-rn

# Développer la feature
# Tester localement avec :
npm run web

# Vérifier que tout fonctionne
# http://localhost:8081
```

---

### Étape 2 : Commit et Push

```bash
# Depuis /Users/karimmeguenni-tani/BodyOrthox

# Vérifier les changements
git status

# Ajouter les fichiers modifiés
git add bodyorthox-rn/

# Commit (format : feat|fix|refactor|docs)
git commit -m "feat: description de la nouvelle feature

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push vers GitHub
git push origin main
```

---

### Étape 3 : Déploiement sur Raspberry Pi

**Utiliser le script de déploiement mis à jour :**

```bash
# Depuis /Users/karimmeguenni-tani/BodyOrthox
./deploy-to-pi.sh
```

**Ce que fait le script :**

1. ✅ Build du bundle web (`npm run build:web`)
2. ✅ Transfert via rsync vers le Pi
3. ✅ Redémarrage du service systemd
4. ✅ Vérification Tailscale Serve
5. ✅ Affichage URL d'accès

**Temps : ~2 minutes**

---

### Étape 4 : Test sur Mobile

**Sur Samsung S23 (avec Brave) :**

1. Ouvrir **Brave** (pas Chrome - problème DNS)
2. Aller sur : `https://orthogenai.inconnu-elevator.ts.net/`
3. Tester la nouvelle feature
4. Vérifier que l'accès caméra fonctionne toujours

---

## Configuration Serveur (Déjà en Place)

### Raspberry Pi

**Service systemd : `bodyorthox-web.service`**

```ini
[Unit]
Description=BodyOrthox Web Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/bodyorthox-web
ExecStart=/usr/bin/npx serve /home/pi/bodyorthox-web -l 3000
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

**Commandes utiles :**

```bash
# Statut du service
ssh pi@raspberrypi.local "sudo systemctl status bodyorthox-web"

# Logs en temps réel
ssh pi@raspberrypi.local "sudo journalctl -u bodyorthox-web -f"

# Redémarrer manuellement
ssh pi@raspberrypi.local "sudo systemctl restart bodyorthox-web"
```

---

### Tailscale Serve

**Configuration actuelle :**

```bash
sudo tailscale serve --bg http://127.0.0.1:3000
```

**Vérifier la config :**

```bash
ssh pi@raspberrypi.local "sudo tailscale serve status"

# Résultat attendu :
# https://orthogenai.inconnu-elevator.ts.net (tailnet only)
# |-- / proxy http://127.0.0.1:3000
```

**Reconfigurer si nécessaire :**

```bash
ssh pi@raspberrypi.local
sudo tailscale serve reset
sudo tailscale serve --bg http://127.0.0.1:3000
```

---

## Accès à l'Application

### URLs

| Environnement                 | URL                                           | Protocole | getUserMedia             |
| ----------------------------- | --------------------------------------------- | --------- | ------------------------ |
| **Dev local (Mac)**           | `http://localhost:8081`                       | HTTP      | ✅ (exception localhost) |
| **Production (S23 - Brave)**  | `https://orthogenai.inconnu-elevator.ts.net/` | HTTPS     | ✅                       |
| **Production (S23 - Chrome)** | ❌ Ne fonctionne pas                          | -         | DNS issue                |
| **Production (réseau local)** | `http://192.168.1.73:3000`                    | HTTP      | ❌ Bloqué                |
| **Production (IP Tailscale)** | `http://100.97.170.113:3000`                  | HTTP      | ❌ Bloqué                |

### Navigateurs Recommandés

- ✅ **Brave** sur Android (fonctionne parfaitement)
- ✅ **Safari** sur iOS (devrait fonctionner)
- ✅ **Chrome/Firefox** sur Mac/PC (fonctionne)
- ⚠️ **Chrome** sur Android (problème DNS Tailscale)

---

## Dépannage

### Le build web échoue

```bash
cd bodyorthox-rn
rm -rf node_modules web-dist
npm install
npm run build:web
```

### Le déploiement échoue

```bash
# Vérifier connexion SSH
ssh pi@raspberrypi.local

# Vérifier espace disque
ssh pi@raspberrypi.local "df -h"

# Vérifier que le service tourne
ssh pi@raspberrypi.local "systemctl status bodyorthox-web"
```

### L'URL HTTPS ne fonctionne pas

```bash
# Vérifier Tailscale Serve
ssh pi@raspberrypi.local "sudo tailscale serve status"

# Vérifier que Tailscale est connecté
ssh pi@raspberrypi.local "tailscale status"

# Tester depuis le Mac
curl -I https://orthogenai.inconnu-elevator.ts.net/
```

### Chrome Android ne fonctionne pas

**Solution : Utiliser Brave**

Si vous voulez absolument Chrome :

1. `chrome://net-internals/#dns` → Clear host cache
2. Paramètres Android → DNS privé → Désactivé
3. Chrome → Paramètres → Confidentialité → DNS sécurisé → Désactivé

---

## Checklist Déploiement

Avant chaque déploiement :

- [ ] Tests locaux passent (`npm run web`)
- [ ] Code commité et pushé sur GitHub
- [ ] Build web réussi (`npm run build:web`)
- [ ] Déploiement exécuté (`./deploy-to-pi.sh`)
- [ ] Service redémarré avec succès
- [ ] URL HTTPS accessible (test Mac)
- [ ] Test sur S23 avec Brave
- [ ] Accès caméra fonctionne

---

## Rollback en Cas de Problème

### Rollback Git

```bash
# Voir les derniers commits
git log --oneline -5

# Revenir au commit précédent
git revert <commit-hash>
git push origin main

# Redéployer
./deploy-to-pi.sh
```

### Rollback Manuel sur Pi

```bash
# Restaurer la version précédente (si vous avez un backup)
ssh pi@raspberrypi.local
cd /home/pi
sudo cp -r bodyorthox-web.backup bodyorthox-web
sudo systemctl restart bodyorthox-web
```

---

## Maintenance

### Mise à Jour Dépendances

```bash
cd bodyorthox-rn
npm update
npm run build:web
./deploy-to-pi.sh
```

### Renouvellement Certificats

**Automatique** via Tailscale (tous les 90 jours).

Vérifier l'expiration :

```bash
curl -vI https://orthogenai.inconnu-elevator.ts.net/ 2>&1 | grep "expire date"
```

### Logs

```bash
# Logs service web
ssh pi@raspberrypi.local "sudo journalctl -u bodyorthox-web -n 100"

# Logs Tailscale
ssh pi@raspberrypi.local "sudo journalctl -u tailscaled -n 50"
```

---

## CI/CD Future (Optionnel)

**Pour automatiser le déploiement :**

Voir `.github/workflows/deploy.yml` (déjà configuré pour deployment automatique via GitHub Actions).

**Note :** Actuellement désactivé car déploiement manuel préféré.

Pour l'activer :

1. Ajouter les secrets GitHub (SSH_PRIVATE_KEY, etc.)
2. Push sur main → déploiement automatique

---

## Contact

**Problèmes Tailscale :**

- Forum : https://forum.tailscale.com/
- Docs : https://tailscale.com/kb/

**Problèmes BodyOrthox :**

- Voir logs service : `sudo journalctl -u bodyorthox-web -f`
- Voir cette doc : `/docs/troubleshooting-tailscale-android.md`
