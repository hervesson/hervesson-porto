# Deploy no Easypanel (produção)

Este é o caminho de produção, usando **serviços nativos do Easypanel** (com
domínio público + SSL automático do Traefik). O `docker-compose.yml` da pasta é
só pra teste local.

Crie **um projeto** no Easypanel (ex.: `crm`) e, dentro dele, os serviços abaixo.
Serviços no mesmo projeto se enxergam pela **rede interna** — o host é o **nome do
serviço** (para os bancos gerenciados, copie a *Internal Connection URL* que o
Easypanel mostra na página do serviço).

> ### ⭐ Atalho: template oficial da Evolution API
> O template da Evolution no Easypanel **já sobe o Postgres e o Redis dela junto**.
> Se você usar o template, **pule os passos 2 (`evo-db`) e 3 (`redis`)** — eles são
> criados automaticamente. Você só precisa criar, à parte, o **`crm-db`** (banco do
> CRM) e o **`crm-web`** (painel).
>
> **Fiação por domínio público (recomendada com o template):** se a Evolution ficar
> num projeto/stack separado do `crm-web`, o hostname interno (`http://crm-web:3000`)
> não resolve entre eles. Então ligue os dois pelos **domínios públicos**:
> - No `crm-web`: `EVOLUTION_API_URL=https://evo.trinctecnologies.com.br`
> - Na Evolution: `WEBHOOK_GLOBAL_URL=https://crm.trinctecnologies.com.br/api/whatsapp/webhook`
>
> (Se preferir manter tudo num projeto só, use os hostnames internos abaixo.)

---

## 1. `crm-db` — Postgres (template do Easypanel)

- Create Service → **Postgres**. Nome: `crm-db`.
- Defina usuário/senha/database (ex.: db `crm`).
- Guarde a **Internal Connection URL** (algo como `postgres://user:senha@crm-db:5432/crm`).

## 2. `evo-db` — Postgres (template)

- Outro Postgres. Nome: `evo-db`, database `evolution`.
- Guarde a Internal Connection URL.

> Alternativa (economizar RAM): usar só o `crm-db` e criar um 2º banco
> `evolution` nele pelo console do Postgres (`CREATE DATABASE evolution;`).

## 3. `redis` — Redis (template)

- Create Service → **Redis**. Nome: `redis`.
- Guarde a Internal Connection URL (`redis://redis:6379`).

## 4. `evolution` — Evolution API (App a partir de imagem)

- Create Service → **App**. Nome: `evolution`.
- **Source → Docker Image:** `atendai/evolution-api:v2.2.3`
- **Port:** `8080`
- **Volume:** monte um volume em `/evolution/instances` (persiste a sessão do
  WhatsApp — sem isso você reescaneia o QR a cada restart).
- **Domain:** atribua um domínio (ex.: `evo.trinctecnologies.com.br`) só pra
  escanear o QR pelo Manager. Pode remover depois.
- **Environment:**
  ```
  SERVER_URL=https://evo.trinctecnologies.com.br
  AUTHENTICATION_API_KEY=<chave-aleatoria-forte>
  DATABASE_ENABLED=true
  DATABASE_PROVIDER=postgresql
  DATABASE_CONNECTION_URI=postgresql://user:senha@evo-db:5432/evolution?schema=public
  DATABASE_CONNECTION_CLIENT_NAME=evolution
  DATABASE_SAVE_DATA_INSTANCE=true
  DATABASE_SAVE_DATA_NEW_MESSAGE=true
  DATABASE_SAVE_MESSAGE_UPDATE=true
  DATABASE_SAVE_DATA_CONTACTS=true
  DATABASE_SAVE_DATA_CHATS=true
  CACHE_REDIS_ENABLED=true
  CACHE_REDIS_URI=redis://redis:6379/6
  CACHE_REDIS_PREFIX_KEY=evolution
  CACHE_LOCAL_ENABLED=false
  WEBHOOK_GLOBAL_ENABLED=true
  WEBHOOK_GLOBAL_URL=http://crm-web:3000/api/whatsapp/webhook
  WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
  WEBHOOK_EVENTS_MESSAGES_UPSERT=true
  WEBHOOK_EVENTS_CONNECTION_UPDATE=true
  CONFIG_SESSION_PHONE_CLIENT=Hervesson CRM
  CONFIG_SESSION_PHONE_NAME=Chrome
  LANGUAGE=pt-BR
  ```
  Ajuste `DATABASE_CONNECTION_URI` e `CACHE_REDIS_URI` para as URLs internas reais
  que o Easypanel te deu nos passos 2 e 3.

## 5. `crm-web` — o painel (App a partir do repositório)

- Create Service → **App**. Nome: `crm-web`.
- **Source → GitHub:** aponte pro repositório (o repo precisa estar no GitHub).
- **Build → Dockerfile.** Defina o **diretório raiz/monorepo** como `crm/crm-web`
  (é onde estão o `Dockerfile` e o `package.json`).
- **Port:** `3000`
- **Domain:** atribua `crm.trinctecnologies.com.br` (SSL automático). Este é o
  painel e também o endpoint que o formulário do site vai chamar.
- **Environment:**
  ```
  DATABASE_URL=postgresql://user:senha@crm-db:5432/crm?schema=public
  ANTHROPIC_API_KEY=sk-ant-...
  AI_MODEL=claude-haiku-4-5
  EVOLUTION_API_URL=http://evolution:8080
  EVOLUTION_API_KEY=<a mesma AUTHENTICATION_API_KEY do serviço evolution>
  EVOLUTION_INSTANCE=hervesson
  SESSION_SECRET=<32+ caracteres aleatórios>
  ADMIN_EMAIL=hervessonporto@gmail.com
  ADMIN_PASSWORD_HASH=<hash bcrypt — ver abaixo>
  PUBLIC_PANEL_URL=https://crm.trinctecnologies.com.br
  CORS_ALLOW_ORIGIN=https://www.trinctecnologies.com.br
  ```
- O container roda `prisma migrate deploy` + cria o usuário admin no start
  (via `docker-entrypoint.sh`), então o banco `crm` é preparado sozinho.

### Gerar o `ADMIN_PASSWORD_HASH`

Localmente: `node crm/crm-web/scripts/hash-senha.mjs "suaSenha"` — cole a saída.
(ou pelo Console do serviço `crm-web` no Easypanel, depois do 1º deploy:
`node scripts/hash-senha.mjs "suaSenha"`.)

---

## 6. Conectar o WhatsApp (QR)

Com o `evolution` no ar, crie a instância e escaneie o QR:

- Abra `https://evo.trinctecnologies.com.br/manager` → conectar aparelho, ou via API:
  ```bash
  curl -X POST https://evo.trinctecnologies.com.br/instance/create \
    -H "apikey: <AUTHENTICATION_API_KEY>" -H "Content-Type: application/json" \
    -d '{"instanceName":"hervesson","integration":"WHATSAPP-BAILEYS","qrcode":true}'
  ```
- Escaneie com o WhatsApp do número **5598988958835**.
- Confirme: `curl .../instance/connectionState/hervesson -H "apikey: ..."` → `open`.

O webhook global já aponta pro `crm-web` (interno), então não precisa configurar
webhook manualmente.

---

## 7. Ligar o formulário do site (Vercel)

No projeto do site na Vercel, defina a env e faça redeploy:

```
NEXT_PUBLIC_CRM_LEADS_URL=https://crm.trinctecnologies.com.br/api/leads
```

---

## Diferenças vs. o setup local

| | Local (`docker-compose`) | Easypanel (produção) |
|---|---|---|
| Reverse proxy / SSL | — (localhost:3000) | Traefik + Let's Encrypt automático |
| Cloudflare Tunnel | não usado | **não usado** (domínio público) |
| Postgres | 1 container, 2 bancos | 2 serviços Postgres (`crm-db`, `evo-db`) |
| Hosts internos | `postgres`, `redis`, `evolution-api` | nome do serviço / Internal URL do Easypanel |

## Riscos (relembrando)

- **Baileys viola os ToS da Meta** → risco de ban do número. Sem disparo em massa.
- **Custo Claude API** por conversa — começa no Haiku (`AI_MODEL`) e monitore.
- **LGPD** — conversas são dados pessoais; o painel é autenticado.
