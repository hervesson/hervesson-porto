import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM — Hervesson Porto",
  description: "Gestão de leads e atendimento WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
