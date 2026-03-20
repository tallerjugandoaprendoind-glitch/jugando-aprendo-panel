import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseHost = SUPABASE_URL.replace('https://', '')

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['pdf-parse'],

  // Proxy Supabase through our own domain to avoid network blocks
  async rewrites() {
    return [
      {
        source: '/api/sb/:path*',
        destination: `${SUPABASE_URL}/:path*`,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/api/sb/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, apikey, x-client-info' },
        ],
      },
    ]
  },
}

export default nextConfig;

