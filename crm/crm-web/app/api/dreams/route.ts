import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BASE64_LEN = 16 * 1024 * 1024; // ~16MB de base64 (~12MB de arquivo)

// GET = lista de sonhos, na ordem definida pelo usuário.
export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dreams = await prisma.dream.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ dreams });
}

// POST = cria um sonho novo (imagem obrigatória).
export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() || null : null;
  const { name, mimeType, base64 } = body.image ?? {};

  if (!title) return NextResponse.json({ error: "título é obrigatório" }, { status: 400 });
  if (!name || !mimeType || !base64) {
    return NextResponse.json({ error: "imagem é obrigatória" }, { status: 400 });
  }
  if (base64.length > MAX_BASE64_LEN) {
    return NextResponse.json({ error: "imagem muito grande (máx. ~12MB)" }, { status: 413 });
  }

  const safeName = String(name).replace(/[^\w.\-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads", "dreams");
  const imageUrl = `/uploads/dreams/${fileName}`;

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), Buffer.from(base64, "base64"));
  } catch (err) {
    return NextResponse.json({ error: "falha ao salvar a imagem", detail: String(err) }, { status: 500 });
  }

  const maxOrder = await prisma.dream.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;

  const dream = await prisma.dream.create({
    data: { title, note, imageUrl, order },
  });
  return NextResponse.json({ ok: true, dream });
}
