import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getPost, getPublishedPosts } from "@/lib/posts"
import { JsonLd } from "@/components/json-ld"
import { site } from "@/lib/site"
import { graph, articleSchema, breadcrumbSchema } from "@/lib/schema"

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}

  // Rascunho nunca deve ser indexado, mesmo se a URL vazar.
  if (post.draft) return { title: post.title, robots: { index: false, follow: false } }

  const url = `/blog/${slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date || undefined,
      authors: [site.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

function formatDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post || post.draft) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <JsonLd
        data={graph(
          articleSchema(post),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        )}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar pro blog
      </Link>
      <header className="space-y-3 mb-10">
        <time className="text-sm text-gray-500">{formatDate(post.date)}</time>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {post.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">{post.description}</p>
      </header>
      <div
        className="prose-blog space-y-5 leading-relaxed text-gray-700 dark:text-gray-200 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-10 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_img]:rounded-xl [&_img]:border [&_img]:border-black/5 dark:[&_img]:border-white/10"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  )
}
