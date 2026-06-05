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
- Pour l'activer en production, definir:
  - `SEARCH_CONSOLE_CLIENT_EMAIL`
  - `SEARCH_CONSOLE_PRIVATE_KEY`
  - `SEARCH_CONSOLE_PRIVATE_KEY_ID`
  - `SEARCH_CONSOLE_PROPERTY`
- Le compte de service Google doit avoir acces a la propriete Search Console ciblee, soit en prefixe d'URL (`https://www.lebrief.energy/`), soit en propriete domaine (`sc-domain:lebrief.energy`).

## Administration

- L'acces editorial passe par `https://le-brief-media.vercel.app/admin/login`
- Le lien `Admin` n'apparait que pour une session admin valide
- Les identifiants admin locaux sont controles par `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_NAME`
