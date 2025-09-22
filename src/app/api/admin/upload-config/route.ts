import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 上传配置验证模式
const UploadConfigSchema = z.object({
  isEnabled: z.boolean(),
  startTime: z.iso.datetime().optional().nullable(),
  endTime: z.iso.datetime().optional().nullable(),
  maxUploadsPerUser: z.number().int().min(1).max(100000), // 增加到1000
  maxFileSize: z.number().int().min(1024).max(104857600), // 1KB到100MB
  allowedFormats: z.array(z.string()).min(1),
  announcement: z.string().optional().nullable()
});

// 获取上传配置
export async function GET() {
  try {
    const config = await prisma.uploadConfig.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // 如果没有配置，返回默认配置
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          isEnabled: false,
          startTime: null,
          endTime: null,
          maxUploadsPerUser: 1,
          maxFileSize: 10485760,
          allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
          announcement: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取上传配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取上传配置失败'
    }, { status: 500 });
  }
}

// 更新上传配置（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: '权限不足'
      }, { status: 403 });
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在，请重新登录'
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UploadConfigSchema.parse(body);

    // 验证时间逻辑
    if (validatedData.startTime && validatedData.endTime) {
      const start = new Date(validatedData.startTime);
      const end = new Date(validatedData.endTime);
      if (start >= end) {
        return NextResponse.json({
          success: false,
          error: '开始时间必须早于结束时间'
        }, { status: 400 });
      }
    }

    // 创建新的配置记录
    const config = await prisma.uploadConfig.create({
      data: {
        ...validatedData,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        createdBy: user.id  // 使用验证过的用户ID
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: config,
      message: '上传配置创建成功'
    });

  } catch (error: unknown) {
    console.error('创建上传配置失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        details: error.issues
      }, { status: 400 });
    }
    
    // 处理 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2003') {
        return NextResponse.json({
          success: false,
          error: '外键约束违反，请检查用户数据',
          code: 'FOREIGN_KEY_CONSTRAINT'
        }, { status: 400 });
      }
    }
    
    // 处理其他错误
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '创建上传配置失败',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}