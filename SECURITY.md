j'ai fait un site react, avec home page et page de détail, comme des articles, tres simple, qui puise ses données dans Grist.

L'Api Grist ne se fait que par un token utilisateur ce qui est moyennement securisé.

je choisis d'utiliser n8n comme intermediaire. Comme ca c'est n8n qui fait l'appel a grist avec le token machine to machine.

c'est un site public, je vais faire un webhook n8n pour que le site react l'appelle pour ses appels grist.

quelle auth recommande tu dans le noeud webhook. j'ai Basic Auth, Header Auth, JWT Auth et None.

1 - Que penses tu de la strategie globale
2 - quelle auth pour le webhook n8n ?

Show less

Évalué stratégie de proxy n8n et recommanda authentification légère
Évalué stratégie de proxy n8n et recommanda authentification légère
1 — La stratégie globale

C'est une bonne architecture, c'est le pattern classique "BFF" (Backend For Frontend) : le frontend ne parle jamais directement à un service tiers sensible, il passe par un intermédiaire qui, lui, détient le vrai secret (ici le token machine-to-machine Grist). C'est nettement mieux que d'exposer un token utilisateur Grist dans le bundle React, où n'importe qui peut l'extraire via les devtools.

Un point à garder en tête : n8n devient un service public de facto (ton webhook sera appelé depuis un navigateur, donc son URL est visible par tout le monde qui inspecte le réseau). Il faut donc le traiter comme une API publique à part entière, avec la logique de sécurité qui va avec (rate limiting, monitoring, pas juste "auth").

2 — Quelle auth pour le webhook ?

Ici il faut être lucide sur une limite fondamentale : ton site est un SPA React 100% client-side, sans backend à toi, sans login utilisateur. Donc tout secret que le frontend doit envoyer (Basic Auth, header API key, JWT signé côté client) sera visible dans le bundle JS ou dans l'onglet réseau. N'importe qui peut le copier-coller et appeler ton webhook directement, en dehors de ton site.

Ça veut dire que JWT n'apporte ici aucun avantage réel par rapport à Header Auth — un JWT n'a de valeur que s'il est émis par un serveur après une vraie authentification (login, session), ce qui n'existe pas dans ton cas. Faire du JWT ici serait de la sécurité en toc, plus complexe pour rien.

Donc mon classement pratique :

None → à éviter, ton webhook devient scrapable/spammable par n'importe qui qui trouve l'URL.
JWT → overkill, complexité inutile sans backend d'authentification derrière.
Basic Auth vs Header Auth (API key custom) → équivalents en sécurité réelle ici, les deux sont des secrets statiques visibles côté client. Je recommande Header Auth avec une clé API dans un header custom (genre x-api-key), c'est plus conventionnel pour ce type d'usage service-à-service et plus simple à faire tourner/roter que du Basic Auth.
Ce qui compte vraiment plus que le choix de l'auth ici, c'est ce qu'il y a autour :

CORS : restreindre Access-Control-Allow-Origin à ton domaine — ça bloque les appels depuis d'autres sites web (pas depuis curl/Postman, mais ça filtre déjà pas mal de bruit).
Rate limiting : soit dans n8n (workflow qui compte les appels), soit en mettant un CDN/proxy devant (Cloudflare gratuit fait très bien ce job) — c'est ta vraie protection contre l'abus et les coûts (quota n8n, quota Grist).
Puisque les données sont publiques (des articles), le vrai risque n'est pas la fuite de données, mais l'abus de ton infra (quelqu'un qui spam ton webhook et fait exploser ton quota n8n/Grist). C'est ce contre quoi tu dois te protéger en priorité, plus que contre "qui a le droit d'appeler l'API".
Si tu veux vraiment un secret invisible côté client, il faudrait ajouter une petite fonction serverless (Cloudflare Worker, Vercel Edge Function) entre React et n8n, qui injecte la clé côté serveur. Mais pour un site simple d'articles publics, c'est probablement disproportionné — Header Auth + CORS + rate limiting est un bon compromis pragmatique.
