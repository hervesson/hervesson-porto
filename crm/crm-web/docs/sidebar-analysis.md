# Redesign da navegação lateral — análise e decisões

## Contexto

Antes deste redesign, o painel (`app/(painel)/layout.tsx`) não tinha sidebar —
só um header horizontal com título, status do WhatsApp e botão de sair. O
produto hoje tem **um módulo real**: Kanban de leads (`/kanban`) e o detalhe
de um lead (`/lead/[id]`), que é uma sub-tela do mesmo fluxo.

A referência usada (screenshot do "RLA Systems") é uma sidebar de ERP/SaaS
madura com ~20 itens em 6 categorias (Vendas, Operação, Crescimento,
Inteligência, Sistema...). Isso não corresponde ao estágio atual do produto —
Hervesson opera sozinho, e o CRM existe pra resolver um problema específico
(captura de lead → atendimento WhatsApp com IA → Kanban), não pra ser um ERP.

## 1. Análise da referência

O que a referência faz bem e vale adaptar:

- **Categorias em maiúsculas, pequenas e discretas** (`GERAL`, `VENDAS`...)
  acima de cada grupo — cria ritmo de leitura sem precisar de divisórias
  pesadas.
- **Item ativo com fundo sutil + ícone colorido**, não um bloco cheio da cor
  da marca — mantém contraste sem gritar.
- **Badge de contagem discreto** (o "3" ao lado de WhatsApp) — comunica
  estado sem exigir clique.
- **Rodapé fixo com usuário + avatar** — separa "navegação" de "identidade/
  sessão", e é sempre visível independente do scroll do menu.
- **Ícones outline consistentes**, mesmo peso visual em todos os itens.

O que **não** foi copiado, e por quê:

- **Paleta roxo/violeta e o logo hexagonal da RLA** — identidade não é nossa;
  usamos os tokens já definidos em `app/globals.css` (`--color-brand:
  #0090ff`, fundo `--color-ink`/`--color-surface`).
- **6 categorias fixas com ~20 itens** — inventar "Fiscal", "Compras",
  "Projetos", "Equipe", "Marketplace" só pra preencher categorias seria
  simular um produto que não existe. Isso violaria a própria instrução do
  briefing ("não alterar funcionalidades") e criaria links mortos.
  Categorias aparecem conforme módulos reais nascerem — não antes.
  [[feedback memory: don't design for hypothetical future requirements]]
- **Sidebar sempre expandida sem opção de recolher** — a referência não
  mostra esse controle; adicionamos porque é um padrão de baixo custo e
  alto ganho de espaço em telas menores/notebook.

## 2. Problemas encontrados no menu atual (antes deste redesign)

- Não existia navegação lateral — cada nova tela precisaria empilhar mais
  ícones num header horizontal, que não escala.
- Status do WhatsApp e logout dividiam o mesmo header do título da página,
  sem hierarquia clara entre "identidade do produto" e "ações de sistema".
- Nenhum padrão definido para estado ativo, hover, colapsado, badge — cada
  tela nova reinventaria isso.
- Sem tratamento responsivo dedicado: em telas estreitas o header ficava
  espremido (título + status + logout competindo por espaço).

## 3. Oportunidades de melhoria

- Separar navegação (sidebar) de conteúdo (header de página, que já existia
  em `/kanban` e `/lead/[id]` e foi mantido como está).
- Tornar a navegação **data-driven** (`lib/nav-config.ts`): adicionar um
  módulo novo = uma linha num array, sem tocar no componente da sidebar.
- Definir os estados visuais uma vez (normal/hover/ativo/badge) pra qualquer
  item futuro herdar automaticamente.
- Resolver responsividade com um padrão testado (drawer mobile, rail
  colapsável no desktop) em vez de deixar pra quando o problema aparecer.

## 4. Nova arquitetura da navegação

Um grupo hoje, estrutura pronta para múltiplos:

```
GERAL
 └─ Leads (Kanban)          ← /kanban, ativo
```

Quando "Peça à IA" (barra de comando no Kanban) ou uma tela de
Configurações existirem de verdade, entram como:

```ts
// lib/nav-config.ts
{ label: "Automações", items: [{ label: "Peça à IA", href: "/automacoes", icon: Wand2 }] }
```

Não foram criadas categorias como "Comercial", "Financeiro", "Administração"
vazias — categoria sem item real é ruído, não organização.

## 5. Organização dos módulos

| Item | Onde vive hoje | Grupo |
|---|---|---|
| Leads (Kanban) | `/kanban` (já existia) | Geral |
| Status WhatsApp | rodapé da sidebar (não é link — não existe tela dedicada de WhatsApp) | — |
| Usuário + Sair | rodapé da sidebar | — |

## 6. Melhorias de UX

- Item ativo: fundo `bg-surface-2`, texto `cream`, barra de destaque azul
  (`bg-brand`) de 2px na lateral esquerda, ícone também em `brand`.
- Hover: fundo `surface-2/60`, texto sobe de `muted` pra `cream`.
- Grupo: label em maiúsculas, 11px, `muted/70`, sem borda — só espaçamento.
- Recolher (desktop): reduz pra rail de ícones (72px / `md:w-18`), com
  `title` (tooltip nativo) no item pra não perder o rótulo.
- Estado persiste em `localStorage` (`crm.sidebar.collapsed`) — não precisa
  escolher de novo a cada visita.

## 7. Componentes reutilizáveis

- **`lib/nav-config.ts`** — única fonte de verdade dos itens/grupos. Novo
  módulo = novo item aqui.
- **`components/layout/sidebar.tsx`** — renderiza `NAV_GROUPS`, cuida de
  estado ativo (via `usePathname`), colapso e drawer mobile. Não precisa
  mudar quando o menu crescer.
- **`components/layout/app-shell.tsx`** — dono do estado (colapsado / drawer
  aberto) e do topbar mobile (hambúrguer). Envolve `{children}` — qualquer
  página dentro de `(painel)` ganha a sidebar automaticamente.

## 8. Implementação realizada

- Sidebar nova com 1 grupo (`Geral` → `Leads`), rodapé com status do
  WhatsApp, avatar + email + logout.
- Colapsável no desktop (ícone-only, 72px) com preferência salva.
- Drawer no mobile/tablet (< `md`, 768px), com overlay e botão de fechar.
- Importante: o estado "recolhido" é escondido via `md:hidden` nos labels
  (não via JS puro) — assim o drawer mobile nunca herda o modo ícone-only
  do desktop, mesmo que o usuário tenha recolhido a sidebar no notebook
  antes de abrir no celular.
- Header antigo removido; `components/logout-button.tsx` (não usado por
  ninguém mais) foi deletado em vez de mantido morto no repo.

## 9. Arquivos alterados

- `lib/nav-config.ts` (novo)
- `components/layout/sidebar.tsx` (novo)
- `components/layout/app-shell.tsx` (novo)
- `app/(painel)/layout.tsx` (simplificado — delega pro `AppShell`)
- `components/logout-button.tsx` (removido — substituído pelo logout no
  rodapé da sidebar)
- `docs/sidebar-analysis.md` (este arquivo)

## 10. Critérios de aceite

- [x] Rotas, autenticação e permissões inalteradas (`requireUser`,
  `connectionState` seguem no mesmo lugar, só a renderização mudou).
- [x] `/kanban` continua funcionando e é o item ativo quando visitado.
- [x] Sidebar recolhe no desktop e volta ao clicar de novo; preferência
  sobrevive a um refresh (`localStorage`).
- [x] Abaixo de 768px a sidebar vira drawer com overlay, sem herdar o modo
  ícone-only do desktop.
- [x] Sem erros no console do navegador nas telas testadas (login → kanban,
  desktop expandido/recolhido, tablet, mobile fechado/aberto).
- [x] `tsc --noEmit` limpo.

## 11. Melhorias futuras

- Quando "Peça à IA" (barra de comando, já combinada como próxima prioridade
  depois do deploy do CRM) virar realidade, ela pode entrar como item da
  sidebar ou como ação no topo do Kanban — decidir na hora, conforme a UI
  que a feature pedir.
- Se o WhatsApp ganhar uma tela própria (histórico de conversas fora do
  Kanban), o status no rodapé vira link de verdade.
- Badge numérico (ex.: leads não respondidos) é fácil de adicionar no
  `NavItem` quando houver um número real pra mostrar — hoje seria
  decorativo.
