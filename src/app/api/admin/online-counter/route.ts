import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// 在线人数配置验证模式
const OnlineCounterConfigSchema = z.object({
  currentCount: z.number().min(0).max(10000).optional(),
  baseCount: z.number().min(0).max(10000).optional(),
  maxCount: z.number().min(0).max(10000).optional(),
  growthRate: z.number().min(0).max(100).optional(),
  isEnabled: z.boolean().optional(),
  displayText: z.string().min(1).max(100).optional()
});

// GET /api/admin/online-counter - 获取在线人数配置
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 获取配置，如果不存在则创建默认配置
    let config = await prisma.onlineCounterConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      config = await prisma.onlineCounterConfig.create({
        data: {
          createdBy: session.user.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('获取在线人数配置失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// PUT /api/admin/online-counter - 更新在线人数配置
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = OnlineCounterConfigSchema.parse(body);

    // 获取当前配置
    let config = await prisma.onlineCounterConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      // 如果不存在配置，创建新的
      config = await prisma.onlineCounterConfig.create({
        data: {
          ...validatedData,
          createdBy: session.user.id,
          lastUpdated: new Date()
        }
      });
    } else {
      // 更新现有配置
      config = await prisma.onlineCounterConfig.update({
        where: { id: config.id },
        data: {
          ...validatedData,
          lastUpdated: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: '在线人数配置更新成功'
    });

  } catch (error) {
    console.error('更新在线人数配置失败:', error);
    
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

// POST /api/admin/online-counter/reset - 重置在线人数
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 获取当前配置
    let config = await prisma.onlineCounterConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      config = await prisma.onlineCounterConfig.create({
        data: {
          createdBy: session.user.id
        }
      });
    } else {
      // 重置当前人数为基础人数
      config = await prisma.onlineCounterConfig.update({
        where: { id: config.id },
        data: {
          currentCount: config.baseCount,
          lastUpdated: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
      message: '在线人数已重置'
    });

  } catch (error) {
    console.error('重置在线人数失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}