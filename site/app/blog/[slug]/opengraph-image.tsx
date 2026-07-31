import { ImageResponse } from "next/og"
import { getPost, getPublishedPosts } from "@/lib/posts"
import { site } from "@/lib/site"
import { ogFonts, OG_FONT_FAMILY } from "@/lib/og-fonts"

export const alt = "Artigo do blog de Hervesson Porto"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Pré-gera a imagem de cada post publicado no build (mesma lista que o
// generateStaticParams da página), em vez de renderizar sob demanda.
export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }))
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  const title = post?.title ?? site.name

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1E1F24",
          padding: "70px 90px",
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 7,
            textTransform: "uppercase",
            color: "#0090FF",
            fontWeight: 700,
          }}
        >
          Blog
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 54 : 66,
            fontWeight: 800,
            color: "#FAFAF7",
            lineHeight: 1.15,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 60, height: 4, background: "#0090FF" }} />
          <div style={{ display: "flex", fontSize: 27, color: "rgba(250,250,247,0.7)" }}>
            {site.name} · {site.tagline}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  )
}
