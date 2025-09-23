import type { NextConfig } from "next";

const nextConfig = {
  // 图片配置
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'http',
        hostname: '**'
      }
    ],
  },
  
  // 外部包配置
  serverExternalPackages: ['bcryptjs', 'ali-oss'],
  
  // 将 headers 移到顶级配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yunqi.nfeyre.top' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
        {
          source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' },
          ],
        },
        {
          source: '/images/:path*',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=2592000' },
          ],
        },
      ];
  },
  
  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;