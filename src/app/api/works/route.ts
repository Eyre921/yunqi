import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkStatus } from '@prisma/client';
import { z } from 'zod';
import { toPlainJSON } from '@/lib/serialize';

// GET /api/works - 获取作品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as WorkStatus | null;
    const sortBy = searchParams.get('sortBy') || 'default'; // latest, popular, default
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = status ? { status } : { status: WorkStatus.APPROVED };

    // 根据 sortBy 参数确定排序规则
    let orderBy: any;
    switch (sortBy) {
      case 'latest':
        // 最新作品：按审核通过时间降序
        orderBy = {
          approvedAt: 'desc'
        };
        break;
      case 'popular':
        // 热门作品：按点赞数降序，不考虑时间
        orderBy = {
          likeCount: 'desc'
        };
        break;
      default:
        // 默认排序：精选优先，然后点赞数，最后创建时间
        orderBy = [
          {
            featured: 'desc' // 1. 精选作品优先
          },
          {
            likeCount: 'desc' // 2. 点赞数高的在前
          },
          {
            createdAt: 'desc' // 3. 修改为降序，新作品在前
          }
        ];
        break;
    }

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
        orderBy,
        skip,
        take: limit
      }),
      prisma.work.count({ where })
    ]);

    const safeData = toPlainJSON({
      works,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

    return NextResponse.json({
      success: true,
      data: safeData,
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

// POST /api/works - 创建新作品（无需登录）
export async function POST(request: NextRequest) {
  try {
    // 移除登录验证，允许游客上传
    const session = await getServerSession(authOptions);

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

    // 移除用户上传数量限制检查（因为无需登录）

    const body = await request.json();
    const { name, author, prompt, imageUrl } = body;

    if (!name || !imageUrl) {
      return NextResponse.json({
        success: false,
        error: '作品名称和图片URL是必需的',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    const work = await prisma.work.create({
      data: {
        title: name, // 保留数据库字段，但不在前端使用
        name,
        author: author || null,
        prompt: prompt || null,
        imageUrl,
        status: WorkStatus.PENDING,
        userId: session?.user?.id || null
      },
      include: {
        user: session?.user?.id ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined
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