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
      success: true,
      data: works,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: '获取作品列表成功'
    }, { status: 200 });
  } catch (error) {
    console.error('获取作品列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取作品列表失败',
      code: 'FETCH_ERROR'
    }, { status: 500 });
  }
}

// POST /api/works - 创建新作品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // 获取上传配置
    const uploadConfig = await prisma.uploadConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!uploadConfig) {
      return NextResponse.json({
        success: false,
        error: '上传配置未找到',
        code: 'CONFIG_NOT_FOUND'
      }, { status: 500 });
    }

    // 检查上传功能是否开启
    if (!uploadConfig.isEnabled) {
      return NextResponse.json({
        success: false,
        error: '管理员已关闭上传功能',
        code: 'UPLOAD_DISABLED'
      }, { status: 403 });
    }

    // 检查时间窗口
    const now = new Date();
    if (uploadConfig.startTime && now < new Date(uploadConfig.startTime)) {
      return NextResponse.json({
        success: false,
        error: `上传将于 ${new Date(uploadConfig.startTime).toLocaleString()} 开始`,
        code: 'UPLOAD_NOT_STARTED'
      }, { status: 403 });
    }

    if (uploadConfig.endTime && now > new Date(uploadConfig.endTime)) {
      return NextResponse.json({
        success: false,
        error: `上传已于 ${new Date(uploadConfig.endTime).toLocaleString()} 结束`,
        code: 'UPLOAD_ENDED'
      }, { status: 403 });
    }

    // 检查用户上传数量限制
    const userUploadCount = await prisma.work.count({
      where: {
        userId: session.user.id
      }
    });

    if (userUploadCount >= uploadConfig.maxUploadsPerUser) {
      return NextResponse.json({
        success: false,
        error: `您已达到最大上传数量限制（${uploadConfig.maxUploadsPerUser}个）`,
        code: 'UPLOAD_LIMIT_EXCEEDED'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, title, author, prompt, imageUrl } = body;

    if (!name || !title || !imageUrl) {
      return NextResponse.json({
        success: false,
        error: '作品名称、标题和图片URL是必需的',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    const work = await prisma.work.create({
      data: {
        name,
        title,
        author,
        prompt,
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

    return NextResponse.json({
      success: true,
      data: work,
      message: '作品提交成功，等待管理员审核'
    }, { status: 201 });

  } catch (error) {
    console.error('创建作品失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建作品失败',
      code: 'CREATE_ERROR'
    }, { status: 500 });
  }
}