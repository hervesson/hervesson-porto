-- Roda uma vez, no primeiro boot do Postgres.
-- O banco "crm" já é criado pelo POSTGRES_DB. Aqui criamos o "evolution".
SELECT 'CREATE DATABASE evolution'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evolution')\gexec
