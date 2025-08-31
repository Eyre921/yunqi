import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone',
  
  // 图片配置
  images: {
    unoptimized: true,
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