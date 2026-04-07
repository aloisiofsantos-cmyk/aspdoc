# Integração Gov.br — AgilDoc

## O que é a integração Gov.br?

A integração com o Gov.br permite que cidadãos e servidores se autentiquem no AgilDoc usando sua conta Gov.br (CPF + senha), eliminando a necessidade de cadastro manual.

Também permite **assinatura digital nível avançado**, equivalente à assinatura em papel com reconhecimento de firma.

---

## 1. Credenciais Gov.br para desenvolvedor

### Para ambiente de desenvolvimento (homologação):

1. Acesse: https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/transformacao-digital/ferramentas/autenticacao-e-assinatura-digital/integracao-login-govbr
2. Solicite acesso ao **Ambiente de Staging** (gratuito para testes)
3. Preencha o formulário com:
   - URL da aplicação
   - Descrição do sistema
   - CNPJ da organização

### Credenciais recebidas:
```
client_id: <fornecido pelo Gov.br>
client_secret: <fornecido pelo Gov.br>
```

---

## 2. Configurar no .env

```env
GOVBR_CLIENT_ID=seu_client_id
GOVBR_CLIENT_SECRET=seu_client_secret
GOVBR_REDIRECT_URI=https://seudominio.com.br/api/auth/govbr/callback

# URLs padrão de produção:
GOVBR_AUTH_URL=https://sso.acesso.gov.br/authorize
GOVBR_TOKEN_URL=https://sso.acesso.gov.br/token
GOVBR_USERINFO_URL=https://sso.acesso.gov.br/userinfo

# Para homologação (teste):
GOVBR_AUTH_URL=https://sso-hmg.acesso.gov.br/authorize
GOVBR_TOKEN_URL=https://sso-hmg.acesso.gov.br/token
GOVBR_USERINFO_URL=https://sso-hmg.acesso.gov.br/userinfo
```

---

## 3. Configurar Redirect URI

No painel do Gov.br, cadastre a Redirect URI:
```
https://seudominio.com.br/api/auth/govbr/callback
```

Para desenvolvimento:
```
http://localhost:3001/api/auth/govbr/callback
```

---

## 4. Fluxo de autenticação

```
1. Usuário clica em "Entrar com Gov.br"
2. Frontend chama GET /api/auth/govbr
3. Backend retorna URL de autorização do Gov.br
4. Frontend redireciona usuário para Gov.br
5. Usuário faz login no Gov.br
6. Gov.br redireciona para GOVBR_REDIRECT_URI com ?code=xxx
7. Backend troca o code por access_token
8. Backend busca dados do usuário no userinfo endpoint
9. Cria ou atualiza o usuário no banco local
10. Retorna JWT para o frontend
```

---

## 5. Assinatura via VIDaaS (Gov.br)

A assinatura em nível avançado via Gov.br usa o serviço **VIDaaS** da Serpro.

### Configuração adicional:
```env
VIDAAS_API_URL=https://certificado.vidaas.com.br/valid/api/v1
```

### Fluxo de assinatura:
1. Sistema solicita assinatura via API VIDaaS
2. Usuário recebe notificação no app Gov.br
3. Usuário aprova a assinatura biometricamente
4. VIDaaS retorna hash assinado com certificado ICP-Brasil

### Documentação VIDaaS:
- https://www.gov.br/governodigital/pt-br/assinatura-eletronica/assinatura-avancada

---

## 6. Níveis de assinatura suportados

| Nível | Como funciona | Validade Jurídica |
|---|---|---|
| **Eletrônica Simples** | Login no AgilDoc | Válida (MP 2.200-2/2001) |
| **Gov.br Nível Bronze** | Login Gov.br (CPF validado) | Válida com dados pessoais |
| **Gov.br Nível Prata** | Gov.br + validação facial | Assinatura avançada |
| **Gov.br Nível Ouro** | Gov.br + certificado digital | Equivale a assinatura manuscrita |
| **ICP-Brasil** | Certificado A1/A3 | Assinatura qualificada |

---

## 7. Verificação no frontend

Após o callback do Gov.br, o frontend precisa capturar o código e enviá-lo ao backend:

```javascript
// No componente de callback (ex: /auth/govbr/success)
useEffect(() => {
  const code = new URLSearchParams(window.location.search).get('code');
  if (code) {
    fetch(`/api/auth/govbr/callback?code=${code}`)
      .then(r => r.json())
      .then(data => {
        localStorage.setItem('accessToken', data.data.accessToken);
        navigate('/dashboard');
      });
  }
}, []);
```

---

## Suporte

- Documentação oficial: https://manual-roteiro-integracao-login-unico.servicos.gov.br/
- Suporte Gov.br: govbr@economia.gov.br
