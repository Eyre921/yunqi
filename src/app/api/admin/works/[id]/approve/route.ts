import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, WorkStatus } from '@prisma/client';
import { toPlainJSON } from '@/lib/serialize';

// 审核通过
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
        status: WorkStatus.APPROVED,
        approvedAt: new Date()
        // 移除 approvedBy: session.user.id
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
      data: toPlainJSON(updatedWork),
      message: '作品审核通过'
    });
  } catch (error) {
    console.error('审核作品失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}