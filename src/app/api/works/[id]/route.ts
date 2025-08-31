import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/works/[id] - 获取单个作品
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(work);
  } catch (error) {
    console.error('获取作品失败:', error);
    return NextResponse.json(
      { error: '获取作品失败' },
      { status: 500 }
    );
  }
}

// PUT /api/works/[id] - 更新作品
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    // 添加 featured 字段支持
    const { name, title, description, author, prompt, imageUrl, status, featured } = body;

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
      where: { id }
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只有作品创建者或管理员可以更新
    if (existingWork.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    // 只有管理员可以设置精选状态
    if (featured !== undefined && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: '只有管理员可以设置精选状态' },
        { status: 403 }
      );
    }

    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        // 只更新 Work 模型中存在的字段
        ...(name && { name }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(author && { author }),
        ...(prompt !== undefined && { prompt }),
        ...(imageUrl && { imageUrl }),
        ...(status && { status }),
        ...(featured !== undefined && { featured })
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

    return NextResponse.json(updatedWork);
  } catch (error) {
    console.error('更新作品失败:', error);
    return NextResponse.json(
      { error: '更新作品失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/works/[id] - 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
      where: { id }
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只有作品创建者或管理员可以删除
    if (existingWork.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    await prisma.work.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: '作品删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除作品失败:', error);
    return NextResponse.json(
      { error: '删除作品失败' },
      { status: 500 }
    );
  }
}