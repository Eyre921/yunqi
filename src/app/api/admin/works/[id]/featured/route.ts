import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 验证精选状态请求
const FeaturedSchema = z.object({
  featured: z.boolean()
});

// PATCH /api/admin/works/[id]/featured - 设置作品精选状态
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const body = await request.json();
    const { featured } = FeaturedSchema.parse(body);
    
    // 检查作品是否存在
    const work = await prisma.work.findUnique({
      where: { id }
    });

    if (!work) {
      return NextResponse.json({
        success: false,
        error: '作品不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 只有已审核通过的作品才能设为精选
    if (featured && work.status !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: '只有已审核通过的作品才能设为精选',
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // 更新作品精选状态
    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        featured
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedWork,
      message: featured ? '作品已设为精选' : '作品已取消精选'
    });
  } catch (error) {
    console.error('设置作品精选状态失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效',
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