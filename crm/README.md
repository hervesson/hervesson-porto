# CRM WhatsApp — Atendimento primário com IA

CRM de leads com Kanban + atendimento automático no WhatsApp por IA (Claude).
WhatsApp pela **Evolution API** (conecta por QR no número atual — modo Baileys).

- **Produção:** deploy no **Easypanel** (serviços nativos + domínio/SSL). Ver **[EASYPANEL.md](EASYPANEL.md)**.
- **Teste local:** `docker compose up` (instruções abaixo).

## Arquitetura

```
WhatsApp ⇄ Evolution API ─(webhook)→ crm-web (Next.js) ─(Claude API)→ resposta
                │                         │  ↑ painel Kanban + login
             Redis                     Postgres (bancos: evolution, crm)
                                          │
Site (Vercel) ─(POST /api/leads)──────────┘   Easypanel/Traefik expõe o painel (SSL)
```

Fluxo: lead manda mensagem → Evolution recebe → chama o webhook do `crm-web` →
grava o lead + mensagem → se a IA não estiver pausada, o agente Claude responde
(com o tom da marca, lendo o contexto do negócio) e envia pela REST da Evolution.
Tudo aparece no Kanban.

## Teste local (docker compose)

> Para produção use o Easypanel — ver **[EASYPANEL.md](EASYPANEL.md)**.

```bash
cp .env.example .env         # preencher TODOS os valores
# gerar o hash da senha do painel:
node crm-web/scripts/hash-senha.mjs "minhaSenhaForte"   # cole em ADMIN_PASSWORD_HASH

docker compose up -d --build
docker compose logs -f evolution-api   # acompanhar
# painel em http://localhost:3000
```

### Conectar o WhatsApp (QR)

1. A Evolution sobe em `http://localhost:8080` (só na rede local da VPS).
2. Criar a instância e pegar o QR (o `EVOLUTION_INSTANCE` do `.env`):

```bash
# criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: $AUTHENTICATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"instanceName":"hervesson","integration":"WHATSAPP-BAILEYS","qrcode":true}'

# reconectar / novo QR quando precisar
curl http://localhost:8080/instance/connect/hervesson -H "apikey: $AUTHENTICATION_API_KEY"
```

Ou abra o **Evolution Manager** em `http://localhost:8080/manager` e escaneie o QR
com o WhatsApp do número (Aparelhos conectados → Conectar aparelho).

3. Confirme o status `open`:

```bash
curl http://localhost:8080/instance/connectionState/hervesson -H "apikey: $AUTHENTICATION_API_KEY"
```

O webhook já vem configurado por env (`WEBHOOK_GLOBAL_URL` → `crm-web`), então não
precisa configurar webhook manualmente.

### Painel

Local: `http://localhost:3000`. Produção: o domínio do serviço `crm-web` no
Easypanel. Login com `ADMIN_EMAIL` e a senha.

## ⚠️ Riscos e atenções

- **Ban do número:** o modo Baileys da Evolution viola os Termos da Meta. Use sem
  disparo em massa, sem spam. Mantenha um backup do número. Se precisar de garantia,
  a Evolution também suporta o modo **Cloud API oficial** (mesma stack, sem risco).
- **VPS caseira:** o atendimento depende da energia e internet da casa. Se cair, para.
- **LGPD:** conversas são dados pessoais. O painel é autenticado e o Postgres não é
  exposto publicamente (só o `crm-web`, via Easypanel/Traefik). Não compartilhe segredos.
- **Custo Claude API:** cobrança por conversa. Começa no Haiku (`AI_MODEL`) e monitore.

## Estrutura

- `docker-compose.yml` — os 5 serviços.
- `postgres-init/` — cria o banco `evolution` no primeiro boot.
- `crm-web/` — o app Next.js (painel + API + webhook + agente IA).
- `.env.example` — todas as variáveis.
