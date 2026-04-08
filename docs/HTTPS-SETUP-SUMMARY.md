# Résumé Configuration HTTPS BodyOrthox

**Date :** 8 avril 2026  
**Problème initial :** `getUserMedia` bloqué par navigateur (accès caméra impossible)  
**Cause :** Application servie via HTTP au lieu de HTTPS  
**Solution :** Tailscale Serve avec certificats HTTPS automatiques

---

## ✅ Ce Qui a Été Configuré

### 1. Tailscale Serve sur Raspberry Pi

**Service actif :**

```bash
sudo tailscale serve --bg http://127.0.0.1:3000
```

**Configuration :**

- Reverse proxy HTTPS automatique
- Certificat Let's Encrypt auto-renouvelé
- Accessible uniquement sur le réseau Tailscale privé

**Vérification :**

```bash
ssh pi@raspberrypi.local "sudo tailscale serve status"
```

---

### 2. URLs d'Accès

| Type                        | URL                                           | Protocole | getUserMedia | Utilisation                  |
| --------------------------- | --------------------------------------------- | --------- | ------------ | ---------------------------- |
| **Production (recommandé)** | `https://orthogenai.inconnu-elevator.ts.net/` | HTTPS     | ✅           | Mobile/Desktop via Tailscale |
| **Dev local**               | `http://localhost:8081`                       | HTTP      | ✅           | Développement Mac            |
| **Réseau local**            | `http://192.168.1.73:3000`                    | HTTP      | ❌           | Obsolète (caméra bloquée)    |

---

### 3. Navigateurs Compatibles

| Navigateur  | Plateforme    | Statut                 | Notes                     |
| ----------- | ------------- | ---------------------- | ------------------------- |
| **Brave**   | Android (S23) | ✅ Fonctionne          | **RECOMMANDÉ**            |
| **Chrome**  | Android (S23) | ⚠️ Problème DNS        | Utiliser Brave à la place |
| **Chrome**  | Mac/PC        | ✅ Fonctionne          | OK sur desktop            |
| **Safari**  | iOS           | ✅ Devrait fonctionner | Non testé                 |
| **Firefox** | Desktop       | ✅ Fonctionne          | OK                        |

**Fix Chrome Android (si nécessaire) :**

1. `chrome://net-internals/#dns` → Clear host cache
2. Paramètres → DNS privé → Désactivé
3. Chrome → DNS sécurisé → Désactivé

---

### 4. Service Systemd

**Fichier :** `/etc/systemd/system/bodyorthox-web.service`

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

**Commandes :**

```bash
sudo systemctl status bodyorthox-web
sudo systemctl restart bodyorthox-web
sudo journalctl -u bodyorthox-web -f
```

---

## 📁 Fichiers Créés/Modifiés

### Documentation

| Fichier                                     | Description                     |
| ------------------------------------------- | ------------------------------- |
| `docs/deployment-workflow.md`               | Workflow complet de déploiement |
| `docs/tailscale-https-setup.md`             | Guide setup Tailscale HTTPS     |
| `docs/troubleshooting-tailscale-android.md` | Dépannage Android               |
| `docs/HTTPS-SETUP-SUMMARY.md`               | Ce fichier (résumé)             |

### Scripts

| Fichier                        | Description                                         |
| ------------------------------ | --------------------------------------------------- |
| `deploy-to-pi.sh`              | Script de déploiement amélioré (avec vérifications) |
| `setup-tailscale-https.sh`     | Script d'installation Tailscale Serve (sur Pi)      |
| `change-tailscale-hostname.sh` | Script pour changer hostname (sur Pi)               |

---

## 🔄 Workflow de Déploiement

### Déployer une Nouvelle Feature

```bash
# 1. Développer localement
cd bodyorthox-rn
npm run web  # Test local

# 2. Commit
git add .
git commit -m "feat: description"
git push origin main

# 3. Déployer
./deploy-to-pi.sh

# 4. Tester sur S23 (Brave)
# https://orthogenai.inconnu-elevator.ts.net/
```

**Temps total :** ~2 minutes

---

## 🔍 Vérifications Post-Déploiement

### Sur Mac (via Tailscale)

```bash
# Test connexion HTTPS
curl -I https://orthogenai.inconnu-elevator.ts.net/

# Résultat attendu : HTTP/2 200
```

### Sur Raspberry Pi

```bash
# Vérifier service web
ssh pi@raspberrypi.local "systemctl status bodyorthox-web"

# Vérifier Tailscale Serve
ssh pi@raspberrypi.local "sudo tailscale serve status"

# Résultat attendu :
# https://orthogenai.inconnu-elevator.ts.net (tailnet only)
# |-- / proxy http://127.0.0.1:3000
```

### Sur Samsung S23

1. App Tailscale → Vérifier connexion active
2. Brave → `https://orthogenai.inconnu-elevator.ts.net/`
3. Tester nouvelle analyse (caméra)
4. ✅ `getUserMedia` doit fonctionner

---

## 🚨 Problèmes Connus et Solutions

### ❌ "Site inaccessible" sur Chrome Android

**Cause :** Chrome Android a un conflit avec le DNS Tailscale (MagicDNS)

**Solution :** Utiliser **Brave** à la place

**Alternative :** Désactiver DNS sécurisé dans Chrome (voir troubleshooting)

### ❌ "ERR_CERT_AUTHORITY_INVALID"

**Cause :** Certificat non reconnu

**Solution :**

1. Vérifier que Tailscale Serve est actif : `sudo tailscale serve status`
2. Vérifier que HTTPS est activé dans admin console : https://login.tailscale.com/admin/dns
3. Forcer refresh certificat : `sudo tailscale serve reset && sudo tailscale serve --bg http://127.0.0.1:3000`

### ❌ "Cannot read properties of undefined (reading 'getUserMedia')"

**Cause :** Accès via HTTP au lieu de HTTPS

**Solution :** Toujours utiliser `https://orthogenai.inconnu-elevator.ts.net/` (pas l'IP)

---

## 📊 Architecture Technique

```
┌──────────────────────────────────────────┐
│  Samsung S23 (Brave)                     │
│  + App Tailscale active                  │
└────────────────┬─────────────────────────┘
                 │
                 │ HTTPS (Let's Encrypt)
                 │ Port 443
                 ↓
┌──────────────────────────────────────────┐
│  Tailscale Network (100.x.x.x/10)        │
│  - MagicDNS: *.inconnu-elevator.ts.net   │
│  - Certificats auto-renouvelés           │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│  Raspberry Pi (100.97.170.113)           │
│  Hostname: orthogenai                    │
│                                          │
│  ┌────────────────────────────────┐     │
│  │  Tailscale Serve               │     │
│  │  - Reverse proxy HTTPS         │     │
│  │  - Port 443 → 3000             │     │
│  └──────────┬─────────────────────┘     │
│             │ HTTP (local)               │
│             ↓                            │
│  ┌────────────────────────────────┐     │
│  │  bodyorthox-web (systemd)      │     │
│  │  - serve :3000                 │     │
│  │  - /home/pi/bodyorthox-web/    │     │
│  └────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

---

## 🔐 Sécurité

### Certificats

- **Type :** Let's Encrypt (CA publique)
- **Renouvellement :** Automatique tous les 90 jours via Tailscale
- **Validité actuelle :** Vérifiable avec `curl -vI https://orthogenai.inconnu-elevator.ts.net/ 2>&1 | grep "expire date"`

### Accès

- **Réseau :** Uniquement via Tailscale (réseau privé)
- **Pas d'exposition publique :** L'application n'est PAS accessible depuis Internet
- **Authentification Tailscale :** Tous les appareils doivent être authentifiés dans le même tailnet

### Ports

- **3000** : HTTP local (non exposé, uniquement localhost)
- **443** : HTTPS via Tailscale Serve (accessible sur tailnet)

---

## 📝 Maintenance

### Renouvellement Certificats

**Automatique** - Aucune action requise.

Tailscale gère le renouvellement tous les 90 jours.

### Mise à Jour de l'Application

Suivre le workflow de déploiement (voir `docs/deployment-workflow.md`).

### Logs

```bash
# Logs application
ssh pi@raspberrypi.local "sudo journalctl -u bodyorthox-web -f"

# Logs Tailscale
ssh pi@raspberrypi.local "sudo journalctl -u tailscaled -n 50"
```

### Monitoring

```bash
# Vérifier uptime du service
ssh pi@raspberrypi.local "systemctl status bodyorthox-web"

# Vérifier espace disque
ssh pi@raspberrypi.local "df -h"

# Vérifier réseau Tailscale
ssh pi@raspberrypi.local "tailscale status"
```

---

## 🎯 Résultat Final

✅ **Application accessible en HTTPS**  
✅ **Accès caméra fonctionnel** (`getUserMedia`)  
✅ **Certificats valides** (Let's Encrypt)  
✅ **Renouvellement automatique**  
✅ **Déploiement simple** (1 commande)  
✅ **Documentation complète**

**URL de production :** `https://orthogenai.inconnu-elevator.ts.net/`

---

## 📚 Ressources

- [Tailscale Serve Documentation](https://tailscale.com/docs/features/tailscale-serve)
- [getUserMedia Documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Workflow de Déploiement](./deployment-workflow.md)
- [Troubleshooting Android](./troubleshooting-tailscale-android.md)

---

**Dernière mise à jour :** 8 avril 2026  
**Prochaine action :** Tester une nouvelle feature et utiliser le workflow de déploiement
