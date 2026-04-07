# AgilDoc — Sistema de Gestão Documental para o Setor Público

> Sistema completo de protocolo eletrônico e gestão documental para prefeituras, câmaras, autarquias e fundos previdenciários.

---

## 🚀 Funcionalidades

| Módulo | Funcionalidades |
|---|---|
| **Protocolo** | Numeração automática (PROC-YYYY-XXXXXX), abertura, tramitação entre setores |
| **Documentos** | Upload de PDF/DOC/imagens, visualização inline, hash SHA-256 de integridade |
| **Assinatura Digital** | Eletrônica simples, Gov.br, ICP-Brasil. QR code de verificação embutido em PDF |
| **Dashboard** | Estatísticas em tempo real, gráficos de evolução mensal, processos recentes |
| **Relatórios** | Por status, tipo, departamento, evolução mensal, vencidos |
| **Usuários** | 5 perfis (Super Admin / Admin / Gestor / Servidor / Cidadão), reset de senha |
| **Departamentos** | Hierarquia pai/filho, árvore organizacional |
| **Notificações** | In-app + email automático para encaminhamentos e assinaturas |
| **Gov.br** | Login e assinatura via conta Gov.br (OIDC OAuth2) |
| **Consulta Pública** | Cidadão consulta protocolo sem login |
| **Auditoria** | Log completo de todas as ações do sistema |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 + Express + TypeScript |
| ORM | Prisma 5 |
| Banco | PostgreSQL 15 |
| Auth | JWT + Refresh Token + Gov.br OAuth2/OIDC |
| Frontend | React 18 + Vite + TypeScript |
| Estilo | Tailwind CSS 3 |
| Gráficos | Recharts |
| Email | Nodemailer (SMTP) |
| PDF | pdf-lib (assinatura + QR code) |
| Deploy | Docker Compose |

---

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 15+
- Docker + Docker Compose (opcional, mas recomendado)

---

## ⚡ Instalação Rápida

### 1. Clone e configure

```bash
git clone <repo>
cd aspdoc
cp .env.example .env
# Edite o .env com suas configurações
nano .env
```

### 2. Suba o banco de dados

```bash
docker-compose up -d postgres
```

### 3. Instale dependências e configure o banco

```bash
cd backend
npm install
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

### 4. Inicie o backend

```bash
npm run dev
# API rodando em http://localhost:3001
```

### 5. Inicie o frontend

```bash
cd ../frontend
npm install
npm run dev
# Frontend rodando em http://localhost:5173
```

### 6. Acesse o sistema

- **URL**: http://localhost:5173
- **Admin**: `admin@agildoc.com.br` / `Admin@123`
- **Gestor**: `gestor@agildoc.com.br` / `Gestor@123`
- **Servidor**: `servidor@agildoc.com.br` / `Servidor@123`

---

## 🐳 Deploy com Docker

```bash
# Produção completa com Docker
docker-compose up -d

# Verificar logs
docker-compose logs -f backend
```

---

## 🌐 Deploy na UOL Hospedagem / VPS

Consulte o guia detalhado em [`docs/DEPLOY_UOL.md`](docs/DEPLOY_UOL.md)

---

## 📁 Estrutura do Projeto

```
aspdoc/
├── backend/                  # API Node.js
│   ├── prisma/
│   │   ├── schema.prisma     # Schema do banco de dados
│   │   └── seed.ts           # Dados iniciais
│   └── src/
│       ├── config/           # Configurações (env, logger, prisma)
│       ├── controllers/      # Lógica dos endpoints
│       ├── middleware/        # Auth, upload, error handling
│       ├── routes/           # Definição das rotas
│       ├── services/         # Lógica de negócio
│       └── types/            # Tipos TypeScript
├── frontend/                 # React SPA
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       ├── pages/            # Páginas da aplicação
│       ├── services/         # Cliente API (Axios)
│       ├── store/            # Estado global (Auth context)
│       ├── types/            # Tipos TypeScript
│       └── utils/            # Funções utilitárias
├── docs/                     # Documentação
├── .env.example              # Template de variáveis de ambiente
└── docker-compose.yml        # Orquestração dos serviços
```

---

## 🔒 Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Super Admin** | Acesso total ao sistema |
| **Admin** | Gestão de usuários, departamentos e configurações |
| **Gestor** | Ver relatórios, concluir processos do setor |
| **Servidor** | Criar, tramitar e assinar processos |
| **Cidadão** | Criar requerimentos, acompanhar seus processos |

---

## 📡 API REST — Endpoints Principais

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login com email/senha |
| GET | `/api/auth/govbr` | Iniciar login Gov.br |
| GET | `/api/auth/me` | Dados do usuário logado |
| GET | `/api/processes` | Listar processos |
| POST | `/api/processes` | Criar processo |
| GET | `/api/processes/:id` | Detalhe do processo |
| POST | `/api/processes/:id/forward` | Encaminhar processo |
| POST | `/api/documents/upload` | Upload de documento |
| POST | `/api/documents/signatures` | Solicitar assinatura |
| POST | `/api/documents/signatures/:id/sign` | Assinar documento |
| GET | `/api/documents/verify/:id` | Verificar assinatura |
| GET | `/api/reports/summary` | Resumo estatístico |
| GET | `/api/processes/public/:number` | Consulta pública sem login |

---

## 🏢 Casos de Uso

- **Prefeituras Municipais** — Protocolo geral, ofícios, decretos, portarias
- **Câmaras Municipais** — Projetos de lei, atas, contratos
- **Autarquias** — Processos internos, licitações
- **Fundos Previdenciários** — Requerimentos de benefícios, documentação

---

## 📄 Licença

© 2025 AgilDoc — Todos os direitos reservados. Software proprietário para venda.

---

## 📞 Suporte

Para dúvidas técnicas, consulte a documentação em `/docs/` ou entre em contato com a equipe de suporte.
