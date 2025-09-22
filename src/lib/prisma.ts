import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 根据服务器配置优化数据库连接
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // 为8核16GB服务器优化连接池配置
  const url = new URL(baseUrl);
  
  // 设置连接池参数（针对8核CPU优化）
  url.searchParams.set('connection_limit', '20'); // 每核心2-3个连接
  url.searchParams.set('pool_timeout', '20'); // 连接超时20秒
  url.searchParams.set('connect_timeout', '10'); // 建立连接超时10秒
  url.searchParams.set('socket_timeout', '30'); // Socket超时30秒
  url.searchParams.set('statement_timeout', '30000'); // 语句超时30秒
  url.searchParams.set('idle_timeout', '600'); // 空闲连接超时10分钟
  
  return url.toString();
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: 'pretty',
  });

// 优雅关闭数据库连接
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;