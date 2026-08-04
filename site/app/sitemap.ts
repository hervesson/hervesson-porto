import type { MetadataRoute } from "next"
import { getPublishedPosts } from "@/lib/posts"
import { site } from "@/lib/site"

// Sitemap gerado a partir do conteúdo real — posts em draft ficam de fora
// automaticamente (getPublishedPosts já filtra), então nunca vaza rascunho
// pro Google.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPublishedPosts()

  // lastModified do índice do blog = data do post mais recente, não "agora".
  // Carimbar new Date() a cada build faz o Google reprocessar à toa e perder
  // confiança no sinal de data.
  const latestPostDate = posts[0]?.date ? new Date(posts[0].date) : new Date()

  return [
    {
      url: site.url,
      lastModified: latestPostDate,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.url}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    // Páginas jurídicas — precisam ser públicas e indexáveis: a análise de
    // integridade da Meta acessa a política de privacidade pela URL.
    // lastModified fixo na data da revisão do texto (ver lib/legal.ts), não
    // new Date(), pra não sinalizar mudança a cada build.
    {
      url: `${site.url}/privacidade`,
      lastModified: new Date("2026-08-04"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${site.url}/termos`,
      lastModified: new Date("2026-08-04"),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ]
}
