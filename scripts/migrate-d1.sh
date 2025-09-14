#!/usr/bin/env bash
set -euo pipefail

DB_ID=${1:-gameplaza-developmentd8bb6ff7-b731-4d5a-b22f-4b3e41c9ed8e}

echo "Applying master migration to $DB_ID (remote)"
npx wrangler d1 execute "$DB_ID" --remote --file migrations/2025-09-14_000_master.sql
echo "Done."

