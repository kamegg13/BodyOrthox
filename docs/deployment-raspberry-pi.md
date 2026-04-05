# Déploiement BodyOrthox Web sur Raspberry Pi

## Prérequis

- Raspberry Pi accessible sur le réseau local (IP: 192.168.1.73)
- SSH configuré avec `pi@raspberrypi.local`
- Node.js et npm installés sur le Pi
- Package `serve` installé globalement sur le Pi

## Déploiement initial

Le déploiement initial a été effectué et le service systemd est configuré.

## Mises à jour

Pour déployer une nouvelle version :

```bash
./deploy-to-pi.sh
```

Le script va :

1. Builder le bundle web (`npm run build:web`)
2. Transférer les fichiers vers le Pi via rsync
3. Redémarrer le service systemd

## Accès

L'application est accessible à : **http://192.168.1.73:3000**

Uniquement depuis les appareils connectés au même réseau WiFi local.

## Monitoring

**Vérifier le statut du service :**

```bash
ssh pi@raspberrypi.local "systemctl status bodyorthox-web"
```

**Voir les logs :**

```bash
ssh pi@raspberrypi.local "journalctl -u bodyorthox-web -f"
```

## Dépannage

### Le service ne démarre pas

```bash
ssh pi@raspberrypi.local "journalctl -u bodyorthox-web -n 50"
```

### Port déjà utilisé

Vérifier quel processus utilise le port 3000 :

```bash
ssh pi@raspberrypi.local "sudo lsof -i :3000"
```

### Redémarrage du service

```bash
ssh pi@raspberrypi.local "sudo systemctl restart bodyorthox-web"
```

## Désactivation

Pour arrêter le service :

```bash
ssh pi@raspberrypi.local "sudo systemctl stop bodyorthox-web"
```

Pour désactiver le démarrage automatique :

```bash
ssh pi@raspberrypi.local "sudo systemctl disable bodyorthox-web"
```

## Architecture technique

- **Serveur web** : `serve` (npm package v14.2.6)
- **Port** : 3000
- **Service systemd** : `bodyorthox-web.service`
- **Répertoire** : `/home/pi/bodyorthox-web/`
- **Redémarrage auto** : Oui (RestartSec=10s)
- **Démarrage au boot** : Oui (enabled)
