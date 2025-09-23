import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 移除已废弃的 __internal 配置
    // 连接池配置现在通过 DATABASE_URL 中的参数控制
    // 例如: postgresql://user:password@localhost:5432/db?connection_limit=10
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;