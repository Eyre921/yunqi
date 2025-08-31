import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, WorkStatus } from '@prisma/client';

// 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 获取基础统计数据
    const [totalUsers, totalWorks, pendingWorks, approvedWorks, rejectedWorks] = await Promise.all([
      prisma.user.count(),
      prisma.work.count(),
      prisma.work.count({ where: { status: WorkStatus.PENDING } }),
      prisma.work.count({ where: { status: WorkStatus.APPROVED } }),
      prisma.work.count({ where: { status: WorkStatus.REJECTED } })
    ]);

    // 获取最近7天的数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentUsers, recentWorks] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.work.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      })
    ]);

    // 获取每日统计数据（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count,
        'works' as type
      FROM "works" 
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    ` as Array<{ date: Date; count: bigint; type: string }>;

    const dailyUserStats = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count,
        'users' as type
      FROM "users" 
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    ` as Array<{ date: Date; count: bigint; type: string }>;

    // 获取热门作品（按创建时间排序的最新审核通过作品）
    const popularWorks = await prisma.work.findMany({
      where: {
        status: WorkStatus.APPROVED
      },
      select: {
        id: true,
        name: true,
        title: true,
        author: true,
        createdAt: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // 获取活跃用户（按作品数量排序）
    const activeUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            works: true
          }
        }
      },
      orderBy: {
        works: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const stats = {
      success: true,
      data: {
        overview: {
          totalUsers: Number(totalUsers),
          totalWorks: Number(totalWorks),
          pendingWorks: Number(pendingWorks),
          approvedWorks: Number(approvedWorks),
          rejectedWorks: Number(rejectedWorks),
          recentUsers: Number(recentUsers),
          recentWorks: Number(recentWorks)
        },
        charts: {
          dailyWorks: dailyStats.map(item => ({
            ...item,
            count: Number(item.count)
          })),
          dailyUsers: dailyUserStats.map(item => ({
            ...item,
            count: Number(item.count)
          }))
        },
        lists: {
          popularWorks,
          activeUsers
        }
      }
    };

    // 添加缓存头
    const response = NextResponse.json(stats);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}