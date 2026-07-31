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
  ]
}
