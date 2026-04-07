# Deploy AgilDoc — UOL Hospedagem / VPS

Este guia descreve como hospedar o AgilDoc em um servidor VPS da UOL Domínios (ou similar).

---

## Pré-requisitos no servidor

```bash
# Ubuntu 22.04 LTS recomendado

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-client-15

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL gratuito)
sudo apt install -y certbot python3-certbot-nginx
```

---

## 1. Configurar PostgreSQL

```bash
sudo -u postgres psql

-- Criar usuário e banco
CREATE USER agildoc_user WITH PASSWORD 'senha_muito_segura_aqui';
CREATE DATABASE agildoc_db OWNER agildoc_user;
GRANT ALL PRIVILEGES ON DATABASE agildoc_db TO agildoc_user;
\q

# Testar conexão
psql -U agildoc_user -h localhost -d agildoc_db
```

---

## 2. Fazer upload da aplicação

```bash
# No seu computador local, gere o build
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build

# Via SCP ou Git
git clone <seu-repositorio> /var/www/agildoc
# ou
scp -r ./agildoc usuario@ip-do-servidor:/var/www/agildoc
```

---

## 3. Configurar variáveis de ambiente

```bash
cd /var/www/agildoc
cp .env.example .env
nano .env

# Configure obrigatoriamente:
# DATABASE_URL="postgresql://agildoc_user:senha@localhost:5432/agildoc_db"
# JWT_SECRET="string_aleatoria_de_64_chars_aqui"
# JWT_REFRESH_SECRET="outra_string_aleatoria_aqui"
# FRONTEND_URL="https://seudominio.com.br"
# SMTP_HOST, SMTP_USER, SMTP_PASS (para emails)
```

---

## 4. Rodar migrações e seed

```bash
cd /var/www/agildoc/backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

---

## 5. Configurar PM2 para o backend

```bash
# Criar arquivo de configuração PM2
cat > /var/www/agildoc/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'agildoc-api',
    script: 'dist/server.js',
    cwd: '/var/www/agildoc/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '/var/log/agildoc/combined.log',
    error_file: '/var/log/agildoc/error.log',
    max_memory_restart: '512M',
    restart_delay: 3000
  }]
};
EOF

# Criar diretório de logs
sudo mkdir -p /var/log/agildoc
sudo chown $USER:$USER /var/log/agildoc

# Iniciar backend
cd /var/www/agildoc/backend
npm run build
pm2 start /var/www/agildoc/ecosystem.config.js
pm2 save
pm2 startup  # Siga as instruções para iniciar no boot
```

---

## 6. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/agildoc

# Cole o conteúdo abaixo:
```

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Frontend (React)
    root /var/www/agildoc/frontend/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API para o backend Node.js
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/agildoc/uploads/;
        add_header Content-Disposition "inline";
    }

    # SPA - redirecionar para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/agildoc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Let's Encrypt
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 7. Configurar uploads

```bash
mkdir -p /var/www/agildoc/uploads
chmod 755 /var/www/agildoc/uploads
chown www-data:www-data /var/www/agildoc/uploads
```

---

## 8. Atualizar o .env para produção

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seudominio.com.br
DATABASE_URL=postgresql://agildoc_user:senha@localhost:5432/agildoc_db
UPLOAD_DIR=/var/www/agildoc/uploads
```

---

## 9. Verificar se está funcionando

```bash
# Status do PM2
pm2 status
pm2 logs agildoc-api

# Testar API
curl http://localhost:3001/api/health

# Status do Nginx
sudo systemctl status nginx
```

---

## 10. Backup automático do banco

```bash
# Criar script de backup
cat > /usr/local/bin/backup-agildoc.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/agildoc
mkdir -p $BACKUP_DIR
pg_dump -U agildoc_user agildoc_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
find $BACKUP_DIR -mtime +30 -delete  # Remove backups com mais de 30 dias
echo "Backup realizado: $BACKUP_DIR/backup_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/backup-agildoc.sh

# Agendar backup diário às 2h
crontab -e
# Adicionar: 0 2 * * * /usr/local/bin/backup-agildoc.sh
```

---

## Atualizações da aplicação

```bash
cd /var/www/agildoc

# Puxar atualizações
git pull

# Backend
cd backend && npm install && npm run build
npx prisma migrate deploy

# Frontend
cd ../frontend && npm install && npm run build

# Reiniciar backend
pm2 restart agildoc-api
```

---

## Resolução de problemas

| Problema | Solução |
|---|---|
| API não responde | `pm2 logs agildoc-api` para ver erros |
| Banco não conecta | Verificar DATABASE_URL e credenciais |
| Upload falha | Verificar permissões da pasta `/uploads` |
| SSL não funciona | `sudo certbot renew --dry-run` |
| Nginx 502 | Backend não está rodando: `pm2 restart agildoc-api` |
