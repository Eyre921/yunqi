import type { NextConfig } from "next";

const nextConfig: NextConfig = {
//   output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 支持大文件上传
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
};

export default nextConfig;