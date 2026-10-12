#!/usr/bin/env bash
# Restaure une sauvegarde : scripts/db-restore.sh backups/db/pexen-AAAAMMJJ-HHMMSS.dump
set -euo pipefail
FILE="${1:?Usage : scripts/db-restore.sh <fichier.dump>}"
docker exec -i pexen-postgres pg_restore -U pexen -d pexen --clean --if-exists --no-owner < "$FILE"
pm2 restart pexen
echo "Base restaurée depuis $FILE"
