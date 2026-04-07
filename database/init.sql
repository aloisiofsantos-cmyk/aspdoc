-- ============================================
-- AgilDoc - Inicialização do Banco de Dados
-- ============================================
-- Este arquivo é executado automaticamente pelo Docker
-- quando o container PostgreSQL é iniciado pela primeira vez.

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para busca eficiente por texto

-- Configurações de locale para português
SET lc_collate = 'pt_BR.UTF-8';

-- Nota: As tabelas são criadas pelo Prisma Migrate.
-- Execute: npx prisma migrate deploy
-- Depois:  npx ts-node prisma/seed.ts

SELECT 'AgilDoc database initialized successfully' AS status;
