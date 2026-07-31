import fs from "fs"
import path from "path"

// Fontes da marca pras imagens de OG. O ImageResponse (satori) não enxerga o
// next/font — precisa do arquivo bruto, e só aceita ttf/otf/woff (woff2 não).
// Ficam vendorizadas no repo (licença OFL) em vez de buscadas na rede, pra o
// build não depender de CDN externo.
const dir = path.join(process.cwd(), "lib/fonts")

function load(file: string) {
  return fs.readFileSync(path.join(dir, file))
}

export function ogFonts() {
  return [
    {
      name: "Plus Jakarta Sans",
      data: load("PlusJakartaSans-Regular.ttf"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Plus Jakarta Sans",
      data: load("PlusJakartaSans-ExtraBold.ttf"),
      weight: 800 as const,
      style: "normal" as const,
    },
  ]
}

export const OG_FONT_FAMILY = "Plus Jakarta Sans"
