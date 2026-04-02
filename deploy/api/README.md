# GaboTerroir API Server — Déploiement

Ce dossier contient le serveur API GaboTerroir prêt à déployer.

## Options de déploiement gratuites

### Option 1 : Railway (Recommandé - le plus simple)

1. Créer un compte sur [railway.app](https://railway.app)
2. Nouveau projet → "Deploy from GitHub repo"
3. Sélectionner ce dossier `deploy/api/` comme racine du projet
4. Railway détectera le Dockerfile automatiquement
5. Ajouter une base de données PostgreSQL :
   - Cliquer "New Service" → "Database" → "PostgreSQL"
   - Copier la variable `DATABASE_URL` générée
6. Configurer les variables d'environnement :
   - `DATABASE_URL` = URL de la base PostgreSQL Railway
   - Les autres variables sont optionnelles (voir `.env.example`)
7. Déployer — l'URL sera du type `https://gaboterroir-api.up.railway.app`

### Option 2 : Render (Gratuit mais dort après 15 min d'inactivité)

1. Créer un compte sur [render.com](https://render.com)
2. New → Web Service → GitHub
3. Sélectionner ce dossier
4. Runtime: Docker
5. Ajouter PostgreSQL : New → PostgreSQL (tier Free)
6. Copier `DATABASE_URL` dans les variables d'environnement du service
7. Deploy

### Option 3 : Fly.io (Gratuit - 3 machines offertes)

```bash
fly auth login
fly launch
fly postgres create
fly secrets set DATABASE_URL=postgresql://...
fly deploy
```

---

## Après déploiement

### 1. Mettre à jour l'app mobile

Dans le fichier `artifacts/mobile/lib/api.ts`, l'URL sera automatiquement détectée
via la variable `EXPO_PUBLIC_API_URL`.

Si tu rebuildes l'APK, ajoute dans `artifacts/mobile/app.json` sous `extra` :
```json
{
  "extra": {
    "apiUrl": "https://TON-APP.up.railway.app/api/v1"
  }
}
```

Ou configure la variable d'environnement EAS :
```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://TON-APP.up.railway.app/api/v1"
```

### 2. Configurer le webhook SMS Africa's Talking

Dans le tableau de bord Africa's Talking → SMS → Callback URL :
```
https://TON-APP.up.railway.app/api/v1/sms/incoming
```

### 3. Configurer les callbacks Airtel/Moov Money

- Airtel Money callback : `https://TON-APP.up.railway.app/api/v1/payments/airtel/callback`
- Moov Money callback : `https://TON-APP.up.railway.app/api/v1/payments/moov/callback`

---

## Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DATABASE_URL` | ✅ Oui | PostgreSQL URL |
| `AT_API_KEY` | Non | Africa's Talking (SMS non envoyés si absent) |
| `AT_USERNAME` | Non | Africa's Talking username (défaut: sandbox) |
| `AIRTEL_CLIENT_ID` | Non | Airtel Money (paiements simulés si absent) |
| `AIRTEL_CLIENT_SECRET` | Non | Airtel Money |
| `AIRTEL_API_URL` | Non | Airtel Money API URL |
| `MOOV_API_KEY` | Non | Moov Money (paiements simulés si absent) |
| `MOOV_API_URL` | Non | Moov Money API URL |
| `PORT` | Auto | Port du serveur (généralement défini par l'hébergeur) |

## Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/healthz` | Vérification santé |
| GET | `/api/v1/products` | Liste des produits |
| POST | `/api/v1/products` | Créer un produit |
| POST | `/api/v1/orders` | Créer une commande |
| POST | `/api/v1/users` | Créer/retrouver un utilisateur |
| POST | `/api/v1/sms/incoming` | Webhook SMS entrant |
| POST | `/api/v1/ussd` | Handler USSD |
| POST | `/api/v1/payments/airtel/callback` | Callback Airtel Money |
| POST | `/api/v1/payments/moov/callback` | Callback Moov Money |
