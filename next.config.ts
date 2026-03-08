import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Necesario para que pdfjs-dist encuentre su worker
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
}

export default nextConfig;
