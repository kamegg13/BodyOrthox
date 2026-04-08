#!/bin/bash
set -e

echo "🚀 Déploiement BodyOrthox vers Raspberry Pi"
echo "==========================================="
echo ""

# Étape 1: Build
echo "1️⃣ Build du bundle web..."
cd bodyorthox-rn
npm run build:web
cd ..
echo "   ✅ Build terminé"
echo ""

# Étape 2: Transfert
echo "2️⃣ Transfert vers Raspberry Pi..."
rsync -avz --delete --progress bodyorthox-rn/web-dist/ pi@raspberrypi.local:/home/pi/bodyorthox-web/
echo "   ✅ Transfert terminé"
echo ""

# Étape 3: Redémarrage du service
echo "3️⃣ Redémarrage du service web..."
ssh pi@raspberrypi.local "sudo systemctl restart bodyorthox-web"
sleep 2
echo "   ✅ Service redémarré"
echo ""

# Étape 4: Vérification du service
echo "4️⃣ Vérification du service..."
if ssh pi@raspberrypi.local "systemctl is-active --quiet bodyorthox-web"; then
    echo "   ✅ Service actif"
else
    echo "   ❌ Service non actif - Voir les logs:"
    echo "      ssh pi@raspberrypi.local 'sudo journalctl -u bodyorthox-web -n 20'"
    exit 1
fi
echo ""

# Étape 5: Vérification Tailscale Serve
echo "5️⃣ Vérification Tailscale Serve..."
TAILSCALE_URL=$(ssh pi@raspberrypi.local "sudo tailscale serve status 2>/dev/null | grep 'https://' | awk '{print \$1}'")
if [ -n "$TAILSCALE_URL" ]; then
    echo "   ✅ Tailscale Serve actif"
else
    echo "   ⚠️  Tailscale Serve non configuré - Configuration..."
    ssh pi@raspberrypi.local "sudo tailscale serve --bg http://127.0.0.1:3000"
    TAILSCALE_URL=$(ssh pi@raspberrypi.local "sudo tailscale serve status | grep 'https://' | awk '{print \$1}'")
fi
echo ""

# Résumé
echo "✨ Déploiement terminé avec succès!"
echo ""
echo "🌍 URLs d'accès:"
echo "   HTTPS (recommandé) : $TAILSCALE_URL"
echo "   HTTP (local)       : http://192.168.1.73:3000"
echo ""
echo "📱 Sur Samsung S23:"
echo "   1. Ouvrir Brave (pas Chrome - problème DNS)"
echo "   2. Aller sur: $TAILSCALE_URL"
echo ""
echo "🔍 Commandes utiles:"
echo "   Logs      : ssh pi@raspberrypi.local 'sudo journalctl -u bodyorthox-web -f'"
echo "   Statut    : ssh pi@raspberrypi.local 'sudo systemctl status bodyorthox-web'"
echo "   Tailscale : ssh pi@raspberrypi.local 'sudo tailscale serve status'"
echo ""
