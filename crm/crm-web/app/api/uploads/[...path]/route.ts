import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
};

// Serve public/uploads/* lendo do disco a cada requisição. O Next.js só
// enxerga, em produção, os arquivos de public/ que já existiam no momento do
// build — qualquer coisa escrita depois (uploads em runtime: fotos de
// sonhos, anexos do WhatsApp) só apareceria após reiniciar o servidor. Um
// rewrite em next.config.ts manda /uploads/* pra cá, contornando isso.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (segments.some((s) => s.includes("..") || s.includes("\0"))) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        // nome do arquivo tem timestamp — nunca muda de conteúdo, pode
        // cachear pesado (mesmo tratamento dos assets de _next/static)
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
