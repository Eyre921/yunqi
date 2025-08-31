import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, WorkStatus } from '@prisma/client';
import { z } from 'zod';

// 拒绝理由验证模式
const RejectSchema = z.object({
  reason: z.string().min(1, '拒绝理由不能为空')
});

// 审核拒绝
export async function POST(
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
    const { reason } = RejectSchema.parse(body);

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

    if (work.status !== WorkStatus.PENDING) {
      return NextResponse.json({
        success: false,
        error: '只能审核待审核状态的作品',
        code: 'UNPROCESSABLE_ENTITY'
      }, { status: 422 });
    }

    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        status: WorkStatus.REJECTED,
        rejectedAt: new Date(),
        rejectReason: reason
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
      message: '作品已拒绝'
    });
  } catch (error) {
    console.error('拒绝作品失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: error.issues  // 修改：从 error.errors 改为 error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}