"use client";

import { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";

const inputClass =
  "bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand w-full";
const labelClass = "text-xs text-muted";

export type DreamItem = {
  id: string;
  title: string;
  note: string | null;
  imageUrl: string;
  order: number;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DreamForm({
  dream,
  onClose,
  onSaved,
}: {
  dream?: DreamItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(dream);
  const [title, setTitle] = useState(dream?.title ?? "");
  const [note, setNote] = useState(dream?.note ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(dream?.imageUrl ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function onFileChange(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Informe o título.");
      return;
    }
    if (!isEdit && !file) {
      setError("Escolha uma imagem.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload: Record<string, unknown> = { title: title.trim(), note: note.trim() || null };
    if (file) {
      payload.image = { name: file.name, mimeType: file.type, base64: await fileToBase64(file) };
    }

    const res = await fetch(isEdit ? `/api/dreams/${dream!.id}` : "/api/dreams", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao salvar.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md bg-surface border border-line rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <h2 className="font-semibold text-lg">{isEdit ? "Editar sonho" : "Novo sonho"}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-cream transition" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Qual é o sonho?" className={inputClass} autoFocus />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Por que esse sonho importa (opcional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="O que te motiva a chegar lá" className={inputClass} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Imagem</span>
          {preview ? (
            <div className="relative rounded-lg overflow-hidden h-36 bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-36 rounded-lg bg-surface-2 border border-dashed border-line flex items-center justify-center text-muted">
              <ImageIcon size={24} />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="text-xs text-muted"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-brand-ink font-medium rounded-lg px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? "Salvando…" : isEdit ? "Salvar" : "Adicionar sonho"}
          </button>
        </div>
      </form>
    </div>
  );
}
