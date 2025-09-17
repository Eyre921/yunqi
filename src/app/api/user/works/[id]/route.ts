import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { deleteFromOSS } from '@/lib/oss';
import { toPlainJSON } from '@/lib/serialize';

// GET /api/user/works/[id] - 获取单个作品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const work = await prisma.work.findFirst({
      where: {
        id,
        userId: session.user.id // 确保只能访问自己的作品
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
        // 移除 category 字段，因为 Work 模型中没有这个关系
      }
    });

    if (!work) {
      return NextResponse.json({
        success: false,
        error: '作品不存在或无权访问',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: toPlainJSON(work),
      message: '获取作品详情成功'
    });

  } catch (error: unknown) {
    console.error('获取作品详情失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '获取作品详情失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

// DELETE /api/user/works/[id] - 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // 查找作品，确保是用户自己的作品
    const work = await prisma.work.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!work) {
      return NextResponse.json({
        success: false,
        error: '作品不存在或无权删除',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 从OSS删除文件
    if (work.ossKey || work.imagePath) {
      try {
        const ossKey = work.ossKey || work.imagePath;
        if (ossKey) {
          await deleteFromOSS(ossKey);
          console.log(`OSS文件删除成功: ${ossKey}`);
        }
      } catch (ossError) {
        console.error('OSS文件删除失败:', ossError);
        // 继续删除数据库记录，即使OSS删除失败
      }
    }

    // 删除数据库记录
    await prisma.work.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '作品删除成功'
    });

  } catch (error: unknown) {
    console.error('删除作品失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '删除作品失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}