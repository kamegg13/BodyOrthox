#!/bin/bash
set -e

# Vérifier que le nouveau hostname est fourni
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <nouveau-hostname>"
    echo ""
    echo "Exemple: $0 bodyorthox"
    echo ""
    echo "L'URL Tailscale sera: https://<nouveau-hostname>.inconnu-elevator.ts.net"
    exit 1
fi

NEW_HOSTNAME="$1"

echo "🔧 Changement du hostname Tailscale pour BodyOrthox"
echo "=================================================="
echo ""
echo "Ancien hostname: $(hostname)"
echo "Nouveau hostname: $NEW_HOSTNAME"
echo ""

# Étape 1: Changer le hostname système
echo "1️⃣ Changement du hostname système..."
sudo hostnamectl set-hostname "$NEW_HOSTNAME"
echo "   ✅ Hostname changé"
echo ""

# Étape 2: Mettre à jour /etc/hosts
echo "2️⃣ Mise à jour de /etc/hosts..."
sudo sed -i "s/127.0.1.1.*/127.0.1.1\t$NEW_HOSTNAME/" /etc/hosts
echo "   ✅ /etc/hosts mis à jour"
echo ""

# Étape 3: Redémarrer Tailscale pour prendre en compte le nouveau hostname
echo "3️⃣ Redémarrage de Tailscale..."
sudo systemctl restart tailscaled
sleep 2
echo "   ✅ Tailscale redémarré"
echo ""

# Étape 4: Réinitialiser et reconfigurer Tailscale Serve
echo "4️⃣ Reconfiguration de Tailscale Serve..."
sudo tailscale serve reset
sleep 1
sudo tailscale serve --bg http://127.0.0.1:3000
echo "   ✅ Tailscale Serve reconfiguré"
echo ""

# Étape 5: Afficher la nouvelle URL
echo "✨ Changement terminé!"
echo ""
echo "🌍 Nouvelle URL d'accès:"
TAILSCALE_URL=$(sudo tailscale serve status | grep "https://" | awk '{print $1}')
echo "   $TAILSCALE_URL"
echo ""
echo "📱 Sur votre Samsung S23:"
echo "   1. Rafraîchissez l'app Tailscale"
echo "   2. Ouvrez Chrome et allez sur la nouvelle URL"
echo ""
