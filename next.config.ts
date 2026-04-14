import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'files.stripe.com' },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: `(?<subdomain>[^.]+)\\.${process.env.NEXT_PUBLIC_DOMAIN?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
            },
          ],
          destination: '/:subdomain/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig
