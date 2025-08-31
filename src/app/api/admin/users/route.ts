import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

// 用户查询验证模式
const UserQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  role: z.enum(['USER', 'ADMIN']).optional(),
  search: z.string().optional()
});

// 获取用户列表（仅管理员）
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
    const query = UserQuerySchema.parse(Object.fromEntries(searchParams));
    
    const where = {
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              works: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    
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