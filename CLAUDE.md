# MazyOS — Sistema operacional do negócio

Sua empresa roda em cima desse arquivo. Aqui ficam as regras de operação
do MazyOS — como o Claude lê o contexto, aprende com correções, mantém
tudo atualizado e cria skills novas conforme a operação evolui.

Esse arquivo é editável. Quando o `/instalar` rodar, ele complementa o
final dessa página com as regras específicas do seu negócio.

---

## Contexto do negócio

No início de toda conversa, ler os seguintes arquivos (quando existirem
e estiverem preenchidos):

1. `_memoria/empresa.md` — quem é o usuário, o que faz, como funciona o negócio
2. `_memoria/preferencias.md` — tom de voz, estilo de escrita, o que evitar
3. `_memoria/estrategia.md` — foco atual, prioridades, prazos

Usar essas informações como base pra qualquer resposta ou decisão. Ao
sugerir prioridades, formatos ou abordagens, considerar o foco atual
descrito em `estrategia.md`.

Pra qualquer tarefa visual (carrossel, post, landing page), consultar
`identidade/design-guide.md` como referência de estilo.

Não é necessário listar o que foi lido nem confirmar a leitura. Apenas
usar o contexto naturalmente.

---

## Fluxo de trabalho

Antes de executar qualquer tarefa, verificar se existe skill relevante
em `.claude/skills/`. Se encontrar, seguir as instruções da skill. Se
não encontrar, executar a tarefa normalmente.

Ao concluir uma tarefa que não tinha skill mas parece repetível (o
usuário provavelmente vai pedir de novo no futuro), perguntar:

> "Isso pode virar uma skill pra próxima vez. Quer que eu crie?"

Não perguntar pra tarefas pontuais ou perguntas simples. Só quando o
padrão de repetição for claro.

---

## Aprender com correções

Quando o usuário corrigir algo, melhorar uma resposta ou dar uma
instrução que parece permanente (frases como "na verdade é assim", "não
faça mais isso", "prefiro assim", "sempre que...", "evita...", "da
próxima vez..."), perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, identificar onde faz mais sentido salvar:

- **Sobre o negócio** (clientes, serviços, mercado) → `_memoria/empresa.md`
- **Sobre preferências e estilo** (tom de voz, formato, o que evitar) → `_memoria/preferencias.md`
- **Sobre prioridades e foco** (projetos, metas, prazos) → `_memoria/estrategia.md`
- **Regra de comportamento nessa pasta** → próprio `CLAUDE.md`

Salvar com uma linha nova clara, sem reformatar o arquivo inteiro.
Confirmar mostrando a linha adicionada.

Não perguntar se a correção for óbvia de contexto imediato (ex: "na
verdade o arquivo se chama X"). Só perguntar quando a informação tiver
valor duradouro.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante (cliente novo, skill
nova, mudança de foco, processo novo, ferramenta instalada, estrutura
alterada), perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Se sim, identificar o que atualizar:

- **Cliente, serviço, ferramenta, equipe** → `_memoria/empresa.md`
- **Mudança de prioridade ou foco** → `_memoria/estrategia.md`
- **Tom ou estilo** → `_memoria/preferencias.md`
- **Pasta, regra de organização, skill criada** → `CLAUDE.md`
- **Visual (cores, fontes, logo)** → `identidade/design-guide.md`

Mostrar o que vai mudar antes de salvar. Não reformatar o arquivo
inteiro, só adicionar ou editar a linha relevante.

**Quando NÃO perguntar:**
- Tarefas pontuais sem impacto no contexto (escrever um email avulso, criar um post)
- Perguntas simples ou conversas sem ação
- Mudanças já salvas pelo bloco "Aprender com correções"

**Dica:** rode `/atualizar` pra uma varredura completa quando houver dúvida.

---

## Criação de skills

Quando o usuário pedir skill nova:

1. Verificar se existe template relevante em `templates/skills/`. Se
   existir, usar como base e adaptar pro contexto
2. Perguntar se é específica desse projeto ou útil em qualquer:
   - Específica → `.claude/skills/nome-da-skill/SKILL.md` (local)
   - Universal → `~/.claude/skills/nome-da-skill/SKILL.md` (global)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar
   o conteúdo da skill ao contexto do negócio
4. Se a skill precisar de arquivos de apoio (templates, exemplos),
   criar dentro da pasta da skill
5. Seguir o fluxo da skill-creator nativa do Claude Code

---

# Hervesson Porto

> Preenchido pelo `/instalar`. Perfil: solopreneur / criador solo.

## O que é esse workspace

Operação da marca pessoal de Hervesson Porto (pessoa jurídica por trás:
Trinc Technologies LTDA). Aqui eu produzo, publico, mantenho relação com
audiência e construo autoridade em TI + IA aplicada a negócios.

**Estrutura de pastas:**
- `_memoria/` — quem eu sou, como falo, o que tá em foco
- `identidade/` — cores, fontes, logo, padrão visual
- `marketing/` — conteúdo, SEO, campanhas (saída das skills)
- `saidas/` — análises, emails, documentos pontuais
- `dados/` — arquivos a analisar (CSV, PDF, planilha)
- `scripts/` — utilitários (gerar imagem, postar, render)

## Quem sou

Sou Hervesson Porto. Aplico TI dentro de empresas para tomada estratégica
de decisões e growth — desenvolvimento de software, IA, gestão, e cada
vez mais marketing. O que diferencia meu jeito: credibilidade acima de
hype, foco em resultado prático pra empresários que não têm um TI forte
como background.

## O que produzo

- Conteúdo pra Instagram (pilares: fé, gestão, software, marketing, IA)
- Posts pro LinkedIn
- Comunicação formal com clientes (propostas, emails, faturamento)
- Conteúdo de marketing pra construir autoridade (em expansão)

## Minha audiência

Empresários com dificuldade de organização, processos manuais e sem um
TI forte como background.

## Tom de voz

Ver `_memoria/preferencias.md` — resumo: direto, formal-cordial, sem
jargão de guru (evitar "alavancar", "sinergia", "vamos juntos!").

## Posicionamento

**Tecnologia · Estratégia · Resultados** (tagline oficial, usada na capa do LinkedIn).

TI com IA aplicada a negócios pra quem precisa de estrutura e não tem
isso internamente. IA usada de forma prática pra growth, não como hype.

## Regras do sistema

- Conteúdo novo salvar em `marketing/conteudo/<tipo>-<tema>-<data>/`
- Reels/vídeos pro Instagram: projeto Remotion em `reels/` (Node + TypeScript; `npm run studio` pra preview, `npm run render` pra gerar o MP4). Conteúdo dos serviços em `reels/src/data/services.ts` — espelha `site/components/sections/services.tsx`. Ver skill `/reel`. TypeScript fixo em v5.x nesse projeto (v7 quebra o bundler do Remotion)
- Foco é a imagem pessoal (Hervesson Porto), não uma marca empresarial
- Site do negócio em `site/` (Next.js 16 + Tailwind v4; `npm run dev` dentro de `site/`). Contatos/WhatsApp centralizados em `site/lib/site.ts`
- Blog do site: posts em `site/content/blog/<slug>.md` (frontmatter `draft: true/false` — é o que o `/aprovar-post` flipa); imagens dos carrosséis em `site/public/img/posts/<slug>/slide-*.png`
- Site no ar: https://www.trinctecnologies.com.br/ (deploy Vercel, domínio próprio). `SITE_URL` configurado em `.env` na raiz (não versionado)
- Logos de empresas atendidas: soltar PNG/SVG em `site/public/img/clientes/` — a seção marquee da Home lê a pasta sozinha (vazia = seção oculta)
- **CRM + atendimento WhatsApp com IA** em `crm/` — stack self-hosted: Postgres + Redis + Evolution API (WhatsApp via QR no número de `site/lib/site.ts`) + `crm-web` (Next.js: painel Kanban de leads + login + API + webhook + agente Claude). **Produção: deploy no Easypanel** (serviços nativos + domínio/SSL automático via Traefik) — guia em `crm/EASYPANEL.md`; o `docker-compose.yml` é só teste local. Fluxo: lead manda no WhatsApp → Evolution → webhook `crm-web` → grava lead/mensagem → agente Claude responde (tom da marca em `crm/crm-web/lib/ai/business-context.ts`, sincronizar com `_memoria/*`) → Kanban. Hervesson pode "Assumir" (pausa a IA). O form de captura do site (`site/components/sections/lead-form.tsx`) posta pro CRM via `NEXT_PUBLIC_CRM_LEADS_URL`. ⚠️ modo Baileys viola ToS da Meta (risco de ban); custo da Claude API por conversa (começar no Haiku)
- Outras regras que aparecerem com o uso

## Ferramentas conectadas

- [ ] Notion
- [ ] Canva
- [ ] Google Calendar
- [ ] Meta Ads
- [ ] Google Ads

*(Marcar conforme for instalando os MCPs)*
