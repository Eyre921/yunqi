import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone',
  
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
};

export default nextConfig;