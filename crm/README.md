# CRM WhatsApp — Atendimento primário com IA

CRM de leads com Kanban + atendimento automático no WhatsApp por IA (Claude).
WhatsApp pela **Cloud API oficial da Meta**.

- **Produção:** deploy no **Easypanel** (serviços nativos + domínio/SSL). Ver **[EASYPANEL.md](EASYPANEL.md)**.
- **Teste local:** `docker compose up` (instruções abaixo).

## Arquitetura

```
WhatsApp ⇄ Cloud API (Meta) ─(webhook HTTPS)→ crm-web (Next.js) ─(Claude API)→ resposta
                                                  │  ↑ painel Kanban + login
                                               Postgres (banco: crm)
                                                  │
Site (Vercel) ─(POST /api/leads)──────────────────┘   Easypanel/Traefik expõe o painel (SSL)
```

Fluxo: lead manda mensagem → a Meta chama o webhook do `crm-web` → grava o lead +
mensagem → se a IA não estiver pausada, o agente Claude responde (com o tom da
marca, lendo o contexto do negócio) e envia pela Graph API. Tudo aparece no Kanban.

## Por que a API oficial e não a Evolution/Baileys

A Evolution foi removida em 2026-08-05. Três motivos:

- **Botões e listas não são mais entregues** no Baileys — a API responde 201 e a
  mensagem nunca chega no celular do contato.
- **Viola o Termo de Uso da Meta**, com risco de ban do número.
- **Custo praticamente zero** na oficial pra este uso: mensagem iniciada pelo
  contato abre uma janela de 24h em que as respostas são gratuitas.

## Teste local (docker compose)

> Para produção use o Easypanel — ver **[EASYPANEL.md](EASYPANEL.md)**.

```bash
cp .env.example .env         # preencher TODOS os valores
# gerar o hash da senha do painel:
node crm-web/scripts/hash-senha.mjs "minhaSenhaForte"   # cole em ADMIN_PASSWORD_HASH

docker compose up -d --build
docker compose logs -f crm-web   # acompanhar
# painel em http://localhost:3000
```

### Receber mensagens em desenvolvimento

A Meta só entrega webhook em **HTTPS público** — `localhost` não serve. Exponha a
porta 3000 por um túnel HTTPS e cadastre a URL no painel do app, em
*Configuração → Webhook*, com o mesmo `WHATSAPP_WEBHOOK_VERIFY_TOKEN` do `.env`.

⚠️ Existe **uma** URL de callback por app. Apontar pro túnel local derruba a
produção enquanto durar o teste.

Enquanto o app estiver em modo de desenvolvimento, ele só conversa com os números
de teste cadastrados no painel da Meta — até 5.

### Painel

Local: `http://localhost:3000`. Produção: o domínio do serviço `crm-web` no
Easypanel. Login com `ADMIN_EMAIL` e a senha.

## ⚠️ Riscos e atenções

- **Janela de 24 horas:** texto livre só é entregue dentro de 24h da última
  mensagem do contato. Fora dela, só **template aprovado**. É a diferença de
  comportamento que mais surpreende quem vem do Baileys.
- **Nota de qualidade:** muitos bloqueios ou denúncias derrubam o número pra
  `RED`, a Meta corta o limite de envio e depois bloqueia. A página `/whatsapp`
  mostra o status.
- **Token expira:** o da tela de teste dura 24h. Em produção, use token
  permanente de Usuário do Sistema — ver seção 3 do EASYPANEL.md.
- **LGPD:** conversas são dados pessoais. O painel é autenticado e o Postgres não é
  exposto publicamente. Ver a Política de Privacidade em `site/app/privacidade`.
- **Custo Claude API:** cobrança por conversa. Começa no Haiku (`AI_MODEL`) e monitore.

## Estrutura

- `docker-compose.yml` — Postgres + painel (2 serviços).
- `crm-web/` — o app Next.js (painel + API + webhook + agente IA).
- `crm-web/lib/whatsapp/cloud-api.ts` — cliente da Cloud API. **Escrito pra ser
  portável**: não importa nada do CRM, então dá pra copiar inteiro pra outros
  projetos (é o que vai pro sistema de pedidos do açaí).
- `.env.example` — todas as variáveis.
