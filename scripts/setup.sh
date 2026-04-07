#!/bin/bash

# ============================================
# AgilDoc - Script de Instalação Automatizada
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔═══════════════════════════════════╗"
echo "  ║   AgilDoc - Setup Automatizado    ║"
echo "  ║   Sistema de Gestão Documental    ║"
echo "  ╚═══════════════════════════════════╝"
echo -e "${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 18+ e tente novamente.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ é necessário. Versão atual: $(node -v)${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) encontrado${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}⚠️  PostgreSQL não encontrado. Certifique-se de ter o banco configurado.${NC}"
fi

# Configure .env
if [ ! -f ".env" ]; then
  echo -e "${BLUE}📋 Criando arquivo .env a partir do template...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações antes de continuar!${NC}"
  echo -e "   DATABASE_URL, JWT_SECRET e JWT_REFRESH_SECRET são obrigatórios."
  echo ""
  read -p "Pressione Enter após configurar o .env para continuar..."
fi

# Backend setup
echo -e "${BLUE}📦 Instalando dependências do backend...${NC}"
cd backend
npm install

echo -e "${BLUE}🔧 Gerando cliente Prisma...${NC}"
npx prisma generate

echo -e "${BLUE}🗄️  Executando migrações do banco...${NC}"
npx prisma migrate deploy

echo -e "${BLUE}🌱 Populando banco com dados iniciais...${NC}"
npx ts-node prisma/seed.ts

# Frontend setup
echo -e "${BLUE}📦 Instalando dependências do frontend...${NC}"
cd ../frontend
npm install

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ AgilDoc instalado com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "Para iniciar o sistema:"
echo -e "  ${BLUE}Backend:${NC}  cd backend && npm run dev"
echo -e "  ${BLUE}Frontend:${NC} cd frontend && npm run dev"
echo ""
echo -e "Acesse: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "Credenciais de acesso:"
echo -e "  Admin:    ${YELLOW}admin@agildoc.com.br${NC} / ${YELLOW}Admin@123${NC}"
echo -e "  Gestor:   ${YELLOW}gestor@agildoc.com.br${NC} / ${YELLOW}Gestor@123${NC}"
echo -e "  Servidor: ${YELLOW}servidor@agildoc.com.br${NC} / ${YELLOW}Servidor@123${NC}"
echo ""
echo -e "📚 Documentação: ${BLUE}./docs/${NC}"
