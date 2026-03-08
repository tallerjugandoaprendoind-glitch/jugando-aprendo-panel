import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir importación dinámica de pdfjs desde CDN en el cliente
  experimental: {
    externalDir: true,
  },
  // Excluir pdfjs del bundle de servidor (sólo se usa en browser)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas']
    }
    return config
  },
}

export default nextConfig;
