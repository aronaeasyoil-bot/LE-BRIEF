# LE BRIEF Media

Site editorial multilingue pour LE BRIEF avec front React/Vite, back Express/tRPC, admin, magazine, evenements et publicites.

## Prerequis

- Node.js 24+
- pnpm 10.4.1

## Installation locale

1. Installer les dependances:

   ```bash
   pnpm install
   ```

2. Creer votre fichier `.env` a partir de `.env.example` et renseigner les valeurs.

3. Lancer le site en local:

   ```bash
   pnpm dev
   ```

## Commandes utiles

```bash
pnpm build
pnpm start
pnpm check
pnpm test
pnpm db:push
```

## Production

- Site Vercel: `https://le-brief-media.vercel.app`
- Les variables Vercel doivent etre definies pour `production`, `preview` et `development`
- Les endpoints SEO dynamiques exposes sont:
  - `https://www.lebrief.energy/sitemap.xml`
  - `https://www.lebrief.energy/news-sitemap.xml`
  - `https://www.lebrief.energy/rss.xml`
  - `https://www.lebrief.energy/robots.txt`

## SEO automatique

- Les articles publies ou modifies mettent a jour automatiquement les sorties SEO dynamiques:
  - sitemap principal
  - sitemap Google News
  - RSS feed
  - meta Open Graph / Twitter
  - JSON-LD `NewsArticle`
- La soumission Search Console passe par l'API `webmasters` de Google, pas par l'Indexing API.
- Pour l'activer en production, definir soit un compte Google proprietaire via OAuth:
  - `SEARCH_CONSOLE_OAUTH_CLIENT_ID`
  - `SEARCH_CONSOLE_OAUTH_CLIENT_SECRET`
  - `SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN`
  - `SEARCH_CONSOLE_PROPERTY`
- Ou un compte de service:
  - `SEARCH_CONSOLE_CLIENT_EMAIL`
  - `SEARCH_CONSOLE_PRIVATE_KEY`
  - `SEARCH_CONSOLE_PRIVATE_KEY_ID`
  - `SEARCH_CONSOLE_PROPERTY`
- Si vous utilisez le compte de service, il doit avoir acces a la propriete Search Console ciblee, soit en prefixe d'URL (`https://www.lebrief.energy/`), soit en propriete domaine (`sc-domain:lebrief.energy`).

## Automatisation Reuters Energy

- La veille Reuters passe par les flux sitemap officiels de Reuters, puis filtre uniquement les URLs de la section `https://www.reuters.com/business/energy/`.
- Le systeme ne republie ni le texte Reuters, ni les images Reuters.
- Chaque detection peut:
  - creer un article original en francais via OpenAI
  - ajouter la source originale Reuters
  - ajouter une section `Analyse LE BRIEF`
  - choisir une image libre de droits via Pexels ou Unsplash
  - publier automatiquement sur LE BRIEF si l'autopublication est active
- Un tableau `Sources automatiques` est disponible dans l'admin pour:
  - voir les articles detectes
  - voir les articles publies
  - voir les erreurs
  - activer ou couper l'autopublication
  - lancer un scan manuel
- Variables d'environnement requises pour cette automatisation:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (optionnel, defaut: `gpt-4o-mini`)
  - `UNSPLASH_ACCESS_KEY` ou `PEXELS_API_KEY`
  - `AUTO_PUBLISH_REUTERS`
  - `REUTERS_ENERGY_SOURCE_URL`
  - `CRON_SECRET`
- La route securisee declenchee par cron est `/api/cron/reuters-energy`.
- La frequence de 2 heures est fournie par le workflow GitHub `.github/workflows/reuters-energy-cron.yml`.
- Secret GitHub requis:
  - `LE_BRIEF_CRON_SECRET`
- La meme valeur doit aussi etre definie cote Vercel dans `CRON_SECRET`.
- Sur Vercel Hobby, cette approche remplace la cron native, limitee a une execution par jour.

## Administration

- L'acces editorial passe par `https://le-brief-media.vercel.app/admin/login`
- Le lien `Admin` n'apparait que pour une session admin valide
- Les identifiants admin locaux sont controles par `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_NAME`
