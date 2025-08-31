import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, WorkStatus } from '@prisma/client';
import { z } from 'zod';

// 作品审核验证模式
const WorkReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
  rejectReason: z.string().optional()
});

// PATCH /api/admin/works/[id] - 审核作品
// 在审核通过的逻辑中添加随机初始点赞数
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = WorkReviewSchema.parse(body);

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
      where: { id }
    });

    if (!existingWork) {
      return NextResponse.json({
        success: false,
        error: '作品不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 准备更新数据
    const updateData: any = {
      status: validatedData.status,
      reviewedAt: new Date(),
      reviewedBy: session.user.id
    };

    // 如果是审核通过，添加随机初始点赞数（10-50之间）
    if (validatedData.status === 'APPROVED' && existingWork.status !== 'APPROVED') {
      const initialLikes = Math.floor(Math.random() * 41) + 10; // 10-50之间的随机数
      updateData.likeCount = initialLikes;
    }

    // 如果是拒绝，添加拒绝理由
    if (validatedData.status === 'REJECTED') {
      updateData.rejectReason = validatedData.rejectReason;
    }

    // 更新作品
    const updatedWork = await prisma.work.update({
      where: { id },
      data: updateData,
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
      message: `作品已${validatedData.status === 'APPROVED' ? '通过审核' : validatedData.status === 'REJECTED' ? '被拒绝' : '更新状态'}`
    });

  } catch (error) {
    console.error('审核作品失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '审核作品失败',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// GET /api/admin/works/[id] - 获取单个作品详情（管理员视图）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const work = await prisma.work.findUnique({
      where: { id },
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

    if (!work) {
      return NextResponse.json({
        success: false,
        error: '作品不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: work
    });
  } catch (error) {
    console.error('获取作品详情失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}