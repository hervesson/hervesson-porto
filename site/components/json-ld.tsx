// Injeta dados estruturados. Server component — o JSON sai no HTML da resposta,
// que é o que os crawlers leem (script injetado via JS não é garantido).
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify já escapa aspas; o replace protege contra um "</script>"
      // dentro de algum texto fechar a tag antes da hora.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
