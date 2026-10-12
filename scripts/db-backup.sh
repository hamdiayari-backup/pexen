#!/usr/bin/env bash
# Sauvegarde quotidienne de la base PEXEN (format custom pg_dump, restaurable avec pg_restore).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/backups/db"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$DIR"
FILE="$DIR/pexen-$(date +%Y%m%d-%H%M%S).dump"
docker exec pexen-postgres pg_dump -U pexen -d pexen -Fc > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"
find "$DIR" -name 'pexen-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "Sauvegarde : $FILE"
