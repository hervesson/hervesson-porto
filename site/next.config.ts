import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há lockfiles em pastas acima (workspace MazyOS); fixa a raiz do build aqui.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
