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

## Administration

- L'acces editorial passe par `https://le-brief-media.vercel.app/admin/login`
- Le lien `Admin` n'apparait que pour une session admin valide
- Les identifiants admin locaux sont controles par `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_NAME`
