#!/bin/sh
set -eu

mkdir -p /app/data "${UPLOADS_DIR:-uploads}"
npx prisma db push --skip-generate
node dist/index.js
