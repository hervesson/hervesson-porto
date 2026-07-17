import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build isolado do resto do workspace MazyOS (há lockfiles acima)
  turbopack: {
    root: __dirname,
  },
  // gera imagem Docker enxuta (server.js standalone)
  output: "standalone",
};

export default nextConfig;
