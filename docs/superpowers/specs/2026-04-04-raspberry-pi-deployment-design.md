# Déploiement BodyOrthox Web sur Raspberry Pi via Tailscale

**Date :** 2026-04-04  
**Auteur :** Claude Code  
**Statut :** Approuvé

---

## Contexte

BodyOrthox / Antidote Sport est une application React Native avec support web pour l'analyse biomécanique HKA destinée aux orthopédistes. L'application fonctionne actuellement en développement local via `npm run web`.

**Besoin :** Déployer la version web de l'application sur un Raspberry Pi accessible via Tailscale pour une utilisation en réseau privé, avec redémarrage automatique au boot.

**Contraintes :**

- Réseau privé Tailscale uniquement (pas d'accès public)
- Solution simple et légère
- Redémarrage automatique du service
- Déploiement facile pour les mises à jour

---

## Architecture générale

```
┌─────────────────┐                    ┌──────────────────────────┐
│  Mac (local)    │                    │  Raspberry Pi (Tailscale)│
│                 │                    │  IP: 100.97.170.113      │
│  Build web      │  SSH + rsync       │  Hostname: orthogenai    │
│  (npm run       ├───────────────────>│                          │
│   build:web)    │                    │  /home/pi/bodyorthox-web │
└─────────────────┘                    │                          │
                                       │  ┌────────────────────┐  │
                                       │  │ serve (port 3000)  │  │
                                       │  │ systemd service    │  │
                                       │  └────────────────────┘  │
                                       └──────────────────────────┘
                                                    │
                                                    │ http://100.97.170.113:3000
                                                    ▼
                                       ┌──────────────────────────┐
                                       │  Navigateur (Tailscale)  │
                                       │  N'importe quel appareil │
                                       │  sur le réseau           │
                                       └──────────────────────────┘
```

**Principe :**

1. Build en local dans `bodyorthox-rn/` génère le bundle web dans `web-dist/`
2. Transfert des fichiers statiques via `rsync` vers `/home/pi/bodyorthox-web`
3. Service systemd `bodyorthox-web.service` lance `serve` au démarrage
4. Application accessible via `http://100.97.170.113:3000` depuis tous les appareils Tailscale

---

## Composants

### Sur le Mac (environnement local)

**Script de build :**

- Commande : `npm run build:web` dans `bodyorthox-rn/`
- Output : `bodyorthox-rn/web-dist/` (bundle webpack de production)

**Script de déploiement :**

- Script bash automatisant build + rsync + restart
- Optionnel mais recommandé pour simplifier les déploiements

### Sur le Raspberry Pi

**Configuration SSH existante :**

- Alias : `raspberry-ts`
- IP Tailscale : `100.97.170.113`
- User : `pi`
- OS : Raspberry Pi OS

**Répertoire de déploiement :**

- Path : `/home/pi/bodyorthox-web/`
- Contenu : Fichiers statiques du build (HTML, JS, CSS, assets)
- Owner : `pi:pi`

**Package `serve` :**

- Installation : `npm install -g serve` (global sur le Pi)
- Rôle : Serveur HTTP statique ultra-léger
- Configuration : Aucune (ligne de commande uniquement)

**Service systemd :**

- Fichier : `/etc/systemd/system/bodyorthox-web.service`
- Commande exécutée : `serve /home/pi/bodyorthox-web -l 3000`
- User : `pi`
- Auto-restart : Oui (`Restart=always`)
- Démarre au boot : Oui (`WantedBy=multi-user.target`)

---

## Flux de déploiement

### Déploiement initial (première fois)

1. **Build local**

   ```bash
   cd bodyorthox-rn
   npm run build:web
   ```

2. **Créer le répertoire sur le Pi**

   ```bash
   ssh raspberry-ts "mkdir -p /home/pi/bodyorthox-web"
   ```

3. **Installer `serve` sur le Pi**

   ```bash
   ssh raspberry-ts "npm install -g serve"
   ```

4. **Transférer les fichiers**

   ```bash
   rsync -avz --delete bodyorthox-rn/web-dist/ raspberry-ts:/home/pi/bodyorthox-web/
   ```

5. **Créer le service systemd**
   - Créer le fichier `/etc/systemd/system/bodyorthox-web.service` sur le Pi
   - Contenu détaillé dans la section "Configuration systemd"

6. **Activer et démarrer le service**
   ```bash
   ssh raspberry-ts "sudo systemctl daemon-reload"
   ssh raspberry-ts "sudo systemctl enable bodyorthox-web"
   ssh raspberry-ts "sudo systemctl start bodyorthox-web"
   ```

### Déploiements suivants (mises à jour)

1. **Build local**

   ```bash
   cd bodyorthox-rn && npm run build:web
   ```

2. **Transférer les fichiers**

   ```bash
   rsync -avz --delete bodyorthox-rn/web-dist/ raspberry-ts:/home/pi/bodyorthox-web/
   ```

3. **Redémarrer le service**
   ```bash
   ssh raspberry-ts "sudo systemctl restart bodyorthox-web"
   ```

### Vérification

**Vérifier le statut du service :**

```bash
ssh raspberry-ts "systemctl status bodyorthox-web"
```

**Voir les logs en temps réel :**

```bash
ssh raspberry-ts "journalctl -u bodyorthox-web -f"
```

**Tester l'accès web :**

```bash
curl http://100.97.170.113:3000
```

Ou ouvrir `http://100.97.170.113:3000` dans un navigateur depuis n'importe quel appareil Tailscale.

---

## Configuration systemd

**Fichier : `/etc/systemd/system/bodyorthox-web.service`**

```ini
[Unit]
Description=BodyOrthox Web Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/bodyorthox-web
ExecStart=/usr/bin/env serve /home/pi/bodyorthox-web -l 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Explications :**

- `After=network.target` : Démarre après l'initialisation du réseau
- `User=pi` : Exécute sous l'utilisateur `pi` (pas de root nécessaire)
- `Restart=always` : Redémarre automatiquement en cas de crash
- `RestartSec=10` : Attend 10 secondes avant de redémarrer
- `StandardOutput/Error=journal` : Logs accessibles via `journalctl`
- `WantedBy=multi-user.target` : Démarre au boot

---

## Gestion des erreurs et monitoring

### Erreurs courantes et solutions

| Problème                       | Diagnostic                                           | Solution                                                                                                          |
| ------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Service ne démarre pas**     | `systemctl status bodyorthox-web` affiche "failed"   | Vérifier les logs : `journalctl -u bodyorthox-web -n 50`                                                          |
| **Port 3000 déjà utilisé**     | Erreur "EADDRINUSE" dans les logs                    | Changer le port dans le service systemd (`-l 3001`) ou arrêter le processus conflictuel                           |
| **Page blanche au chargement** | Console navigateur montre erreurs 404 sur les assets | Vérifier `publicPath: '/'` dans `webpack.config.js`                                                               |
| **rsync échoue**               | Permission denied                                    | `ssh raspberry-ts "sudo chown -R pi:pi /home/pi/bodyorthox-web"`                                                  |
| **serve non trouvé**           | `ExecStart` échoue avec "command not found"          | Vérifier l'installation : `ssh raspberry-ts "which serve"`. Réinstaller si nécessaire avec `npm install -g serve` |

### Monitoring

**Healthcheck simple :**

```bash
curl -f http://100.97.170.113:3000 || echo "Service down"
```

**Logs en temps réel :**

```bash
ssh raspberry-ts "journalctl -u bodyorthox-web -f"
```

**Vérifier que le service redémarre automatiquement :**

```bash
# Tuer le processus serve
ssh raspberry-ts "sudo pkill -f serve"
# Attendre 10 secondes (RestartSec)
sleep 10
# Vérifier que le service est de nouveau actif
ssh raspberry-ts "systemctl status bodyorthox-web"
```

### Backup et récupération

**Stratégie de backup :**

- **Code source** : Git (sur le Mac, déjà versionné)
- **Build statique** : Reconstruit à chaque déploiement depuis la source
- **Pas de backup nécessaire côté Pi** : Le répertoire `/home/pi/bodyorthox-web` est remplaçable à tout moment via rsync

**En cas de problème :**

1. Vérifier que le build local fonctionne : `cd bodyorthox-rn && npm run web`
2. Rebuilder : `npm run build:web`
3. Redéployer : `rsync -avz --delete web-dist/ raspberry-ts:/home/pi/bodyorthox-web/`
4. Redémarrer : `ssh raspberry-ts "sudo systemctl restart bodyorthox-web"`

---

## Script de déploiement automatisé (optionnel)

Pour simplifier les déploiements répétés, créer un script `deploy-to-pi.sh` à la racine du projet :

```bash
#!/bin/bash
set -e

echo "🔨 Build du bundle web..."
cd bodyorthox-rn
npm run build:web
cd ..

echo "📦 Transfert vers Raspberry Pi..."
rsync -avz --delete bodyorthox-rn/web-dist/ raspberry-ts:/home/pi/bodyorthox-web/

echo "🔄 Redémarrage du service..."
ssh raspberry-ts "sudo systemctl restart bodyorthox-web"

echo "✅ Déploiement terminé !"
echo "📱 Accès : http://100.97.170.113:3000"
```

**Utilisation :**

```bash
chmod +x deploy-to-pi.sh
./deploy-to-pi.sh
```

---

## Sécurité

**Réseau privé Tailscale :**

- L'application n'est accessible que depuis les appareils autorisés sur le réseau Tailscale
- Pas d'exposition publique
- Pas de HTTPS nécessaire (communication chiffrée par Tailscale)

**Permissions :**

- Service tourne sous l'utilisateur `pi` (pas de root)
- Fichiers statiques lisibles uniquement (pas de permissions d'exécution)

**Mises à jour :**

- Mettre à jour `serve` régulièrement : `ssh raspberry-ts "npm update -g serve"`
- Mettre à jour Raspberry Pi OS : `ssh raspberry-ts "sudo apt update && sudo apt upgrade"`

---

## Tests

### Tests de déploiement initial

1. **Vérifier que le build web fonctionne en local**

   ```bash
   cd bodyorthox-rn
   npm run build:web
   npm run web
   ```

   Accéder à `http://localhost:8080` et vérifier que l'application se charge

2. **Vérifier la connectivité SSH**

   ```bash
   ssh raspberry-ts "echo 'SSH OK'"
   ```

3. **Déployer et vérifier le service**
   - Suivre le flux de déploiement initial
   - Vérifier status : `ssh raspberry-ts "systemctl status bodyorthox-web"`
   - Vérifier logs : `ssh raspberry-ts "journalctl -u bodyorthox-web -n 50"`

4. **Tester l'accès web**
   - Ouvrir `http://100.97.170.113:3000` dans un navigateur
   - Vérifier que l'application charge correctement
   - Tester les fonctionnalités clés : analyse, résultats, PDF

5. **Tester le redémarrage automatique**
   - Redémarrer le Pi : `ssh raspberry-ts "sudo reboot"`
   - Attendre 2 minutes
   - Vérifier que le service est actif : `ssh raspberry-ts "systemctl status bodyorthox-web"`
   - Vérifier l'accès web : `http://100.97.170.113:3000`

### Tests de mise à jour

1. **Modifier le code** (ex: changer un texte dans l'interface)
2. **Deployer** : `./deploy-to-pi.sh`
3. **Vérifier** : Rafraîchir le navigateur et constater le changement

---

## Améliorations futures (hors scope)

- **Multi-environnement** : Déployer staging + production sur des ports différents
- **CI/CD** : Automatiser le déploiement via GitHub Actions
- **Monitoring avancé** : Prometheus + Grafana pour métriques
- **HTTPS local** : Certificat auto-signé si besoin de tester HTTPS
- **Load balancing** : Plusieurs instances `serve` derrière Nginx (overkill pour usage actuel)

---

## Checklist de déploiement initial

- [ ] Build web fonctionne en local (`npm run build:web`)
- [ ] SSH vers Raspberry Pi opérationnel (`ssh raspberry-ts`)
- [ ] Répertoire `/home/pi/bodyorthox-web` créé
- [ ] Package `serve` installé globalement sur le Pi
- [ ] Fichiers transférés via `rsync`
- [ ] Service systemd créé et activé
- [ ] Service démarré et status = active (running)
- [ ] Application accessible via `http://100.97.170.113:3000`
- [ ] Test de redémarrage du Pi confirmé
- [ ] Script de déploiement `deploy-to-pi.sh` créé (optionnel)

---

## Résumé

**Déploiement simple et efficace de la version web de BodyOrthox sur Raspberry Pi :**

- Service systemd garantit disponibilité permanente
- `serve` fournit un serveur HTTP léger et fiable
- `rsync` permet des déploiements rapides (< 30 secondes)
- Accessible uniquement via Tailscale (réseau privé sécurisé)
- Monitoring via `journalctl` et `systemctl`

**Temps de déploiement estimé :**

- Initial : ~10 minutes
- Mises à jour : ~1 minute
