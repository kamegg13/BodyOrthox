# Configuration Tailscale HTTPS pour BodyOrthox

## ✅ Installation Terminée — URL d'Accès

**Votre application BodyOrthox est accessible via :**

```
https://orthogenai.inconnu-elevator.ts.net/
```

**Pour tester sur votre Samsung S23 :**

1. Ouvrez l'app Tailscale et connectez-vous
2. Ouvrez Chrome et allez sur l'URL ci-dessus
3. Lancez une nouvelle analyse (caméra)
4. L'erreur `getUserMedia` a disparu ! ✅

---

## Prérequis

- Tailscale installé et actif sur le Raspberry Pi ✅
- Service `bodyorthox-web` fonctionnel ✅
- Compte Tailscale avec accès admin

---

## Étape 1 : Activer HTTPS dans votre Tailnet

**⚠️ IMPORTANT : À faire une seule fois (action manuelle requise)**

1. Ouvrez votre navigateur et allez sur : https://login.tailscale.com/admin/dns
2. Activez **MagicDNS** si ce n'est pas déjà fait
3. Cliquez sur **Enable HTTPS**

![Tailscale HTTPS](https://tailscale.com/files/images/solutions/serve-funnel.svg)

---

## Étape 2 : Exécuter le Script d'Installation

**Sur votre Raspberry Pi**, connectez-vous via SSH et exécutez :

```bash
ssh pi@raspberrypi.local
cd ~
./setup-tailscale-https.sh
```

Le script va automatiquement :

- ✅ Vérifier que Tailscale est actif
- ✅ Provisionner le certificat TLS Let's Encrypt
- ✅ Vérifier que le service web fonctionne
- ✅ Configurer Tailscale Serve en arrière-plan
- ✅ Afficher l'URL d'accès HTTPS

---

## Étape 3 : Accéder depuis votre Samsung S23

1. **Ouvrir l'app Tailscale** sur le téléphone
2. **Se connecter** au même compte Tailscale
3. **Ouvrir Chrome** et aller sur : `https://orthogenai.<votre-tailnet>.ts.net`
4. **L'accès caméra fonctionne !** ✅

---

## Vérification

Pour vérifier que tout fonctionne :

```bash
# Sur le Raspberry Pi
sudo tailscale serve status
```

Vous devriez voir :

```
https://orthogenai.<tailnet>.ts.net/ (Tailscale IP: 100.97.170.113)
|-- / proxy http://127.0.0.1:3000
```

---

## Commandes Utiles

### Voir le statut

```bash
sudo tailscale serve status
```

### Arrêter Tailscale Serve

```bash
sudo tailscale serve https / http://127.0.0.1:3000 off
```

### Redémarrer Tailscale Serve

```bash
sudo tailscale serve --bg https / http://127.0.0.1:3000
```

### Réinitialiser toute la configuration

```bash
sudo tailscale serve reset
```

---

## Avantages de cette Solution

- ✅ Certificats HTTPS valides (Let's Encrypt)
- ✅ Renouvellement automatique tous les 90 jours
- ✅ Fonctionne sur Android 13+ sans configuration
- ✅ Pas d'installation de CA custom
- ✅ Zero maintenance
- ✅ Accès sécurisé depuis n'importe quel appareil sur votre Tailnet

---

## Dépannage

### "HTTPS must first be enabled"

→ Allez sur https://login.tailscale.com/admin/dns et activez HTTPS

### "Permission denied"

→ Utilisez `sudo` devant les commandes `tailscale cert` et `tailscale serve`

### Le service ne démarre pas

```bash
sudo systemctl status bodyorthox-web
sudo journalctl -u bodyorthox-web -n 50
```

### Tester la connexion HTTPS

```bash
# Depuis le Pi
curl -I https://orthogenai.<votre-tailnet>.ts.net

# Depuis votre Mac (avec Tailscale actif)
curl -I https://orthogenai.<votre-tailnet>.ts.net
```

---

## Architecture

```
┌─────────────────┐
│  Samsung S23    │
│  (Tailscale)    │
└────────┬────────┘
         │ HTTPS (Let's Encrypt cert)
         ↓
┌─────────────────────────────────┐
│  Tailscale Network (100.x.x.x)  │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Raspberry Pi (orthogenai)      │
│  IP: 100.97.170.113             │
│                                 │
│  ┌──────────────────┐           │
│  │ Tailscale Serve  │           │
│  │ (reverse proxy)  │           │
│  └────────┬─────────┘           │
│           │ HTTP                │
│           ↓                     │
│  ┌──────────────────┐           │
│  │ bodyorthox-web   │           │
│  │ (serve :3000)    │           │
│  └──────────────────┘           │
└─────────────────────────────────┘
```

---

## Comparaison avec l'ancienne solution HTTP

| Critère              | HTTP (192.168.1.73:3000) | HTTPS (Tailscale Serve) |
| -------------------- | ------------------------ | ----------------------- |
| **Accès caméra**     | ❌ Bloqué par navigateur | ✅ Fonctionne           |
| **Certificat**       | ❌ Aucun                 | ✅ Let's Encrypt        |
| **Sécurité**         | ❌ Non chiffré           | ✅ TLS 1.3              |
| **Accès WiFi local** | ✅ Oui                   | ✅ Oui (via Tailscale)  |
| **Accès 4G/5G**      | ❌ Non                   | ✅ Oui (via Tailscale)  |
| **Setup**            | Simple                   | 2 minutes               |
| **Maintenance**      | Faible                   | Zéro                    |
