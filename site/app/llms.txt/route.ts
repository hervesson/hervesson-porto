import { getPublishedPosts } from "@/lib/posts"
import { site } from "@/lib/site"

// llms.txt (llmstxt.org) — resumo do site em markdown pra LLMs entenderem o
// negócio sem precisar rastrear/interpretar o HTML inteiro. Gerado a partir do
// conteúdo real, então não desatualiza quando um post novo entra.
export const dynamic = "force-static"

export function GET() {
  const posts = getPublishedPosts()

  const body = `# ${site.name}

> ${site.description}

${site.name} — ${site.jobTitle}. Posicionamento: ${site.tagline}. Aplica TI e IA
dentro de empresas que precisam de estrutura e não têm um time técnico interno.
Diferencial declarado: credibilidade acima de hype, resultado prático.
Atende ${site.areaServed.join(", ")}.

## Serviços

- Atendimento com IA no WhatsApp: atendente virtual que responde 24h, qualifica o lead e pode agendar e cobrar sinal.
- Sites profissionais: presença e credibilidade pra quem pesquisa antes de comprar.
- Sistemas sob medida e CRM: cadastro, funil e histórico num lugar só, feito pro processo da empresa.
- Automação de processo e operação: do lead à entrega, automatizando o que hoje é manual.
- Google Meu Negócio: estruturação do perfil pra busca local.
- Tráfego pago: Google Ads e Meta Ads com foco em custo de aquisição e retorno.

## Blog

${posts
  .map((p) => `- [${p.title}](${site.url}/blog/${p.slug}): ${p.description}`)
  .join("\n")}

## Contato

- Site: ${site.url}
- WhatsApp: ${site.phone}
- E-mail: ${site.email}
- Instagram: ${site.instagram}
`

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
