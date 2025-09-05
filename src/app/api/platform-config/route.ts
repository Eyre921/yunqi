import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 输入验证模式
const PlatformConfigSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题长度不能超过100个字符')
});

// GET - 获取平台配置
export async function GET(): Promise<NextResponse> {
  try {
    // 获取或创建默认配置
    let config = await prisma.platformConfig.findFirst();
    
    if (!config) {
      // 如果没有配置，创建默认配置
      config = await prisma.platformConfig.create({
        data: {
          title: 'Qoder和通义灵码 AI Coding 作品秀'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        title: config.title,
        updatedAt: config.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('获取平台配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取平台配置失败',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// POST - 更新平台配置
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    
    // 验证输入数据
    const validatedData = PlatformConfigSchema.parse(body);

    // 获取或创建配置
    let config = await prisma.platformConfig.findFirst();
    
    if (config) {
      // 更新现有配置
      config = await prisma.platformConfig.update({
        where: { id: config.id },
        data: {
          title: validatedData.title,
          updatedAt: new Date()
        }
      });
    } else {
      // 创建新配置
      config = await prisma.platformConfig.create({
        data: {
          title: validatedData.title
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        title: config.title,
        updatedAt: config.updatedAt.toISOString()
      },
      message: '平台配置更新成功'
    });
  } catch (error) {
    console.error('更新平台配置失败:', error);
    
    // 输入验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: error.issues
      }, { status: 400 });
    }

    // 通用服务器错误
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}