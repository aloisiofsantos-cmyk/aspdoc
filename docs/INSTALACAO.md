# Guia de Instalação — AgilDoc

## Requisitos

| Software | Versão Mínima |
|---|---|
| Node.js | 18.x ou superior |
| npm | 9.x ou superior |
| PostgreSQL | 14.x ou superior |
| Git | Qualquer versão recente |

---

## Instalação Local (Desenvolvimento)

### Passo 1 — Clonar o projeto

```bash
git clone <url-do-repositorio> agildoc
cd agildoc
```

### Passo 2 — Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações. **Obrigatórios:**

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/agildoc_db"
JWT_SECRET="string_aleatoria_minimo_32_caracteres"
JWT_REFRESH_SECRET="outra_string_aleatoria_aqui"
```

### Passo 3 — Criar banco de dados

```bash
# Com PostgreSQL local instalado:
psql -U postgres -c "CREATE USER agildoc_user WITH PASSWORD 'senha123';"
psql -U postgres -c "CREATE DATABASE agildoc_db OWNER agildoc_user;"

# Ou com Docker:
docker run -d \
  --name agildoc_postgres \
  -e POSTGRES_DB=agildoc_db \
  -e POSTGRES_USER=agildoc_user \
  -e POSTGRES_PASSWORD=senha123 \
  -p 5432:5432 \
  postgres:15-alpine
```

### Passo 4 — Instalar dependências do backend

```bash
cd backend
npm install
```

### Passo 5 — Rodar migrações e seed

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar tabelas
npx prisma migrate dev --name init

# Popular com dados iniciais
npx ts-node prisma/seed.ts
```

**Saída esperada:**
```
🌱 Iniciando seed do banco de dados...
✅ Seed concluído com sucesso!

👤 Usuários criados:
  Admin:    admin@agildoc.com.br   / Admin@123
  Gestor:   gestor@agildoc.com.br  / Gestor@123
  Servidor: servidor@agildoc.com.br / Servidor@123
```

### Passo 6 — Iniciar o backend

```bash
npm run dev
# ✅ Banco de dados conectado
# 🚀 AgilDoc API rodando na porta 3001
```

### Passo 7 — Instalar e iniciar o frontend

```bash
cd ../frontend
npm install
npm run dev
# Frontend rodando em http://localhost:5173
```

### Passo 8 — Acessar o sistema

Abra o navegador em: **http://localhost:5173**

Credenciais de acesso:
- Admin: `admin@agildoc.com.br` / `Admin@123`
- Gestor: `gestor@agildoc.com.br` / `Gestor@123`

---

## Instalação com Docker Compose (Recomendado para produção)

### Passo 1 — Pré-requisitos

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin
```

### Passo 2 — Configurar .env

```bash
cp .env.example .env
nano .env  # Configure suas variáveis
```

### Passo 3 — Subir todos os serviços

```bash
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f backend
```

### Passo 4 — Rodar seed (primeira vez)

```bash
docker-compose exec backend npx ts-node /app/prisma/seed.ts
```

---

## Configuração de Email (SMTP)

Para que as notificações por email funcionem:

```env
SMTP_HOST=smtp.seudominio.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com.br
SMTP_PASS=sua_senha_smtp
EMAIL_FROM="AgilDoc <noreply@seudominio.com.br>"
```

**Provedores SMTP compatíveis:**
- UOL Host (smtp.uol.com.br)
- Gmail (smtp.gmail.com)
- Mailgun, SendGrid, Amazon SES

---

## Solução de Problemas

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar string de conexão
psql "$DATABASE_URL"
```

### Erro: "JWT_SECRET is too short"
O JWT_SECRET deve ter pelo menos 32 caracteres. Gere um seguro:
```bash
openssl rand -base64 32
```

### Porta já em uso
```bash
# Encontrar processo na porta 3001
lsof -i :3001
# Matar processo
kill -9 <PID>
```

### Erro de permissão nos uploads
```bash
mkdir -p uploads
chmod 755 uploads
```

---

## Próximos Passos

1. [Configurar Gov.br](GOVBR.md)
2. [Deploy em produção](DEPLOY_UOL.md)
3. Personalizar a logo e nome da organização nas configurações do sistema
4. Criar departamentos e usuários conforme a estrutura da organização
5. Configurar tipos de processo específicos da organização
