#!/bin/sh
set -e

echo "⏳ Esperando a que Postgres responda..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "✅ Base de datos lista"

echo "🔄 Generando cliente Prisma..."
bunx prisma generate

echo "📦 Ejecutando migraciones..."
bunx prisma migrate deploy

echo "👤 Creando admin (si no existe)..."
bun run scripts/create-admin.ts || true

echo "🚀 Iniciando servidor..."
exec "$@"