import { site } from "./site"
import type { PostMeta } from "./posts"

// IDs estáveis pra poder referenciar as entidades entre si (@id) em vez de
// repetir o objeto inteiro em cada página. É o que permite ao Google entender
// que a Person e o ProfessionalService são a mesma operação.
export const SCHEMA_IDS = {
  person: `${site.url}/#person`,
  business: `${site.url}/#business`,
  website: `${site.url}/#website`,
} as const

export function personSchema() {
  return {
    "@type": "Person",
    "@id": SCHEMA_IDS.person,
    name: site.name,
    url: site.url,
    jobTitle: site.jobTitle,
    email: `mailto:${site.email}`,
    telephone: site.phone,
    image: `${site.url}/opengraph-image`,
    sameAs: [site.instagram],
    knowsAbout: [
      "Inteligência artificial aplicada a negócios",
      "Desenvolvimento de software sob medida",
      "CRM e sistemas de gestão",
      "Automação de processos",
      "Tráfego pago",
    ],
  }
}

export function businessSchema() {
  return {
    "@type": "ProfessionalService",
    "@id": SCHEMA_IDS.business,
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: `mailto:${site.email}`,
    image: `${site.url}/opengraph-image`,
    priceRange: "$$",
    founder: { "@id": SCHEMA_IDS.person },
    areaServed: site.areaServed.map((name) => ({ "@type": "Place", name })),
    sameAs: [site.instagram],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços",
      itemListElement: [
        "Atendimento com IA no WhatsApp",
        "Desenvolvimento de sites",
        "Sistemas sob medida e CRM",
        "Automação de processos",
        "Google Meu Negócio",
        "Tráfego pago",
      ].map((n) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: n },
      })),
    },
  }
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": SCHEMA_IDS.website,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: "pt-BR",
    publisher: { "@id": SCHEMA_IDS.person },
  }
}

export function articleSchema(post: PostMeta) {
  const url = `${site.url}/blog/${post.slug}`
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    // Sem histórico de edição por post, dateModified = datePublished. Mentir
    // aqui (carimbar "hoje") é sinal ruim pro Google.
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "pt-BR",
    image: `${url}/opengraph-image`,
    author: { "@id": SCHEMA_IDS.person },
    publisher: { "@id": SCHEMA_IDS.person },
    isPartOf: { "@id": SCHEMA_IDS.website },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  }
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  }
}

// Empacota tudo num único bloco @graph — um <script> só por página, que é o
// formato que o Google prefere quando as entidades se referenciam.
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes }
}
