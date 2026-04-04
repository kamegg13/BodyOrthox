# Déploiement BodyOrthox Web sur Raspberry Pi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Déployer la version web de BodyOrthox sur Raspberry Pi avec service systemd auto-démarrant et accessible via Tailscale.

**Architecture:** Build webpack local → rsync vers Pi → service systemd lance `serve` sur port 3000 → accessible via http://100.97.170.113:3000 depuis réseau Tailscale.

**Tech Stack:** React Native Web, webpack, rsync, systemd, serve (npm package), Tailscale

---

## File Structure

**Fichiers à créer :**

- `deploy-to-pi.sh` — Script de déploiement automatisé (local)
- `/etc/systemd/system/bodyorthox-web.service` — Service systemd (sur Pi)

**Fichiers/répertoires à modifier :**

- `bodyorthox-rn/web-dist/` — Bundle de production (généré)
- `/home/pi/bodyorthox-web/` — Répertoire de déploiement (sur Pi)

---

### Task 1: Vérification pré-déploiement

**Files:**

- Check: `bodyorthox-rn/package.json` (script build:web existe)
- Generate: `bodyorthox-rn/web-dist/` (bundle webpack)

- [ ] **Step 1: Vérifier que le script build:web existe**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox/bodyorthox-rn
grep "build:web" package.json
```

Expected output:

```
    "build:web": "webpack --config webpack.config.js --mode production",
```

- [ ] **Step 2: Builder le bundle web en local**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox/bodyorthox-rn
npm run build:web
```

Expected output:

```
webpack 5.x.x compiled successfully in XXXX ms
```

- [ ] **Step 3: Vérifier que web-dist/ contient les fichiers**

```bash
ls -la /Users/karimmeguenni-tani/BodyOrthox/bodyorthox-rn/web-dist/
```

Expected output:

```
-rw-r--r--  bundle.web.js
-rw-r--r--  index.html
drwxr-xr-x  assets/
```

- [ ] **Step 4: Vérifier la connectivité SSH vers le Pi**

```bash
ssh raspberry-ts "echo 'SSH OK'"
```

Expected output:

```
SSH OK
```

- [ ] **Step 5: Commit (pas de changement, mais documenter la vérification)**

Aucun commit nécessaire (vérifications uniquement).

---

### Task 2: Préparation du Raspberry Pi

**Files:**

- Create: `/home/pi/bodyorthox-web/` (sur Pi)
- Install: `serve` (npm global sur Pi)

- [ ] **Step 1: Créer le répertoire de déploiement sur le Pi**

```bash
ssh raspberry-ts "mkdir -p /home/pi/bodyorthox-web"
```

Expected output: (aucune sortie = succès)

- [ ] **Step 2: Vérifier que le répertoire a été créé**

```bash
ssh raspberry-ts "ls -ld /home/pi/bodyorthox-web"
```

Expected output:

```
drwxr-xr-x 2 pi pi 4096 Apr  4 XX:XX /home/pi/bodyorthox-web
```

- [ ] **Step 3: Vérifier si npm est installé sur le Pi**

```bash
ssh raspberry-ts "npm --version"
```

Expected output:

```
10.x.x (ou version supérieure)
```

Si npm n'est pas installé, exécuter :

```bash
ssh raspberry-ts "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
```

- [ ] **Step 4: Installer serve globalement sur le Pi**

```bash
ssh raspberry-ts "npm install -g serve"
```

Expected output:

```
added 1 package in Xs
```

- [ ] **Step 5: Vérifier que serve est accessible**

```bash
ssh raspberry-ts "which serve"
```

Expected output:

```
/usr/local/bin/serve
(ou /home/pi/.npm-global/bin/serve)
```

- [ ] **Step 6: Commit (documentation de la préparation)**

Aucun commit nécessaire (configuration sur Pi uniquement).

---

### Task 3: Premier transfert des fichiers

**Files:**

- Transfer: `bodyorthox-rn/web-dist/*` → `/home/pi/bodyorthox-web/` (via rsync)

- [ ] **Step 1: Transférer les fichiers via rsync**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox
rsync -avz --delete bodyorthox-rn/web-dist/ raspberry-ts:/home/pi/bodyorthox-web/
```

Expected output:

```
sending incremental file list
./
bundle.web.js
index.html
assets/
...
sent XXX bytes  received YYY bytes  ZZZ bytes/sec
total size is AAA  speedup is BBB
```

- [ ] **Step 2: Vérifier que les fichiers ont été transférés**

```bash
ssh raspberry-ts "ls -la /home/pi/bodyorthox-web/"
```

Expected output:

```
total XX
drwxr-xr-x  3 pi pi 4096 Apr  4 XX:XX .
drwxr-xr-x 18 pi pi 4096 Apr  4 XX:XX ..
drwxr-xr-x  2 pi pi 4096 Apr  4 XX:XX assets
-rw-r--r--  1 pi pi XXXX Apr  4 XX:XX bundle.web.js
-rw-r--r--  1 pi pi  XXX Apr  4 XX:XX index.html
```

- [ ] **Step 3: Vérifier les permissions (doit être pi:pi)**

```bash
ssh raspberry-ts "stat -c '%U:%G' /home/pi/bodyorthox-web"
```

Expected output:

```
pi:pi
```

- [ ] **Step 4: Commit (pas de changement git sur le projet, mais documenter le transfert)**

Aucun commit nécessaire (transfert de fichiers uniquement).

---

### Task 4: Création du service systemd

**Files:**

- Create: `/etc/systemd/system/bodyorthox-web.service` (sur Pi)

- [ ] **Step 1: Créer le fichier de service systemd via SSH**

```bash
ssh raspberry-ts "sudo tee /etc/systemd/system/bodyorthox-web.service > /dev/null" <<'EOF'
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
EOF
```

Expected output: (aucune sortie = succès)

- [ ] **Step 2: Vérifier que le fichier a été créé**

```bash
ssh raspberry-ts "sudo cat /etc/systemd/system/bodyorthox-web.service"
```

Expected output:

```
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

- [ ] **Step 3: Recharger systemd pour prendre en compte le nouveau service**

```bash
ssh raspberry-ts "sudo systemctl daemon-reload"
```

Expected output: (aucune sortie = succès)

- [ ] **Step 4: Vérifier que systemd reconnaît le service**

```bash
ssh raspberry-ts "systemctl list-unit-files | grep bodyorthox-web"
```

Expected output:

```
bodyorthox-web.service                     disabled        enabled
```

- [ ] **Step 5: Commit (pas de changement git)**

Aucun commit nécessaire (configuration système sur Pi).

---

### Task 5: Activation et démarrage du service

**Files:**

- Modify: systemd state (enable + start bodyorthox-web.service)

- [ ] **Step 1: Activer le service pour qu'il démarre au boot**

```bash
ssh raspberry-ts "sudo systemctl enable bodyorthox-web"
```

Expected output:

```
Created symlink /etc/systemd/system/multi-user.target.wants/bodyorthox-web.service → /etc/systemd/system/bodyorthox-web.service.
```

- [ ] **Step 2: Démarrer le service**

```bash
ssh raspberry-ts "sudo systemctl start bodyorthox-web"
```

Expected output: (aucune sortie = succès)

- [ ] **Step 3: Vérifier que le service est actif**

```bash
ssh raspberry-ts "systemctl status bodyorthox-web"
```

Expected output:

```
● bodyorthox-web.service - BodyOrthox Web Server
     Loaded: loaded (/etc/systemd/system/bodyorthox-web.service; enabled; preset: enabled)
     Active: active (running) since XXX
   Main PID: XXXX (node)
      Tasks: XX (limit: XXXX)
     Memory: XX.XM
        CPU: Xs
     CGroup: /system.slice/bodyorthox-web.service
             └─XXXX /usr/bin/node /usr/local/bin/serve /home/pi/bodyorthox-web -l 3000
```

- [ ] **Step 4: Vérifier les logs du service**

```bash
ssh raspberry-ts "journalctl -u bodyorthox-web -n 20 --no-pager"
```

Expected output:

```
Apr 04 XX:XX:XX orthogenai systemd[1]: Started BodyOrthox Web Server.
Apr 04 XX:XX:XX orthogenai env[XXXX]: Accepting connections at http://localhost:3000
```

- [ ] **Step 5: Commit (pas de changement git)**

Aucun commit nécessaire (configuration système sur Pi).

---

### Task 6: Vérification et tests

**Files:**

- Test: Service web accessible via http://100.97.170.113:3000

- [ ] **Step 1: Tester l'accès HTTP depuis la machine locale**

```bash
curl -I http://100.97.170.113:3000
```

Expected output:

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: XXX
...
```

- [ ] **Step 2: Tester le contenu de la page d'accueil**

```bash
curl -s http://100.97.170.113:3000 | head -10
```

Expected output:

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BodyOrthox</title>
...
```

- [ ] **Step 3: Ouvrir dans un navigateur et vérifier manuellement**

Action manuelle :

1. Ouvrir un navigateur
2. Accéder à `http://100.97.170.113:3000`
3. Vérifier que l'application BodyOrthox se charge
4. Tester les fonctionnalités de base (analyse, résultats)

Expected: Application se charge correctement, aucune erreur console.

- [ ] **Step 4: Tester le redémarrage automatique du service**

```bash
# Tuer le processus serve
ssh raspberry-ts "sudo pkill -f serve"
# Attendre 10 secondes (RestartSec dans le service)
sleep 10
# Vérifier que le service est de nouveau actif
ssh raspberry-ts "systemctl is-active bodyorthox-web"
```

Expected output:

```
active
```

- [ ] **Step 5: Vérifier que le service démarre au boot du Pi**

```bash
ssh raspberry-ts "systemctl is-enabled bodyorthox-web"
```

Expected output:

```
enabled
```

- [ ] **Step 6: Commit (documentation des tests réussis)**

Aucun commit nécessaire (tests de validation uniquement).

---

### Task 7: Création du script de déploiement automatisé

**Files:**

- Create: `deploy-to-pi.sh` (à la racine du projet)

- [ ] **Step 1: Créer le script deploy-to-pi.sh**

```bash
cat > /Users/karimmeguenni-tani/BodyOrthox/deploy-to-pi.sh <<'EOF'
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
EOF
```

Expected: Fichier créé (pas de sortie).

- [ ] **Step 2: Rendre le script exécutable**

```bash
chmod +x /Users/karimmeguenni-tani/BodyOrthox/deploy-to-pi.sh
```

Expected: (aucune sortie = succès)

- [ ] **Step 3: Vérifier les permissions du script**

```bash
ls -l /Users/karimmeguenni-tani/BodyOrthox/deploy-to-pi.sh
```

Expected output:

```
-rwxr-xr-x  1 karimmeguenni-tani  staff  XXX Apr  4 XX:XX deploy-to-pi.sh
```

- [ ] **Step 4: Ajouter le script au .gitignore ou le commiter**

Le script est utile pour le déploiement, donc on le commit.

```bash
cd /Users/karimmeguenni-tani/BodyOrthox
git add deploy-to-pi.sh
```

Expected: (aucune sortie = succès)

- [ ] **Step 5: Commit du script de déploiement**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox
git commit -m "$(cat <<'COMMIT_EOF'
feat: add deployment script for Raspberry Pi

Automated script for building and deploying web bundle to Pi via Tailscale.

Usage: ./deploy-to-pi.sh

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
COMMIT_EOF
)"
```

Expected output:

```
[feature/android-apk-build XXXXXXX] feat: add deployment script for Raspberry Pi
 1 file changed, XX insertions(+)
 create mode 100755 deploy-to-pi.sh
```

---

### Task 8: Test de mise à jour (end-to-end)

**Files:**

- Modify: `bodyorthox-rn/App.tsx` (test de modification)
- Use: `deploy-to-pi.sh` (script de déploiement)

- [ ] **Step 1: Faire une petite modification dans le code pour tester**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox/bodyorthox-rn
# Ajouter un commentaire dans App.tsx comme marqueur de test
sed -i.bak '1s/^/\/\/ Test deployment - $(date)\n/' App.tsx
```

Expected: Fichier modifié (pas de sortie).

- [ ] **Step 2: Exécuter le script de déploiement**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox
./deploy-to-pi.sh
```

Expected output:

```
🔨 Build du bundle web...
webpack 5.x.x compiled successfully in XXXX ms
📦 Transfert vers Raspberry Pi...
sending incremental file list
...
sent XXX bytes  received YYY bytes  ZZZ bytes/sec
🔄 Redémarrage du service...
✅ Déploiement terminé !
📱 Accès : http://100.97.170.113:3000
```

- [ ] **Step 3: Vérifier que le service a redémarré**

```bash
ssh raspberry-ts "systemctl status bodyorthox-web | grep Active"
```

Expected output:

```
     Active: active (running) since XXX (quelques secondes ago)
```

- [ ] **Step 4: Tester l'accès web après mise à jour**

```bash
curl -I http://100.97.170.113:3000
```

Expected output:

```
HTTP/1.1 200 OK
...
```

- [ ] **Step 5: Restaurer App.tsx (enlever le commentaire de test)**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox/bodyorthox-rn
mv App.tsx.bak App.tsx
```

Expected: Fichier restauré.

- [ ] **Step 6: Commit (pas de changement permanent dans le code)**

Aucun commit nécessaire (test temporaire restauré).

---

### Task 9: Documentation et checklist finale

**Files:**

- Create: `docs/deployment-raspberry-pi.md` (guide utilisateur)

- [ ] **Step 1: Créer un guide de déploiement utilisateur**

````bash
cat > /Users/karimmeguenni-tani/BodyOrthox/docs/deployment-raspberry-pi.md <<'EOF'
# Déploiement BodyOrthox Web sur Raspberry Pi

## Prérequis

- Raspberry Pi accessible via Tailscale (IP: 100.97.170.113)
- SSH configuré avec alias `raspberry-ts`
- Node.js et npm installés sur le Pi
- Package `serve` installé globalement sur le Pi

## Déploiement initial

Le déploiement initial a été effectué et le service systemd est configuré.

## Mises à jour

Pour déployer une nouvelle version :

```bash
./deploy-to-pi.sh
````

Le script va :

1. Builder le bundle web (`npm run build:web`)
2. Transférer les fichiers vers le Pi via rsync
3. Redémarrer le service systemd

## Accès

L'application est accessible à : http://100.97.170.113:3000

Uniquement depuis les appareils connectés au réseau Tailscale.

## Monitoring

**Vérifier le statut du service :**

```bash
ssh raspberry-ts "systemctl status bodyorthox-web"
```

**Voir les logs :**

```bash
ssh raspberry-ts "journalctl -u bodyorthox-web -f"
```

## Dépannage

### Le service ne démarre pas

```bash
ssh raspberry-ts "journalctl -u bodyorthox-web -n 50"
```

### Port déjà utilisé

Vérifier quel processus utilise le port 3000 :

```bash
ssh raspberry-ts "sudo lsof -i :3000"
```

### Redémarrage du service

```bash
ssh raspberry-ts "sudo systemctl restart bodyorthox-web"
```

## Désactivation

Pour arrêter le service :

```bash
ssh raspberry-ts "sudo systemctl stop bodyorthox-web"
```

Pour désactiver le démarrage automatique :

```bash
ssh raspberry-ts "sudo systemctl disable bodyorthox-web"
```

EOF

````

Expected: Fichier créé.

- [ ] **Step 2: Ajouter le guide à git**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox
git add docs/deployment-raspberry-pi.md
````

Expected: (aucune sortie = succès)

- [ ] **Step 3: Vérifier la checklist de déploiement**

Revue manuelle de la checklist du spec :

- [x] Build web fonctionne en local (`npm run build:web`)
- [x] SSH vers Raspberry Pi opérationnel (`ssh raspberry-ts`)
- [x] Répertoire `/home/pi/bodyorthox-web` créé
- [x] Package `serve` installé globalement sur le Pi
- [x] Fichiers transférés via `rsync`
- [x] Service systemd créé et activé
- [x] Service démarré et status = active (running)
- [x] Application accessible via `http://100.97.170.113:3000`
- [ ] Test de redémarrage du Pi confirmé (optionnel, à faire manuellement)
- [x] Script de déploiement `deploy-to-pi.sh` créé

- [ ] **Step 4: Commit du guide de déploiement**

```bash
cd /Users/karimmeguenni-tani/BodyOrthox
git commit -m "$(cat <<'COMMIT_EOF'
docs: add Raspberry Pi deployment user guide

Quick reference for deploying and monitoring the web app on Raspberry Pi.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
COMMIT_EOF
)"
```

Expected output:

```
[feature/android-apk-build XXXXXXX] docs: add Raspberry Pi deployment user guide
 1 file changed, XX insertions(+)
 create mode 100644 docs/deployment-raspberry-pi.md
```

- [ ] **Step 5: Afficher le résumé de déploiement**

```bash
echo "========================================"
echo "Déploiement BodyOrthox Web - TERMINÉ"
echo "========================================"
echo ""
echo "✅ Service systemd configuré et actif"
echo "✅ Application accessible à : http://100.97.170.113:3000"
echo "✅ Script de déploiement : ./deploy-to-pi.sh"
echo "✅ Guide utilisateur : docs/deployment-raspberry-pi.md"
echo ""
echo "Pour déployer une mise à jour :"
echo "  ./deploy-to-pi.sh"
echo ""
echo "Pour vérifier le service :"
echo "  ssh raspberry-ts 'systemctl status bodyorthox-web'"
echo ""
```

Expected output: Message de résumé affiché.

---

## Plan Self-Review

### 1. Spec Coverage

**Checklist des exigences du spec :**

- [x] Build local du bundle web (Task 1)
- [x] Création du répertoire de déploiement sur Pi (Task 2)
- [x] Installation de `serve` sur Pi (Task 2)
- [x] Transfert des fichiers via rsync (Task 3)
- [x] Création du service systemd (Task 4)
- [x] Activation du service au boot (Task 5)
- [x] Démarrage du service (Task 5)
- [x] Vérification que le service est accessible (Task 6)
- [x] Test de redémarrage automatique (Task 6)
- [x] Script de déploiement automatisé (Task 7)
- [x] Test de mise à jour end-to-end (Task 8)
- [x] Documentation utilisateur (Task 9)

Toutes les exigences du spec sont couvertes.

### 2. Placeholder Scan

Scan du plan pour "TBD", "TODO", "implement later", "add validation", etc. :

- ✅ Aucun placeholder trouvé
- ✅ Toutes les commandes sont complètes avec expected outputs
- ✅ Tous les fichiers ont des paths absolus
- ✅ Tous les steps ont des vérifications explicites

### 3. Type Consistency

Vérification de la cohérence des noms/chemins/ports :

- ✅ Port 3000 utilisé partout de manière cohérente
- ✅ Path `/home/pi/bodyorthox-web` cohérent dans toutes les commandes
- ✅ Alias SSH `raspberry-ts` cohérent
- ✅ IP Tailscale `100.97.170.113` cohérente
- ✅ Nom du service `bodyorthox-web` cohérent
- ✅ Script `deploy-to-pi.sh` cohérent

Aucune incohérence détectée.

---

## Execution Notes

**Ordre d'exécution :** Les tâches doivent être exécutées séquentiellement (1 → 9), car chaque tâche dépend de la précédente.

**Temps estimé :**

- Task 1: ~2 minutes
- Task 2: ~3 minutes
- Task 3: ~2 minutes
- Task 4: ~2 minutes
- Task 5: ~1 minute
- Task 6: ~3 minutes
- Task 7: ~2 minutes
- Task 8: ~3 minutes
- Task 9: ~2 minutes

**Total : ~20 minutes**

**Dépendances externes :**

- Connectivité SSH vers le Raspberry Pi
- Tailscale opérationnel
- npm/Node.js installé sur le Pi
- Droits sudo sur le Pi (pour systemd)
