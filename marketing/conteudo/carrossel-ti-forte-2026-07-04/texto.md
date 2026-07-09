# Carrossel — Decidir no feeling tá custando caro

Tipo: carrossel texto puro
Data: 2026-07-04 (revisado em 2026-07-07)
Tema: Os 4 sinais de que a empresa roda sem TI aplicada a negócios

> Revisão 2026-07-07: capa reescrita (era "Sem TI forte, sua empresa trava
> sozinha" — "TI forte" soava como infra; o core é **TI aplicada a negócios**).
> Layouts refeitos no padrão da skill e bug de fonte no render corrigido.

## Slides

1. **CAPA** (escuro, sem contador) — eyebrow "TI APLICADA A NEGÓCIOS" / Decidir no feeling tá custando caro pra sua empresa / arrasta pro lado →
2. **NÚMERO 1** (claro) — Decisão no feeling — o dado que deveria ajudar tá espalhado em três planilhas, ou não existe
3. **NÚMERO 2** (azul, marca d'água) — Só uma pessoa sabe fazer certo — processo que trava quando essa pessoa falta
4. **NÚMERO 3** (escuro) — Nada conversa com nada — planilha, WhatsApp, sistema isolado; cada ferramenta nova vira mais um lugar pra procurar informação
5. **NÚMERO 4** (claro, marca d'água) — Crescer multiplica o caos — crescer sem estrutura de TI não resolve, multiplica o problema
6. **CITAÇÃO** (escuro) — "Você não precisa virar uma empresa de tecnologia. Precisa de alguém pensando em TI do jeito que pensa em estratégia." — Hervesson Porto
7. **CTA FINAL** (azul) — Vamos fazer a tecnologia trabalhar pra sua empresa? / botão "Fala comigo" / @hervessongporto

## Notas de produção

- Fonte: **Plus Jakarta Sans** (Google Fonts), substituta de "Typo Angular Rounded". ⚠️ O `render.js` original bloqueava o Google Fonts (`route.abort()`) e os PNGs saíam em fonte fallback — corrigido: render aguarda `document.fonts.ready`.
- Cores: fundo escuro `#1E1F24`, fundo claro `#FAFAF7`, destaque `#0090FF`.
- Ritmo de fundos: escuro → claro → azul → escuro → claro → escuro → azul (sem repetição consecutiva).
- Layouts: CAPA / NÚMERO sólido / NÚMERO marca d'água / CITAÇÃO / CTA FINAL, com régua azul, contador em todos os slides e rodapé "SINAL X DE 04" nos slides internos.
- Logo: `identidade/logo-dark.png` (fundos escuro/azul) e `identidade/logo-light.png` (fundo claro).
- Handle `@hervessongporto` no topo esquerdo de todos os slides.
