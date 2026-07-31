import { ImageResponse } from "next/og"
import { site } from "@/lib/site"
import { ogFonts, OG_FONT_FAMILY } from "@/lib/og-fonts"

export const alt = `${site.name} — ${site.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Imagem padrão de compartilhamento (WhatsApp, LinkedIn, X). Gerada em build,
// então não custa nada em runtime. Paleta e tipografia batem com a identidade
// da marca (identidade/design-guide.md): fundo grafite, destaque azul.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1E1F24",
          padding: "80px 90px",
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#0090FF",
            fontWeight: 700,
          }}
        >
          {site.tagline}
        </div>
        <div
          style={{
            display: "flex",
            width: 90,
            height: 5,
            background: "#0090FF",
            margin: "28px 0 36px",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            color: "#FAFAF7",
            lineHeight: 1.1,
            letterSpacing: -2,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "rgba(250,250,247,0.66)",
            marginTop: 28,
            lineHeight: 1.4,
            maxWidth: 900,
          }}
        >
          TI e IA aplicada a negócios que precisam de estrutura
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  )
}
