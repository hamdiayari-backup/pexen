# Backoffice PEXEN — guide complet

## Accès

| Élément | URL / chemin |
|---------|----------------|
| Backoffice | `/administrator` |
| API admin | `/api/admin/*` (JWT) |
| API publique | `/api/public/*` |
| Sitemap | `/sitemap.xml` |
| Robots | `/robots.txt` |
| Base de données | PostgreSQL 17 (`pexen-postgres`, `127.0.0.1:5433`) |
| Sauvegardes | `backups/db/*.dump` (quotidien 03:30, 14 jours) |
| Médias | `public/uploads/` |

Identifiants : `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`.env`).

## Fonctionnalités livrées (v2 — refonte complète, aucun JSON exposé)

- **Interface** : sidebar par rôle, palette de commandes `Ctrl+K`, bandeau maintenance, garde « modifications non enregistrées », toasts, mobile.
- **Tableau de bord / Statistiques** : visiteurs, sessions, durée moyenne, rebond, pays (drapeaux), sources, appareils, pages (temps moyen), export CSV, périodes 7/30/90/365 j.
- **Pages — constructeur visuel plein écran** : structure de la page à gauche (glisser-déposer, insertion entre deux blocs, duplication, masquage, suppression), inspecteur « Contenu » (tous les textes, boutons, images, vidéos, listes, icônes, tableaux) et « Style & animation » (fond blanc/gris/dégradé/sombre/marque/photo/vidéo + voile, motif décoratif, marges, largeur, animation d’apparition, ancre, masquage mobile/ordinateur), et **aperçu réel** du site à droite (ordinateur / tablette / mobile) mis à jour à chaque frappe. Cliquer un bloc dans l’aperçu l’ouvre dans l’inspecteur. Onglet « Page » : titre, statut, planification, adresse, modèle, fiche réalisation ; bouton « SEO » ; historique des versions.
- **25 blocs** (bibliothèque par catégorie avec recherche) : bannière d’accueil, en-tête de page, texte, texte + image / vidéo, sections + encadré, image, vidéo, diaporama, galerie, bandeau défilant, cartes (5 styles), vitrine à onglets, étapes, chiffres clés, panneaux extensibles, cartes de garanties, FAQ, témoignages, tableau, appel à l’action, réalisations (liste automatique), simulateur CEE, formulaire de contact, espace, code HTML.
- **Toutes les pages du site** (23, accueil comprise) sont composées de blocs stockés en base : aucun contenu de page n’est figé dans le code. Variables utilisables dans les textes : `{{telephone}}`, `{{email}}`, `{{delai}}`, `{{societe}}`, `{{annee}}`, `{{ans2030}}`.
- **Articles** : même inspecteur de blocs, planification, révisions.
- **SEO (type Yoast/Rank Math)** : analyse en direct (score SEO + lisibilité), aperçu Google desktop/mobile au pixel, Open Graph/Twitter, robots/canonical ; réglages globaux, redirections 301/302, sitemap & robots.txt ; Google Search Console (connexion, propriété, requêtes, pages).
- **Menus** : principal, mobile, pied de page — glisser-déposer, sous-menus, bouton mis en avant, aperçu desktop/mobile ; le site public lit ces menus.
- **Formulaires** : boîte de réception (lu/non lu, archive, CSV, réponse e-mail) + constructeur de champs visuel.
- **WhatsApp & boutons flottants** : position, desktop/mobile, barre mobile (par défaut « Appeler » / « Parler de votre projet »).
- **Assistant IA** : modèle, température, quotas réels (messages/IP, sessions/IP, tokens/jour), pages d’affichage (`*`), prompt système, console de test, usage du jour.
- **Newsletter** : abonnés, double opt-in, export CSV.
- **Identité visuelle** : logos (en-tête, pied de page), favicon, 8 couleurs du thème, polices — avec aperçu réel du site (choix de la page et de l’écran) avant enregistrement.
- **Infos générales, maintenance** (IP autorisées + lien de prévisualisation secret), **paramètres**, **utilisateurs** (superadmin / editor / seo / viewer), **profil**.

## Base de données (PostgreSQL)

- Conteneur dédié : `docker-compose.db.yml` (`npm run db:up`), volume persistant `pexen_pgdata`, accessible uniquement en local.
- ORM : Drizzle — schéma `server/db/schema.ts`, migrations SQL versionnées dans `drizzle/`, appliquées automatiquement au démarrage.
- Tables : `pages`, `posts`, `revisions` (50 max par contenu), `menus`, `redirects`, `forms`, `form_submissions`, `newsletter_subscribers`, `media`, `admin_users`, `analytics_events` (rétention 400 jours, purge quotidienne), `site_settings` (réglages par section).
- Statistiques calculées en SQL (agrégats indexés), sans chargement des événements en mémoire.
- Modifier le schéma : éditer `server/db/schema.ts` → `npm run db:generate` → redémarrer.
- Sauvegarde manuelle : `npm run db:backup` · Restauration : `npm run db:restore -- backups/db/<fichier>.dump`.
- Ne pas modifier les tables CMS directement en SQL pendant que le serveur tourne (le serveur garde l'état en cache) : passer par le backoffice, ou redémarrer après.
- L'ancien `data/cms/snapshot.json` a été importé puis renommé `snapshot.json.imported-*` (copie de sécurité aussi dans `backups/`).

## Configuration production

```env
DATABASE_URL=postgres://pexen:***@127.0.0.1:5433/pexen
PEXEN_DB_PASSWORD=

GEMINI_API_KEY=
ADMIN_JWT_SECRET=
ADMIN_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://votre-domaine.fr/api/admin/google/callback

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=contact@pexen.fr
```

## Ajouter une réalisation

1. **Pages** → nouvelle page `/realisations/<nom>/`
2. Onglet **Page** → Modèle « Réalisation » → remplir la fiche (client, secteur, image, résultats)
3. Composer les blocs, publier : elle apparaît automatiquement dans les blocs « Réalisations » (accueil, secteurs, liste).

## Code

- Modèle des blocs : `server/cms/blocks.ts` · catalogue (libellés, valeurs par défaut) : `server/cms/blockCatalog.ts`
- Rendu public : `src/components/cms/` · formulaires de l’inspecteur : `src/admin/editor/blockSchemas.ts`
- Ajouter un type de bloc : type dans `blocks.ts` → entrée du catalogue → composant de rendu (`BlockRenderer.tsx`) → schéma de champs (`blockSchemas.ts`).
