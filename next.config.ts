import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone',
  
  // 移除assetPrefix，让CDN直接回源获取静态资源
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://yunqi.nfeyre.top' : '',
  
  // 图片配置
  images: {
    unoptimized: false, // 启用图片优化
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
  },
  
  // 外部包配置（Next.js 15 新语法）
  serverExternalPackages: ['bcryptjs'],
  
  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    ignoreDuringBuilds: false,
  },

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
      // 静态资源 - 长期缓存（因为有哈希值）
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // HTML页面 - 短期缓存
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' }, // 5分钟
        ],
      },
      // 图片资源
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000' }, // 30天
        ],
      },
    ];
  },
};

export default nextConfig;