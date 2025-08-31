import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkStatus } from '@prisma/client';

// GET /api/works - 获取作品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as WorkStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = status ? { status } : { status: WorkStatus.APPROVED };

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.work.count({ where })
    ]);

    return NextResponse.json({
      works,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取作品列表失败:', error);
    return NextResponse.json(
      { error: '获取作品列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/works - 创建新作品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, title, author, prompt, imageUrl } = body; // 修改这里

    if (!name || !title || !imageUrl) { // 修改这里
      return NextResponse.json(
        { error: '作品名称、标题和图片URL是必需的' },
        { status: 400 }
      );
    }

    const work = await prisma.work.create({
      data: {
        name,     // 修改这里
        title,    // 修改这里
        author,   // 修改这里
        prompt,   // 修改这里
        imageUrl,
        status: WorkStatus.PENDING,
        userId: session.user.id
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

    return NextResponse.json(work, { status: 201 });
  } catch (error) {
    console.error('创建作品失败:', error);
    return NextResponse.json(
      { error: '创建作品失败' },
      { status: 500 }
    );
  }
}