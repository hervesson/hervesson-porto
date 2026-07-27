import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build isolado do resto do workspace MazyOS (há lockfiles acima)
  turbopack: {
    root: __dirname,
  },
  // gera imagem Docker enxuta (server.js standalone)
  output: "standalone",
  // Next só serve, em produção, os arquivos de public/ que existiam no
  // build — uploads feitos em runtime (fotos de sonhos, anexos do
  // WhatsApp) só apareceriam depois de reiniciar o servidor. beforeFiles
  // garante que isso roda antes da checagem de arquivo estático do Next,
  // sem precisar mudar nenhuma URL já salva no banco.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
    };
  },
};

export default nextConfig;
