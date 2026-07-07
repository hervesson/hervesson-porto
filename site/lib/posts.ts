import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { remark } from "remark"
import html from "remark-html"

const postsDirectory = path.join(process.cwd(), "content/blog")

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  draft: boolean
}

export interface Post extends PostMeta {
  contentHtml: string
}

function readPostFile(fileName: string): { meta: PostMeta; content: string } {
  const slug = fileName.replace(/\.md$/, "")
  const fullPath = path.join(postsDirectory, fileName)
  const fileContents = fs.readFileSync(fullPath, "utf8")
  const { data, content } = matter(fileContents)
  return {
    meta: {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date:
        data.date instanceof Date
          ? data.date.toISOString().slice(0, 10)
          : data.date
            ? String(data.date).slice(0, 10)
            : "",
      draft: data.draft === true,
    },
    content,
  }
}

export function getPublishedPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return []
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readPostFile(file).meta)
    .filter((meta) => !meta.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPost(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null
  const { meta, content } = readPostFile(`${slug}.md`)
  const processed = await remark().use(html).process(content)
  return { ...meta, contentHtml: processed.toString() }
}
