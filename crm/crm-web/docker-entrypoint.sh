#!/bin/sh
set -e

echo "→ Aplicando migrações do banco (prisma migrate deploy)..."
npx prisma migrate deploy

echo "→ Garantindo usuário admin do painel..."
node scripts/seed-admin.mjs || echo "  (seed-admin pulado)"

echo "→ Subindo o crm-web..."
exec node server.js
