# PEXEN — Ingénierie & Performance Énergétique

Site vitrine PEXEN et son backoffice (`/administrator`) : pages entièrement composées de blocs, aperçu en direct, SEO, formulaires, statistiques, assistant IA.

## Stack

- React 19 + Vite + Tailwind CSS v4 (site public et backoffice)
- Express (TypeScript via `tsx`)
- PostgreSQL 17 (Docker) + Drizzle ORM

## Démarrage local

**Prérequis :** Node.js 20+, Docker.

1. Installer les dépendances : `npm install`
2. Copier `.env.example` en `.env` et renseigner les valeurs (base de données, compte admin, clés)
3. Lancer PostgreSQL : `npm run db:up`
4. Construire le front : `npm run build`
5. Démarrer le serveur : `npm run dev`

Le site est servi sur le port défini par `PORT`, le backoffice sur `/administrator`.

## Scripts utiles

| Commande | Rôle |
| --- | --- |
| `npm run lint` | Vérification TypeScript |
| `npm run db:generate` | Générer une migration après modification de `server/db/schema.ts` |
| `npm run db:backup` / `db:restore` | Sauvegarde / restauration de la base |

## Documentation

Guide complet du backoffice : [docs/BACKOFFICE_PEXEN.md](docs/BACKOFFICE_PEXEN.md)
