# Deploy AgilDoc no UOL MeuPainelHost (cPanel)

Guia completo passo a passo para publicar o AgilDoc em **https://meupainelhost.uol.com.br/**

---

## Arquitetura no UOL cPanel

```
Seu domínio (ex: agildoc.prefeitura.gov.br)
│
├── public_html/              ← Frontend React (HTML/CSS/JS estáticos)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
└── agildoc-api/              ← Backend Node.js (fora do public_html!)
    ├── app.js                ← Ponto de entrada para o cPanel
    ├── dist/                 ← TypeScript compilado
    ├── prisma/               ← Schema do banco
    ├── uploads/              ← Documentos enviados
    ├── .env                  ← Variáveis de ambiente
    └── node_modules/
```

---

## PRÉ-REQUISITOS

Verifique se seu plano UOL inclui:
- ✅ **Node.js Selector** (planos Business ou superior)
- ✅ **MySQL** (disponível em todos os planos)
- ✅ **SSH/Terminal** (recomendado, mas não obrigatório)
- ✅ **Gerenciador de Arquivos** ou **FTP**

Se seu plano não tem Node.js Selector, entre em contato com a UOL e solicite upgrade.

---

## PASSO 1 — Gerar o pacote de deploy (no seu computador)

```bash
# No seu computador local, na pasta do projeto:
bash scripts/build-uol.sh

# Isso cria a pasta deploy/ com tudo pronto
```

---

## PASSO 2 — Configurar o banco de dados MySQL

### 2.1 Acessar o cPanel
1. Acesse **https://meupainelhost.uol.com.br/**
2. Faça login com seu usuário e senha UOL

### 2.2 Criar banco de dados
1. No cPanel, clique em **"MySQL Databases"** (ou "Banco de Dados MySQL")
2. Em **"Create New Database"**, digite: `agildoc`
3. Clique em **"Create Database"**

### 2.3 Criar usuário do banco
1. Em **"MySQL Users"** → **"Add New User"**
2. **Username**: `agildoc_user`
3. **Password**: crie uma senha forte (ex: `AgilDoc@2024!`)
4. Clique em **"Create User"**

### 2.4 Associar usuário ao banco
1. Em **"Add User To Database"**
2. Selecione o usuário `agildoc_user` e o banco `cpanelusuario_agildoc`
3. Marque **"ALL PRIVILEGES"**
4. Clique em **"Make Changes"**

> **Atenção**: O nome real do banco será `cpanelusuario_agildoc` (cPanel adiciona seu prefixo de usuário automaticamente)

### 2.5 Anote as informações
```
Host:     localhost
Banco:    cpanelusuario_agildoc
Usuário:  cpanelusuario_agildoc_user
Senha:    (a que você definiu)
```

---

## PASSO 3 — Upload do Frontend

### 3.1 Pelo Gerenciador de Arquivos do cPanel
1. No cPanel → **"Gerenciador de Arquivos"** (File Manager)
2. Navegue até **`/public_html/`**
3. Clique em **"Enviar"** (Upload)
4. Envie todos os arquivos da pasta `deploy/public_html/`

> Se tiver um domínio/subdomínio próprio, envie para a pasta correspondente (ex: `/public_html/agildoc/` ou `/public_html/` se for o domínio principal)

### 3.2 Via FTP (alternativa)
Configure seu cliente FTP (FileZilla):
- **Host**: ftp.seudominio.com.br
- **Usuário**: seu usuário FTP do cPanel
- **Senha**: sua senha do cPanel
- **Porta**: 21

Transfira: `deploy/public_html/` → `/public_html/`

---

## PASSO 4 — Upload do Backend

### 4.1 Criar pasta do backend
1. No Gerenciador de Arquivos, suba um nível acima de `public_html`
2. Crie uma pasta chamada **`agildoc-api`**
   - Caminho ficará: `/home/cpanelusuario/agildoc-api/`

### 4.2 Enviar arquivos do backend
1. Navegue para `/home/cpanelusuario/agildoc-api/`
2. Envie todos os arquivos de `deploy/api/` para esta pasta

---

## PASSO 5 — Configurar o arquivo .env

1. No Gerenciador de Arquivos, navegue para `/home/cpanelusuario/agildoc-api/`
2. Renomeie `.env.example` para `.env`
3. Clique em **Editar** (Edit) no arquivo `.env`
4. Preencha os valores:

```env
# Banco MySQL da UOL
DATABASE_URL="mysql://cpanelusuario_agildoc_user:SuaSenha@localhost:3306/cpanelusuario_agildoc"

PORT=3000
NODE_ENV=production
FRONTEND_URL=https://seudominio.com.br

# Gere estas chaves em: https://generate-secret.vercel.app/64
JWT_SECRET=cole_aqui_64_caracteres_aleatorios
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=cole_aqui_outros_64_caracteres
JWT_REFRESH_EXPIRES_IN=7d

# SMTP para emails (configure com seu email UOL)
SMTP_HOST=smtp.uol.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seusite@seudominio.com.br
SMTP_PASS=sua_senha_de_email

# Caminho absoluto para uploads
UPLOAD_DIR=/home/cpanelusuario/agildoc-api/uploads

# Sua organização
ORG_NAME=Prefeitura Municipal de Exemplo
ORG_CNPJ=00.000.000/0001-00
```

---

## PASSO 6 — Configurar Node.js no cPanel

### 6.1 Acessar o Node.js Selector
1. No cPanel, procure por **"Node.js Selector"** ou **"Setup Node.js App"**
2. Clique em **"Create Application"**

### 6.2 Configurar a aplicação
Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Node.js version** | 20.x (ou 18.x) |
| **Application mode** | Production |
| **Application root** | `agildoc-api` |
| **Application URL** | `seudominio.com.br` |
| **Application startup file** | `app.js` |

3. Clique em **"Create"**

### 6.3 Instalar dependências
1. Após criar, clique em **"Run NPM Install"**
2. Aguarde (pode demorar 2-5 minutos)

---

## PASSO 7 — Criar tabelas e dados iniciais

### 7.1 Via Terminal SSH (recomendado)
```bash
ssh cpanelusuario@seudominio.com.br

cd ~/agildoc-api

# Gerar cliente Prisma
npx prisma generate

# Criar tabelas no banco
npx prisma migrate deploy

# Ou, se preferir sincronizar diretamente (sem migrações):
npx prisma db push

# Popular com dados iniciais
npx ts-node prisma/seed.ts
```

### 7.2 Via cPanel Terminal (alternativa)
1. No cPanel → **"Terminal"**
2. Execute os mesmos comandos acima

---

## PASSO 8 — Configurar proxy API no .htaccess (IMPORTANTE)

O frontend precisa redirecionar chamadas `/api/` para o Node.js. Edite o `.htaccess` em `public_html/`:

```apache
Options -MultiViews
RewriteEngine On

# Segurança
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Cache assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

# Proxy das requisições /api/ para o Node.js (porta 3000)
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/
</IfModule>

# SPA React - todas rotas para index.html
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
```

> **Se mod_proxy não funcionar**: Altere `VITE_API_URL` no frontend para a URL completa do Node.js e recompile.

---

## PASSO 9 — Reiniciar a aplicação

1. No cPanel → Node.js Selector
2. Encontre sua aplicação `agildoc-api`
3. Clique em **"Restart"**

---

## PASSO 10 — Verificar se funcionou

1. Acesse: `https://seudominio.com.br/api/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`
2. Acesse: `https://seudominio.com.br`
   - Deve aparecer a tela de login do AgilDoc

### Credenciais iniciais:
| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@agildoc.com.br | Admin@123 |
| Gestor | gestor@agildoc.com.br | Gestor@123 |
| Servidor | servidor@agildoc.com.br | Servidor@123 |

> **Altere as senhas imediatamente após o primeiro acesso!**

---

## Alternativa: PostgreSQL Gratuito (Neon.tech)

Se preferir usar PostgreSQL em vez de MySQL:

1. Acesse **https://neon.tech** e crie conta gratuita
2. Crie um novo projeto: `agildoc`
3. Copie a connection string (formato: `postgresql://usuario:senha@ep-xxx.neon.tech/agildoc?sslmode=require`)
4. No `.env`, use:
   ```env
   DATABASE_URL="postgresql://usuario:senha@ep-xxx.neon.tech/agildoc?sslmode=require"
   ```
5. Copie o arquivo `backend/prisma/schema.prisma` original (PostgreSQL) para o servidor
6. Execute `npx prisma migrate deploy`

---

## Problemas Comuns

### "Cannot find module" no Node.js
```bash
cd ~/agildoc-api && npm install --production
```

### Banco de dados não conecta
- Verifique se o nome do banco tem o prefixo correto (cpanelusuario_...)
- Teste: `mysql -u cpanelusuario_user -p cpanelusuario_agildoc`

### Página em branco no frontend
- Verifique se o `.htaccess` está correto
- Verifique se todos os arquivos foram enviados
- Acesse `https://seudominio.com.br/index.html` diretamente

### API retorna 502 Bad Gateway
- Node.js não está rodando → cPanel → Node.js Selector → Restart
- Verifique logs: `cat ~/agildoc-api/logs/error.log`

### Uploads não funcionam
```bash
chmod 755 ~/agildoc-api/uploads
```

### SSL/HTTPS não funciona
- No cPanel → SSL/TLS → Let's Encrypt (grátis)
- Ative SSL para seu domínio

---

## Suporte UOL

- Suporte técnico: 0800 775 7835
- Chat: https://meupainelhost.uol.com.br
- Documentação cPanel: https://docs.cpanel.net
