import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { toPlainJSON } from '@/lib/serialize';

// 查询参数验证模式
const WorksQuerySchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().nullable().optional().transform(val => val ? parseInt(val) : 10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).nullable().optional(),
  search: z.string().nullable().optional()
});

// GET /api/user/works - 获取用户作品列表
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search')
    };

    const validatedQuery = WorksQuerySchema.parse(queryData);
    const { page, limit, status, search } = validatedQuery;

    // 构建查询条件
    const where: any = {
      userId: session.user.id
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 获取作品列表和总数
    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          title: true,
          description: true,
          author: true,
          imageUrl: true,
          status: true,
          featured: true,
          likeCount: true, // 修复：使用 likeCount 而不是 likes
          viewCount: true,
          createdAt: true,
          updatedAt: true
          // 移除 category 字段，因为 Work 模型中没有这个关系
        }
      }),
      prisma.work.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    const safeData = toPlainJSON({
      works,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

    return NextResponse.json({
      success: true,
      data: safeData,
      message: '获取作品列表成功'
    });

  } catch (error: unknown) {
    console.error('获取用户作品列表失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '查询参数无效',
        code: 'VALIDATION_ERROR',
        details: error.issues
      }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '获取作品列表失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}