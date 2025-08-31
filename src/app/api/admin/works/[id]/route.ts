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
export async function PATCH(
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

    const body = await request.json();
    const { status, rejectReason } = WorkReviewSchema.parse(body);
    
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

    // 验证拒绝理由
    if (status === WorkStatus.REJECTED && !rejectReason) {
      return NextResponse.json({
        success: false,
        error: '拒绝时必须提供拒绝原因',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // 更新作品状态
    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        status,
        ...(status === WorkStatus.APPROVED && { approvedAt: new Date() }),
        ...(status === WorkStatus.REJECTED && { 
          rejectedAt: new Date(),
          rejectReason 
        }),
        ...(status === WorkStatus.PENDING && {
          approvedAt: null,
          rejectedAt: null,
          rejectReason: null
        })
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

    const statusMessages = {
      [WorkStatus.APPROVED]: '作品审核通过',
      [WorkStatus.REJECTED]: '作品已拒绝',
      [WorkStatus.PENDING]: '作品已重置为待审核状态'
    };

    return NextResponse.json({
      success: true,
      data: updatedWork,
      message: statusMessages[status]
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
      error: '服务器内部错误',
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