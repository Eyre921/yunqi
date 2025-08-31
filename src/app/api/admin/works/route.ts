import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, WorkStatus } from '@prisma/client';
import { z } from 'zod';

// 作品查询验证模式
const WorkQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'approvedAt', 'likeCount', 'viewCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// 获取作品列表（管理员视图）
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

    const { searchParams } = new URL(request.url);
    const query = WorkQuerySchema.parse(Object.fromEntries(searchParams));
    
    const where = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { author: { contains: query.search, mode: 'insensitive' as const } }
        ]
      })
    };

    // 构建排序条件
    let orderBy: any;
    switch (query.sortBy) {
      case 'likeCount':
        orderBy = { likeCount: query.sortOrder };
        break;
      case 'viewCount':
        orderBy = { viewCount: query.sortOrder };
        break;
      case 'approvedAt':
        orderBy = { approvedAt: query.sortOrder };
        break;
      case 'createdAt':
      default:
        orderBy = { createdAt: query.sortOrder };
        break;
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy
      }),
      prisma.work.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        works,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit)
        }
      }
    });
  } catch (error) {
    console.error('获取作品列表失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '查询参数无效',
        code: 'VALIDATION_ERROR',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}