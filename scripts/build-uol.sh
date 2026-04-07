#!/bin/bash

# ============================================================
# AgilDoc - Script de build para deploy no UOL MeuPainelHost
# ============================================================
# Execute este script no SEU COMPUTADOR antes de fazer upload
# Resultado: pasta deploy/ pronta para enviar ao servidor

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

echo -e "${BLUE}"
echo "  ╔════════════════════════════════════════╗"
echo "  ║  AgilDoc - Build para UOL MeuPainel   ║"
echo "  ╚════════════════════════════════════════╝"
echo -e "${NC}"

# Limpar deploy anterior
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/api"
mkdir -p "$DEPLOY_DIR/public_html"

echo -e "${BLUE}📦 [1/5] Instalando dependências do backend...${NC}"
cd "$ROOT_DIR/backend"
npm install

echo -e "${BLUE}🔧 [2/5] Compilando backend TypeScript...${NC}"
# Usar schema MySQL se existir
if [ -f "prisma/schema.mysql.prisma" ]; then
  cp prisma/schema.prisma prisma/schema.prisma.bak
  cp prisma/schema.mysql.prisma prisma/schema.prisma
fi

npx prisma generate
npm run build

# Restaurar schema original
if [ -f "prisma/schema.prisma.bak" ]; then
  mv prisma/schema.prisma.bak prisma/schema.prisma
fi

echo -e "${BLUE}📋 [3/5] Copiando arquivos do backend...${NC}"
cp -r dist "$DEPLOY_DIR/api/"
cp -r prisma "$DEPLOY_DIR/api/"
cp app.js "$DEPLOY_DIR/api/"
cp package.json "$DEPLOY_DIR/api/"
cp package-lock.json "$DEPLOY_DIR/api/" 2>/dev/null || true

# Copiar schema MySQL para uso no servidor
cp prisma/schema.mysql.prisma "$DEPLOY_DIR/api/prisma/schema.prisma"

# Criar .env de exemplo para o servidor
cp "$ROOT_DIR/.env.uol" "$DEPLOY_DIR/api/.env.example"
echo "" >> "$DEPLOY_DIR/api/.env.example"
echo "# RENOMEIE ESTE ARQUIVO PARA .env E PREENCHA OS VALORES" >> "$DEPLOY_DIR/api/.env.example"

# Criar pasta uploads
mkdir -p "$DEPLOY_DIR/api/uploads"
echo "Pasta de uploads - não versionar arquivos aqui" > "$DEPLOY_DIR/api/uploads/.gitkeep"

echo -e "${BLUE}🌐 [4/5] Compilando frontend (React)...${NC}"
cd "$ROOT_DIR/frontend"
npm install

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}⚠️  Arquivo frontend/.env.production não encontrado.${NC}"
  echo -e "   Criando com URL padrão... Edite depois com seu domínio real."
  echo "VITE_API_URL=https://seudominio.com.br/api" > .env.production
fi

npm run build

echo -e "${BLUE}📁 [5/5] Copiando frontend compilado...${NC}"
cp -r dist/. "$DEPLOY_DIR/public_html/"

# Copiar .htaccess
if [ -f "public/.htaccess" ]; then
  cp public/.htaccess "$DEPLOY_DIR/public_html/.htaccess"
fi

# Criar .htaccess se não existir
if [ ! -f "$DEPLOY_DIR/public_html/.htaccess" ]; then
  cat > "$DEPLOY_DIR/public_html/.htaccess" << 'HTACCESS'
Options -MultiViews
RewriteEngine On

<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
HTACCESS
fi

# Gerar arquivo de instruções
cat > "$DEPLOY_DIR/LEIA-ME-PRIMEIRO.txt" << 'README'
╔══════════════════════════════════════════════════════════════╗
║           AgilDoc - Pacote de Deploy para UOL               ║
╚══════════════════════════════════════════════════════════════╝

CONTEÚDO DESTE PACOTE:
├── public_html/     → Upload para pasta public_html do seu domínio
└── api/             → Upload para pasta agildoc-api/ (fora do public_html)

PRÓXIMOS PASSOS (siga o guia completo em docs/DEPLOY_UOL_CPANEL.md):

1. BANCO DE DADOS:
   - No cPanel → MySQL Databases → crie o banco e usuário
   - Ou acesse neon.tech para PostgreSQL gratuito

2. FRONTEND (public_html/):
   - Via FTP ou Gerenciador de Arquivos do cPanel
   - Envie TUDO de public_html/ para /public_html/ do domínio

3. BACKEND (api/):
   - Crie pasta agildoc-api/ fora do public_html
   - Envie TUDO de api/ para agildoc-api/
   - Renomeie .env.example para .env e configure as variáveis

4. NODE.JS NO CPANEL:
   - cPanel → Node.js Selector → Create Application
   - Application root: agildoc-api
   - Startup file: app.js
   - Node.js version: 18 ou 20

5. BANCO - MIGRAR TABELAS:
   - No terminal SSH: cd ~/agildoc-api && npx prisma migrate deploy
   - Depois: npx ts-node prisma/seed.ts

6. ACESSE O SISTEMA:
   - URL: https://seudominio.com.br
   - Admin: admin@agildoc.com.br / Admin@123

SUPORTE: Consulte docs/DEPLOY_UOL_CPANEL.md para guia completo com imagens.
README

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Build concluído! Pasta: deploy/${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  📁 ${BLUE}deploy/public_html/${NC} → enviar para /public_html/ no cPanel"
echo -e "  📁 ${BLUE}deploy/api/${NC}         → enviar para /agildoc-api/ no cPanel"
echo ""
echo -e "  Leia ${YELLOW}deploy/LEIA-ME-PRIMEIRO.txt${NC} para os próximos passos"
echo -e "  Guia completo: ${YELLOW}docs/DEPLOY_UOL_CPANEL.md${NC}"
echo ""
