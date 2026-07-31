// Dados de contato e identidade usados em todo o site.
export const site = {
  // URL canônica de produção. Serve de metadataBase (URLs absolutas em OG/
  // Twitter), do sitemap e do robots. Sem isso as imagens de OG saem
  // relativas e os crawlers não conseguem resolver.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trinctecnologies.com.br",
  name: "Hervesson Porto",
  jobTitle: "Especialista em TI e IA aplicada a negócios",
  tagline: "Tecnologia · Estratégia · Resultados",
  description:
    "TI e IA aplicadas a negócios: atendimento com IA, tráfego pago, conteúdo, sistemas sob medida e automação de processos pra fazer a tecnologia trabalhar pra sua empresa.",
  whatsappUrl:
    "https://wa.me/5598988958835?text=Oi%2C%20Hervesson!%20Quero%20fazer%20o%20diagn%C3%B3stico%20gratuito.",
  email: "hervessonporto@gmail.com",
  instagram: "https://instagram.com/hervessongporto",
  instagramHandle: "@hervessongporto",
  // Telefone em formato E.164, usado no JSON-LD (schema.org espera assim).
  phone: "+5598988958835",
  // Área de atuação declarada nos dados estruturados.
  areaServed: ["São Luís", "São José de Ribamar", "Maranhão", "Brasil"],
}
