# Deploy no Easypanel (produção)

Este é o caminho de produção, usando **serviços nativos do Easypanel** (com
domínio público + SSL automático do Traefik). O `docker-compose.yml` da pasta é
só pra teste local.

O WhatsApp entra pela **Cloud API oficial da Meta**. Não há container de
mensageria pra subir: a infra de mensagens é da Meta, e o `crm-web` fala com ela
por HTTPS. Isso reduziu o deploy de 4 serviços para 2.

Crie **um projeto** no Easypanel (ex.: `crm`) e, dentro dele, os serviços abaixo.
Serviços no mesmo projeto se enxergam pela **rede interna** — o host é o **nome do
serviço** (para o banco gerenciado, copie a *Internal Connection URL* que o
Easypanel mostra na página do serviço).

---

## 1. `crm-db` — Postgres (template do Easypanel)

- Create Service → **Postgres**. Nome: `crm-db`.
- Defina usuário/senha/database (ex.: db `crm`).
- Guarde a **Internal Connection URL** (algo como `postgres://user:senha@crm-db:5432/crm`).

## 2. `crm-web` — o painel (App a partir do repositório)

- Create Service → **App**. Nome: `crm-web`.
- **Source → GitHub:** aponte pro repositório (o repo precisa estar no GitHub).
- **Build → Dockerfile.** Defina o **diretório raiz/monorepo** como `crm/crm-web`
  (é onde estão o `Dockerfile` e o `package.json`).
- **Port:** `3000`
- **Volume:** monte um volume em `/app/public/uploads` (persiste os arquivos
  anexados nas conversas — sem isso, todo anexo some no próximo redeploy).
- **Domain:** atribua `crm.trinctecnologies.com.br` (SSL automático). Este é o
  painel, o endpoint do formulário do site **e a URL do webhook da Meta**.
- **Environment:**
  ```
  DATABASE_URL=postgresql://user:senha@crm-db:5432/crm?schema=public
  ANTHROPIC_API_KEY=sk-ant-...
  AI_MODEL=claude-haiku-4-5
  WHATSAPP_PHONE_NUMBER_ID=<id do número, da API Setup>
  WHATSAPP_BUSINESS_ACCOUNT_ID=<id da WABA>
  WHATSAPP_ACCESS_TOKEN=<token permanente — ver seção 3>
  WHATSAPP_WEBHOOK_VERIFY_TOKEN=<string aleatória que você inventa>
  WHATSAPP_APP_SECRET=<App Secret, em Configurações do app > Básico>
  WHATSAPP_API_VERSION=v23.0
  SESSION_SECRET=<32+ caracteres aleatórios>
  ADMIN_EMAIL=hervessonporto@gmail.com
  ADMIN_PASSWORD_HASH=<hash bcrypt — ver abaixo>
  PUBLIC_PANEL_URL=https://crm.trinctecnologies.com.br
  CORS_ALLOW_ORIGIN=https://www.trinctecnologies.com.br
  GOOGLE_CLIENT_ID=<client id do Google Cloud Console — ver seção 6>
  GOOGLE_CLIENT_SECRET=<client secret do Google Cloud Console — ver seção 6>
  ```
- O container roda `prisma migrate deploy` + cria o usuário admin no start
  (via `docker-entrypoint.sh`), então o banco `crm` é preparado sozinho.

### Gerar o `ADMIN_PASSWORD_HASH`

Localmente: `node crm/crm-web/scripts/hash-senha.mjs "suaSenha"` — cole a saída.
(ou pelo Console do serviço `crm-web` no Easypanel, depois do 1º deploy:
`node scripts/hash-senha.mjs "suaSenha"`.)

---

## 3. Token permanente (Usuário do Sistema)

⚠️ O token que aparece na tela de teste da Meta **expira em 24 horas**. Não serve
pra produção — o atendimento cai sozinho no dia seguinte.

Pra gerar um que não expira:

1. `business.facebook.com` → portfólio **Trinc Tecnologies** → Configurações →
   **Usuários → Usuários do sistema**
2. Criar usuário do sistema, função **Administrador**
3. **Adicionar ativos** → selecione o app e a conta do WhatsApp, com controle total
4. **Gerar novo token** → escolha o app → marque os escopos
   `whatsapp_business_messaging` e `whatsapp_business_management`
5. Em expiração, escolha **Nunca**
6. Copie o token — ele **só aparece uma vez**. Cole em `WHATSAPP_ACCESS_TOKEN`

---

## 4. Cadastrar o webhook na Meta

Com o `crm-web` no ar e respondendo no domínio:

1. Painel do app → caso de uso **"Conectar-se com os clientes pelo WhatsApp"** →
   **Configuração** → Webhook → *Editar*
2. **URL de callback:** `https://crm.trinctecnologies.com.br/api/whatsapp/webhook`
3. **Token de verificação:** exatamente o mesmo valor de
   `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Clique em verificar. A Meta faz um `GET` na URL e espera o `hub.challenge` de
   volta — se o token não bater, dá erro aqui e nada é salvo.
5. **Assine os campos:**
   - `messages` — mensagens recebidas e confirmações de entrega. Obrigatório.
   - `message_echoes` — só existe com **Coexistence**. É o que faz o painel ver
     as mensagens enviadas do celular e pausar a IA sozinha.

⚠️ O webhook **exige HTTPS público**. Em desenvolvimento local, use um túnel
(a porta 3000 exposta por um domínio HTTPS temporário) e cadastre essa URL — mas
lembre que só existe **uma** URL de callback por app, então trocar pra testar
local derruba a produção. Para vários clientes, use o **webhook override por
WABA**, que aponta os eventos de cada cliente pra uma URL própria.

---

## 5. Ligar o formulário do site (Vercel)

No projeto do site na Vercel, defina a env e faça redeploy:

```
NEXT_PUBLIC_CRM_LEADS_URL=https://crm.trinctecnologies.com.br/api/leads
```

---

## 6. Agenda — conectar o Google Calendar

A Agenda (`/agenda`) sincroniza com o Google Calendar via OAuth2. Isso exige
criar credenciais no Google Cloud Console **antes** de conectar pelo painel —
não tem como pular esse passo.

1. `console.cloud.google.com` → criar/selecionar um projeto (ex.: "Hervesson CRM").
2. **APIs & Services → Library** → habilitar **Google Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - Nome do app, e-mail de suporte e de contato: `hervessonporto@gmail.com`.
   - Escopo: `https://www.googleapis.com/auth/calendar.events`.
   - Test users: adicione `hervessonporto@gmail.com`.
   - **Publishing status → "In production"**. Isso é obrigatório — em modo
     "Testing" o `refresh_token` expira em 7 dias e a Agenda para de
     sincronizar sozinha toda semana. Não precisa de verificação do Google
     pra fazer isso (só 1 usuário, escopo não-sensível a ponto de exigir
     review) — só aparece uma tela "app não verificado" que você clica
     através uma vez, ao conectar.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Tipo: **Web application**.
   - Authorized redirect URIs:
     `https://crm.trinctecnologies.com.br/api/google/callback`
     (e, se for testar local: `http://localhost:3000/api/google/callback`).
   - Copie o **Client ID** e o **Client Secret**.
5. Cole os dois nas env vars `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` do
   serviço `crm-web` (seção 2 acima) e redeploy.
6. Abra `/agenda` no painel e clique em "Conectar Google Agenda" — o resto do
   fluxo é automático.

---

## Diferenças vs. o setup local

| | Local (`docker-compose`) | Easypanel (produção) |
|---|---|---|
| Reverse proxy / SSL | — (localhost:3000) | Traefik + Let's Encrypt automático |
| Webhook da Meta | túnel HTTPS temporário | domínio público do `crm-web` |
| Postgres | container `postgres` | serviço `crm-db` |
| Token do WhatsApp | o de 24h da tela de teste serve | **permanente**, por Usuário do Sistema |

## Riscos e limites

- **Janela de 24 horas.** Texto livre só é entregue dentro de 24h da última
  mensagem do contato. Fora dela, só **template aprovado** — senão a Meta
  rejeita o envio. Isso não existia no Baileys e é a mudança de comportamento
  que mais surpreende.
- **Nota de qualidade.** Se o número cair pra `RED` (muitos bloqueios ou
  denúncias), a Meta reduz o limite de envio e depois bloqueia. A página
  `/whatsapp` do painel mostra o status.
- **Custo Claude API** por conversa — começa no Haiku (`AI_MODEL`) e monitore.
- **LGPD** — conversas são dados pessoais; o painel é autenticado. Ver a
  Política de Privacidade em `site/app/privacidade`.
- **Foto de perfil do contato não existe** na Cloud API. Leads criados a partir
  daqui ficam sem `avatarUrl` (os antigos, vindos da Evolution, continuam).
