#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENV_FILE="$ROOT/.env"

set -a
source "$ENV_FILE"
set +a

BACKUP_DIR="$ROOT/backend/storage/backups/mysql"
mkdir -p "$BACKUP_DIR"

TS="$(date +%F_%H-%M-%S)"
OUT="$BACKUP_DIR/${DB_DATABASE}_${TS}.sql.gz"

docker exec sistema-web-db-1 sh -lc "mysqldump -h127.0.0.1 -P${DB_PORT} -u${DB_USERNAME} -p${DB_PASSWORD} --default-character-set=${DB_CHARSET:-utf8mb4} --single-transaction --routines --triggers ${DB_DATABASE} | gzip -c" > "$OUT"

test -s "$OUT"

echo "Backup OK: $OUT"
