# Grist WebApp — POC

Proof of concept d'un site vitrine (type "actualités / articles") dont **Grist sert de backend de données**. Le front est une SPA React qui affiche une liste d'articles (page d'accueil) et une page de détail par article. Les données ne viennent pas de Grist directement : elles transitent par un **workflow n8n** qui fait lui-même l'appel à l'API Grist côté serveur.

Ce README est destiné à donner le contexte nécessaire à une IA (ou un dev) qui reprendrait le projet à froid.

## Stack

- **React 19** + **React Router 7** (SPA, 2 routes)
- **Vite 8** comme bundler / dev server
- Pas de state management externe, pas de CSS framework (CSS brut dans `src/App.css` / `src/index.css`)
- **n8n** (instance externe, `n8n-aucarre.ethibox.fr`) comme unique intermédiaire vers Grist

## Architecture — n8n comme backend applicatif

Grist ne propose que des **tokens d'API utilisateur**. Plutôt que d'exposer ce token (directement ou via un proxy Netlify), le projet délègue entièrement l'accès aux données à un **webhook n8n** :

```
Navigateur (React) ──► Webhook n8n (x-api-key) ──► API Grist (token machine-to-machine, côté n8n)
```

- Le front appelle directement le webhook n8n : `GET {VITE_N8N_WEBHOOK_URL}?table=<NomDeLaTable>` avec le header `x-api-key: {VITE_N8N_WEBHOOK_KEY}`.
- n8n reçoit ce paramètre `table`, interroge la table Grist correspondante avec son propre token machine-to-machine (jamais exposé au front), et **aplatit** la réponse Grist (`records[].fields` → objet plat avec `id` + les champs directement à la racine) avant de la renvoyer.
- Il n'y a **plus de proxy Netlify** (le dispositif précédent — `netlify/functions/grist-proxy.js`, la redirection `netlify.toml`, le proxy dev dans `vite.config.js` — a été supprimé). Le déploiement Netlify sert désormais uniquement les fichiers statiques du build Vite, sans fonction serverless.

⚠️ Conséquence assumée : `VITE_N8N_WEBHOOK_KEY` est préfixé `VITE_`, donc **exposé dans le bundle JS** livré au navigateur (visible dans les devtools / l'onglet réseau). C'est un compromis pragmatique déjà discuté dans `SECURITY.md` pour un site à données publiques : le risque n'est pas la confidentialité des données mais l'abus/spam du webhook (à mitiger côté n8n par rate limiting / CORS restreint au domaine du site, pas côté front).

## Modèle de données

Le front appelle deux tables via le même webhook, en faisant varier le paramètre `table` (`src/config.js` → `GRIST_TABLES`) :

- **`Home`** — liste des articles affichés sur la page d'accueil (`src/pages/Home.jsx`). Champs utilisés : `Title`, `Description`, `Image_Url`, `Article` (id de l'enregistrement correspondant dans `Articles`, utilisé pour la navigation vers `/article/:id`).
- **`Articles`** — contenu détaillé d'un article (`src/pages/Detail.jsx`), résolu côté client en filtrant tous les records par `id === :id` de l'URL. Champs utilisés : `Titre`, `Image_Banner_Url`, `Contenu`.

D'autres tables pourront être ajoutées côté n8n au fur et à mesure ; il suffira de rajouter la constante correspondante dans `GRIST_TABLES` (`src/config.js`).

### Format de réponse du webhook

n8n renvoie un **tableau plat** d'objets (pas l'enveloppe `{records: [...]}` de l'API Grist native, et pas de sous-objet `fields`) :

```json
[
  {
    "id": 1,
    "Id_Article": "Article_1",
    "Titre": "L'incroyable intelligence des dauphins",
    "Image_Banner_Url": "https://...",
    "Contenu": "..."
  }
]
```

⚠️ Incohérence de nommage à noter : `Home` utilise `Title`/`Description` (anglais) alors que `Articles` utilise `Titre`/`Contenu` (français). Comportement du schéma Grist tel quel, pas un bug.

⚠️ `Detail.jsx` récupère **tous** les records de `Articles` puis filtre côté client (pas de filtre côté n8n/Grist) — acceptable pour un POC avec peu de données, à revoir si le volume grandit.

## Structure du projet

```
src/
  api/grist.js        # fetchGristRecords(tableId) — seul point d'accès aux données (appel au webhook n8n)
  config.js            # n8nConfig (url/clé du webhook) + GRIST_TABLES (constantes de noms de table)
  pages/Home.jsx        # liste des articles (table Home)
  pages/Detail.jsx      # détail d'un article (table Articles)
  components/RecordCard.jsx
  App.jsx               # routes: "/" et "/article/:id"
vite.config.js          # config Vite minimale (plus de proxy dev, plus besoin du token Grist en local)
```

## Variables d'environnement

Voir `.env.example`. À dupliquer en `.env` (non commité) :

```
VITE_N8N_WEBHOOK_URL=https://n8n-aucarre.ethibox.fr/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_N8N_WEBHOOK_KEY=xxx        # clé transmise en header x-api-key au webhook n8n
```

Ces deux variables sont préfixées `VITE_` car elles doivent être accessibles côté client (le front appelle n8n directement, sans backend intermédiaire à nous). En production sur Netlify, elles doivent être configurées dans les variables d'environnement du site (injectées au build).

## Lancer le projet

```
npm install
npm run dev       # dev server Vite, appelle directement le webhook n8n
npm run build     # build de prod
npm run preview   # preview du build
npm run lint       # eslint
```

## Points d'attention / dette connue

- `src/assets/hero.png` est présent mais n'est référencé nulle part dans le code — asset orphelin.
- La clé `VITE_N8N_WEBHOOK_KEY` est visible côté client (voir section Architecture) — la vraie protection contre l'abus doit être mise en place côté n8n (CORS restreint au domaine du site, rate limiting), pas côté front.
- Pas de gestion d'erreur réseau avancée ni de retry sur `fetchGristRecords`.
- `RecordCard` contient un lien `<a href="#">En savoir plus</a>` qui ne fait rien — le clic effectif se fait via le `onClick` du conteneur parent dans `Home.jsx`.
