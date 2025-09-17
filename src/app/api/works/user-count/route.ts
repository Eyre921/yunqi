import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'  // 添加缺失的code字段
      }, { status: 401 });
    }

    // 查询用户上传的作品数量
    const count = await prisma.work.count({
      where: {
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        count,
        userId: session.user.id
      },
      message: '查询成功'
    }, { status: 200 });

  } catch (error) {
    console.error('查询用户上传数量失败:', error);
    return NextResponse.json({
      success: false,
      error: '查询失败',
      code: 'QUERY_ERROR'
    }, { status: 500 });
  }
}