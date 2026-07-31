#!/bin/sh
set -e

# Apply the Prisma schema before serving. `db push` is used rather than
# `migrate deploy` because prisma/migrations/ is not tracked in this repo.
# Without --accept-data-loss it refuses destructive changes instead of
# silently dropping columns, so a schema change that needs data migration
# will fail loudly here.
echo "→ applying prisma schema to \$DATABASE_URL"
node node_modules/prisma/build/index.js db push --skip-generate

exec "$@"
