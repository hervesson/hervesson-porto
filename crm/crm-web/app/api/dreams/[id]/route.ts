import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 16 * 1024 * 1024;

// PATCH = edita título/nota/ordem e, opcionalmente, substitui a imagem.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.note === "string") data.note = body.note.trim() || null;
  if (body.note === null) data.note = null;
  if (typeof body.order === "number") data.order = body.order;

  if (body.image) {
    const { name, mimeType, base64 } = body.image;
    if (name && mimeType && base64) {
      if (base64.length > MAX_BASE64_LEN) {
        return NextResponse.json({ error: "imagem muito grande (máx. ~12MB)" }, { status: 413 });
      }
      const safeName = String(name).replace(/[^\w.\-]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;
      const dir = path.join(process.cwd(), "public", "uploads", "dreams");
      try {
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, fileName), Buffer.from(base64, "base64"));
      } catch (err) {
        return NextResponse.json({ error: "falha ao salvar a imagem", detail: String(err) }, { status: 500 });
      }
      data.imageUrl = `/uploads/dreams/${fileName}`;
    }
  }

  const dream = await prisma.dream.update({ where: { id }, data });
  return NextResponse.json({ ok: true, dream });
}

// DELETE = remove o sonho (não apaga o arquivo do disco).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.dream.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
