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
  maxUploadsPerUser: z.number().int().min(1).max(1000), // 增加到1000
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
        createdBy: session.user.id
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
      message: '上传配置更新成功'
    });
  } catch (error) {
    console.error('更新上传配置失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        details: error.issues  // 修复：应该是 issues 而不是 issue
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '更新上传配置失败'
    }, { status: 500 });
  }
}