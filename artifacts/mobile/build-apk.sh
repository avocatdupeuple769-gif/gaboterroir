#!/bin/bash
# ========================================
# Script de build APK GaboTerroir
# Exécuter DEPUIS le dossier artifacts/mobile
# ========================================

set -e

echo "🌱 ===== BUILD APK GABOTERROIR ====="
echo ""

# Vérifications
if ! command -v node &> /dev/null; then
  echo "❌ Node.js non trouvé. Installe-le sur https://nodejs.org"
  exit 1
fi

if ! command -v eas &> /dev/null; then
  echo "📦 Installation de EAS CLI..."
  npm install -g eas-cli
fi

echo "✅ EAS CLI : $(eas --version)"
echo ""

# Token Expo (déjà configuré dans Replit)
echo "🔑 Connexion Expo..."
EXPO_TOKEN_VALUE="$EXPO_TOKEN"

if [ -z "$EXPO_TOKEN_VALUE" ]; then
  echo "⚠️  Token non trouvé automatiquement."
  echo "   Lance: export EXPO_TOKEN=ton_token_ici"
  echo "   Puis relance ce script."
  exit 1
fi

echo "✅ Token trouvé"
echo ""

# Vérification projet
echo "🔗 Vérification du projet Expo..."
EXPO_TOKEN=$EXPO_TOKEN_VALUE eas project:info

echo ""
echo "🏗️  Lancement du build APK (cela prend 10-20 minutes)..."
echo "   → Les serveurs Expo compilent l'app dans le cloud"
echo "   → Tu recevras un lien de téléchargement APK à la fin"
echo ""

EXPO_TOKEN=$EXPO_TOKEN_VALUE eas build \
  --platform android \
  --profile preview \
  --non-interactive

echo ""
echo "✅ Build terminé ! Télécharge ton APK depuis le lien ci-dessus."
echo ""
echo "📱 INSTALLER SUR ANDROID :"
echo "   1. Envoie le fichier .apk sur ton téléphone (WhatsApp, email, USB)"
echo "   2. Paramètres → Sécurité → Autoriser sources inconnues"
echo "   3. Ouvre le fichier APK et installe"
echo "   4. GaboTerroir apparaît dans tes applications !"
