import type { NextConfig } from "next";

// 假设你当前导出的是 nextConfig（若为其他变量名或 CommonJS 导出，按你的文件实际调整）
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
  
  // 外部包配置 - 添加 ali-oss 到服务端专用包
  serverExternalPackages: ['bcryptjs', 'ali-oss'],
  
  // 实验性功能配置
  experimental: {
    // 修复：将 serverComponentsExternalPackages 从 experimental 中移除
    // 注意：此处不再包含 experimental.serverComponentsExternalPackages
    // 如果 experimental 中没有其它配置，可以删除 experimental 整个配置块；若有，其余保持不变。

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
  },
  
  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;