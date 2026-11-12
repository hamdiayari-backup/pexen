# Dump PostgreSQL PEXEN

- `pexen-latest.sql` — dump SQL plain (restauration simple)
- `pexen-latest.dump` — dump custom (`pg_restore`)
- Daté : 2026-11-12

## Restaurer

```bash
# SQL
psql "$DATABASE_URL" -f backups/db/pexen-latest.sql

# ou custom
pg_restore --no-owner --no-acl -d "$DATABASE_URL" backups/db/pexen-latest.dump
```

Le fichier `.env` à la racine contient `DATABASE_URL` / `PEXEN_DB_PASSWORD`.
