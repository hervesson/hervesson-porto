import type { Metadata } from "next"
import Link from "next/link"
import { getPublishedPosts } from "@/lib/posts"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "TI, IA e estratégia aplicadas a negócios — sem hype, com resultado prático.",
}

function formatDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

export default function BlogPage() {
  const posts = getPublishedPosts()

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
      <div className="space-y-3 mb-12">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Blog
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          TI, IA e estratégia aplicadas a negócios — sem hype, com resultado
          prático.
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-gray-500">Nenhum post publicado ainda.</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-black/5 dark:border-white/10 p-6 hover:border-brand/40 transition-colors"
              >
                <time className="text-xs text-gray-500">
                  {formatDate(post.date)}
                </time>
                <h2 className="text-xl font-semibold mt-1 group-hover:text-brand transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {post.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
