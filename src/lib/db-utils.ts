import { prisma } from './prisma';
import { Work, WorkStatus } from '@prisma/client';

// 获取热门作品
export async function getPopularWorks(limit: number = 50): Promise<Work[]> {
  return await prisma.work.findMany({
    where: {
      status: WorkStatus.APPROVED,
      isDeleted: false,
    },
    orderBy: [
      { likeCount: 'desc' },
      { viewCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });
}

// 获取最新作品
export async function getLatestWorks(limit: number = 10): Promise<Work[]> {
  return await prisma.work.findMany({
    where: {
      status: WorkStatus.APPROVED,
      isDeleted: false,
    },
    orderBy: {
      approvedAt: 'desc',
    },
    take: limit,
  });
}

// 增加作品浏览数
export async function incrementViewCount(workId: string): Promise<void> {
  await prisma.work.update({
    where: { id: workId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}

// 增加作品点赞数
export async function incrementLikeCount(workId: string): Promise<Work> {
  return await prisma.work.update({
    where: { id: workId },
    data: {
      likeCount: {
        increment: 1,
      },
    },
  });
}

// 获取作品统计数据
export async function getWorkStats() {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.work.count({ where: { isDeleted: false } }),
    prisma.work.count({ where: { status: WorkStatus.PENDING, isDeleted: false } }),
    prisma.work.count({ where: { status: WorkStatus.APPROVED, isDeleted: false } }),
    prisma.work.count({ where: { status: WorkStatus.REJECTED, isDeleted: false } }),
  ]);

  return { total, pending, approved, rejected };
}