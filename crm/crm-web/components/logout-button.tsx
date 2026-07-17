"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="text-muted hover:text-cream transition flex items-center gap-1.5 text-sm"
      title="Sair"
    >
      <LogOut size={16} /> Sair
    </button>
  );
}
