# 💰 Suivi de Dépenses — Web + Assistant IA Telegram

Application complète : site web (Next.js + Supabase) + bot Telegram qui comprend le
français et ajoute vos dépenses automatiquement, synchronisé en temps réel.

---

## 🧱 Structure du projet

```
expense-tracker/
├── app/                    # Frontend Next.js (App Router)
│   ├── login/              # Page de connexion / inscription
│   ├── dashboard/          # Page principale (protégée)
│   └── api/                 # Backend (routes API)
│       ├── expenses/        # CRUD dépenses (site web, authentifié)
│       ├── bot/add-expense/ # Endpoint utilisé par le bot Telegram
│       ├── bot/link/        # Liaison compte <-> Telegram
│       └── export/          # Export CSV
├── components/             # Composants React du dashboard
├── lib/                    # Config Supabase, OpenAI, types
├── supabase/schema.sql     # Schéma de base de données à copier-coller
├── bot/                    # Bot Telegram (service Node.js séparé)
│   ├── index.js
│   └── package.json
├── .env.example             # Variables d'environnement du site
└── bot/.env.example          # Variables d'environnement du bot
```

Le site web et le bot sont **deux services séparés** qui communiquent via une API HTTP
sécurisée par un secret partagé (`BOT_API_SECRET`).

---

## ✅ ÉTAPE 1 — Créer le projet Supabase (5 min)

1. Allez sur [supabase.com](https://supabase.com) → créez un compte gratuit.
2. Cliquez **New Project**. Choisissez un nom, un mot de passe pour la base, une région proche.
3. Une fois le projet créé, allez dans **SQL Editor** → **New query**.
4. Copiez-collez **tout le contenu** du fichier `supabase/schema.sql` → cliquez **Run**.
   Cela crée les tables `profiles` et `expenses`, la sécurité (RLS), et le temps réel.
5. Allez dans **Project Settings > API**. Notez trois valeurs (vous en aurez besoin) :
   - `Project URL` → deviendra `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → deviendra `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → deviendra `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gardez-la secrète)
6. Allez dans **Authentication > Providers** : vérifiez que **Email** est activé (c'est le cas par défaut).
7. (Recommandé pour un test rapide) Dans **Authentication > Settings**, désactivez temporairement
   "Confirm email" si vous voulez tester sans configurer l'envoi d'emails.

---

## ✅ ÉTAPE 2 — Créer votre bot Telegram (5 min)

1. Ouvrez Telegram, cherchez **@BotFather**.
2. Envoyez `/newbot`.
3. Donnez un nom (ex: `Mes Dépenses`) puis un identifiant unique finissant par `bot`
   (ex: `mesdepenses_bot`).
4. BotFather vous donne un **token** ressemblant à `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxx`.
   → C'est votre `TELEGRAM_BOT_TOKEN`. Gardez-le précieusement.

---

## ✅ ÉTAPE 3 — Obtenir une clé OpenAI (2 min)

1. Allez sur [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Créez une clé (`sk-...`) → c'est votre `OPENAI_API_KEY`.
3. Le modèle utilisé (`gpt-4o-mini`) est très économique (quelques centimes pour des centaines de messages).

---

## ✅ ÉTAPE 4 — Lancer le site en local (5 min)

```bash
cd expense-tracker
cp .env.example .env.local
```

Ouvrez `.env.local` et remplissez les 4 valeurs récupérées aux étapes 1 et 3 :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `BOT_API_SECRET` → inventez une longue chaîne aléatoire (ex: générez-en une sur
  [randomkeygen.com](https://randomkeygen.com))

Puis :

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) → créez un compte → vous arrivez sur le dashboard.
Notez le **code de liaison Telegram** affiché en haut du dashboard (ex: `A1B2C3`).

---

## ✅ ÉTAPE 5 — Lancer le bot en local (5 min)

Dans un **second terminal** :

```bash
cd expense-tracker/bot
cp .env.example .env
```

Remplissez `.env` :
- `TELEGRAM_BOT_TOKEN` (étape 2)
- `OPENAI_API_KEY` (même clé qu'à l'étape 3)
- `API_BASE_URL=http://localhost:3000` (pour le test local)
- `BOT_API_SECRET` → **exactement la même valeur** que dans `.env.local` du site

Puis :

```bash
npm install
npm start
```

Vous verrez `🤖 Bot Telegram démarré...`. Ouvrez Telegram, cherchez votre bot, envoyez `/start`.

---

## ✅ ÉTAPE 6 — Lier votre compte et tester

1. Dans Telegram, envoyez : `/link A1B2C3` (remplacez par votre vrai code).
2. Le bot confirme : `✅ Compte lié avec succès`.
3. Envoyez : `J'ai dépensé 5000 FCFA en nourriture`.
4. Le bot répond : `✅ Dépense enregistrée : 5 000 FCFA — nourriture`.
5. Retournez sur le dashboard web (sans recharger la page) → la dépense apparaît **instantanément**
   grâce à la synchronisation en temps réel Supabase.

Exemples de messages que le bot comprend :
- `Taxi 2000` → transport, 2000 FCFA
- `Ajoute 15000 pour loyer` → loyer, 15000 FCFA
- `Pharmacie 3500` → santé, 3500 FCFA
- `2000` (sans catégorie) → le bot demande : *"Dans quelle catégorie classer cette dépense ?"*

---

## 🚀 DÉPLOIEMENT EN PRODUCTION

### A. Déployer le site sur Vercel

1. Poussez ce projet sur un dépôt GitHub (le dossier `expense-tracker`, bot compris).
2. Allez sur [vercel.com](https://vercel.com) → **New Project** → importez votre dépôt GitHub.
3. **Root Directory** : laissez la racine (contient déjà `app/`, `package.json`, etc.)
   — si votre dépôt contient uniquement ce projet, ne touchez à rien.
4. Dans **Environment Variables**, ajoutez les 5 variables de `.env.example`
   (mêmes valeurs qu'en local, sauf si vous régénérez `BOT_API_SECRET`).
5. Cliquez **Deploy**. Après quelques minutes, vous obtenez une URL du type
   `https://mon-app.vercel.app`.

### B. Déployer le bot sur Railway (ou Render)

**Railway :**
1. Allez sur [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Sélectionnez votre dépôt. Dans **Settings > Root Directory**, indiquez `bot`.
3. Dans **Settings > Start Command**, indiquez `npm start` (déjà défini par défaut via `package.json`).
4. Dans **Variables**, ajoutez les 4 variables de `bot/.env.example` :
   - `TELEGRAM_BOT_TOKEN`
   - `OPENAI_API_KEY`
   - `API_BASE_URL` → mettez ici votre URL Vercel (ex: `https://mon-app.vercel.app`)
   - `BOT_API_SECRET` → **identique** à celui mis sur Vercel
5. Déployez. Railway garde le bot actif en permanence (polling Telegram).

**Render (alternative) :**
1. **New** → **Background Worker** (pas "Web Service", car le bot n'écoute pas de port HTTP).
2. Root directory : `bot`. Build command : `npm install`. Start command : `npm start`.
3. Ajoutez les mêmes 4 variables d'environnement.

### C. Mettre à jour Supabase (production)

Dans **Authentication > URL Configuration**, ajoutez votre URL Vercel comme
"Site URL" et "Redirect URL" pour que l'authentification fonctionne correctement en ligne.

---

## 🔐 Sécurité mise en place

- **Auth utilisateur** : Supabase Auth (email/mot de passe), sessions gérées par cookies sécurisés.
- **RLS (Row Level Security)** : chaque utilisateur ne peut lire/modifier que ses propres dépenses,
  appliqué au niveau de la base de données (pas seulement du code).
- **Endpoint bot protégé** : `/api/bot/add-expense` et `/api/bot/link` exigent un header
  `x-bot-secret` correspondant à `BOT_API_SECRET`. Sans ce secret, impossible d'insérer des données.
- **Validation des données** : montant vérifié (`> 0`, numérique) avant toute insertion,
  côté API et côté base (`check (amount > 0)`).
- **Clé `service_role`** : utilisée uniquement côté serveur (jamais envoyée au navigateur).

---

## ⚡ Fonctionnalités bonus incluses

- **Catégorisation automatique intelligente** : l'IA déduit la catégorie même si elle n'est pas
  écrite explicitement (ex: "taxi" → transport), avec un repli par mots-clés si OpenAI est indisponible.
- **Devise FCFA par défaut** (modifiable dans la table `profiles`, colonne `currency`).
- **Export CSV** : bouton "Exporter CSV" sur le dashboard.
- **Filtres jour / semaine / mois / tout**.
- **Graphiques** : camembert par catégorie + courbe d'évolution (Recharts).

---

## 🛠️ Dépannage rapide

| Problème | Solution |
|---|---|
| Le bot répond "compte non lié" | Renvoyez `/link VOTRE_CODE` avec le code exact affiché sur le dashboard |
| Le dashboard ne se met pas à jour en temps réel | Vérifiez que `alter publication supabase_realtime add table public.expenses;` a bien été exécuté |
| Erreur 401 sur `/api/bot/add-expense` | Vérifiez que `BOT_API_SECRET` est **identique** dans le site et dans le bot |
| L'IA ne comprend pas un message | Le bot bascule automatiquement sur une analyse par mots-clés (sans IA) |
| Impossible de se connecter après inscription | Vérifiez si "Confirm email" est activé dans Supabase — sinon confirmez via l'email reçu |

---

## 📌 Notes

- Coût de fonctionnement estimé : Supabase (gratuit jusqu'à un certain volume), Vercel (gratuit pour
  un usage personnel), Railway (~5$/mois ou crédit gratuit), OpenAI (quelques centimes par mois pour
  un usage personnel avec `gpt-4o-mini`).
- Pour ajouter WhatsApp plus tard, il faudrait utiliser l'API WhatsApp Business (Meta) ou un service
  comme Twilio — la logique de `lib/nlp.ts` et l'endpoint `/api/bot/add-expense` seraient réutilisés tels quels.
