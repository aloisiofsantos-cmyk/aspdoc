# ✅ PUBLICAR AGILDOC NO UOL — Passo a Passo Completo

> Banco MySQL já criado. Siga os passos abaixo.

---

## PASSO 1 — Criar as tabelas (phpMyAdmin) ← VOCÊ ESTÁ AQUI

1. Acesse o cPanel: **https://meupainelhost.uol.com.br/**
2. Clique em **phpMyAdmin**
3. No menu esquerdo, clique no **nome do seu banco** (ex: `usuario_agildoc`)
4. Clique na aba **SQL** no topo
5. Cole TODO o conteúdo do arquivo:
   ```
   database/agildoc_mysql_completo.sql
   ```
6. Clique em **Executar** (ou "Go")
7. Deve aparecer: "14 tabelas criadas com sucesso"

**Credenciais criadas automaticamente:**
| Email | Senha | Perfil |
|-------|-------|--------|
| admin@agildoc.com.br | Admin@123 | Super Admin |
| gestor@agildoc.com.br | Gestor@123 | Gestor |
| servidor@agildoc.com.br | Servidor@123 | Servidor |

---

## PASSO 2 — Configurar o arquivo .env do backend

1. No cPanel → **Gerenciador de Arquivos**
2. Navegue para `/home/usuario/agildoc-api/`
3. Renomeie `.env.example` → `.env`
4. Clique em **Editar** e preencha:

```env
# MySQL da UOL — substitua pelos seus dados reais
DATABASE_URL="mysql://USUARIO_BANCO:SENHA_BANCO@localhost:3306/NOME_BANCO"

PORT=3000
NODE_ENV=production
FRONTEND_URL=https://seudominio.com.br

# Chaves JWT — gere em: https://generate-secret.vercel.app/64
JWT_SECRET=cole_64_caracteres_aqui
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=cole_outros_64_caracteres_aqui
JWT_REFRESH_EXPIRES_IN=7d

# Email (opcional — pode deixar em branco inicialmente)
SMTP_HOST=smtp.uol.com.br
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# Pasta de uploads no servidor
UPLOAD_DIR=/home/USUARIO_UOL/agildoc-api/uploads
MAX_FILE_SIZE=20971520
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Sua organização
ORG_NAME=Prefeitura Municipal de Exemplo
ORG_CNPJ=00.000.000/0001-00
```

**Como descobrir o DATABASE_URL correto:**
- No cPanel → MySQL Databases, você vê:
  - Banco: `cpanelusuario_agildoc`
  - Usuário: `cpanelusuario_agildoc_user`
  - Host: `localhost`
- Então fica: `mysql://cpanelusuario_agildoc_user:senha@localhost:3306/cpanelusuario_agildoc`

---

## PASSO 3 — Upload dos arquivos

### 3A — Frontend (arquivos HTML/JS/CSS)

Envie o conteúdo de `deploy/public_html/` para `/public_html/` no cPanel.

**Via Gerenciador de Arquivos:**
1. cPanel → Gerenciador de Arquivos → `public_html`
2. Clique em **Enviar Arquivo** (Upload)
3. Envie um ZIP com o conteúdo de `deploy/public_html/`
4. Descompacte dentro do `public_html`

**Arquivos que devem estar em /public_html/:**
```
public_html/
├── index.html          ← obrigatório
├── favicon.svg
├── .htaccess           ← obrigatório (routing do React)
└── assets/
    ├── index-xxx.js
    ├── index-xxx.css
    ├── vendor-xxx.js
    ├── query-xxx.js
    └── charts-xxx.js
```

### 3B — Backend (Node.js API)

Envie o conteúdo de `deploy/api/` para `/home/usuario/agildoc-api/`.

**Estrutura do agildoc-api:**
```
agildoc-api/
├── app.js              ← ponto de entrada (Node.js Selector)
├── dist/               ← código compilado
├── prisma/             ← schema do banco
├── .env                ← suas configurações
├── package.json
└── uploads/            ← pasta para documentos
```

---

## PASSO 4 — Configurar Node.js no cPanel

1. cPanel → **"Node.js Selector"** (ou "Setup Node.js App")
2. Clique em **"Create Application"**
3. Preencha:

| Campo | Valor |
|-------|-------|
| Node.js version | **18.x** ou **20.x** |
| Application mode | **Production** |
| Application root | `agildoc-api` |
| Application URL | `seudominio.com.br` |
| Application startup file | `app.js` |

4. Clique **"Create"**
5. Depois clique **"Run NPM Install"** e aguarde

---

## PASSO 5 — Criar pasta uploads com permissão

No **Terminal** do cPanel (ou SSH):
```bash
mkdir -p ~/agildoc-api/uploads
chmod 755 ~/agildoc-api/uploads
```

---

## PASSO 6 — Reiniciar e testar

1. cPanel → Node.js Selector → clique **"Restart"** na sua aplicação
2. Aguarde 30 segundos
3. Teste: `https://seudominio.com.br/api/health`
   - Resposta esperada: `{"status":"ok","timestamp":"..."}`
4. Acesse: `https://seudominio.com.br`
   - Deve aparecer a tela de login do AgilDoc

---

## PASSO 7 — Primeiro acesso

1. Acesse seu domínio
2. Login: `admin@agildoc.com.br` / `Admin@123`
3. Vá em **Configurações** → atualize o nome da organização
4. Crie os departamentos da sua instituição
5. Cadastre os usuários
6. **Altere as senhas padrão imediatamente!**

---

## PROBLEMAS COMUNS

### API não responde (`/api/health` dá erro)
→ cPanel → Node.js Selector → verificar se status é "Running"
→ Se não estiver: clique "Restart"
→ Verifique o `.env` (DATABASE_URL correto?)

### Tela branca no frontend
→ Verifique se o `.htaccess` está no `public_html`
→ Acesse diretamente: `https://seudominio.com.br/index.html`

### Erro "Access denied for user"
→ O banco, usuário e senha no `.env` estão incorretos
→ Verifique no cPanel → MySQL Databases os nomes exatos

### "Cannot find module"
→ No cPanel Terminal: `cd ~/agildoc-api && npm install --production`

### Arquivos de upload não aparecem
→ `chmod 755 ~/agildoc-api/uploads`
→ Verifique se `UPLOAD_DIR` no `.env` aponta para o caminho correto

---

## GERAR CHAVE JWT (copie e cole no .env)

Acesse este link e copie o resultado:
- https://generate-secret.vercel.app/64

Ou no Terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
