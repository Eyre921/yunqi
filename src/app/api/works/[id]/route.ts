import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/works/[id] - 获取单个作品
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const work = await prisma.work.findUnique({
      where: { id: params.id },
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
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const work = await prisma.work.findUnique({
      where: { id: params.id }
    });

    if (!work) {
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只有作品所有者或管理员可以更新
    if (work.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: '无权限更新此作品' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, title, author, prompt, imageUrl } = body; // 修改这里

    const updatedWork = await prisma.work.update({
      where: { id: params.id },
      data: {
        name,     // 修改这里
        title,    // 修改这里
        author,   // 修改这里
        prompt,   // 修改这里
        imageUrl
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
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const work = await prisma.work.findUnique({
      where: { id: params.id }
    });

    if (!work) {
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只有作品所有者或管理员可以删除
    if (work.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: '无权限删除此作品' },
        { status: 403 }
      );
    }

    await prisma.work.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: '作品删除成功' });
  } catch (error) {
    console.error('删除作品失败:', error);
    return NextResponse.json(
      { error: '删除作品失败' },
      { status: 500 }
    );
  }
}