import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { toPlainJSON } from '@/lib/serialize';

// 管理员编辑作品验证模式
const AdminWorkEditSchema = z.object({
  name: z.string().min(1, '作品名称不能为空').max(100, '作品名称不能超过100字符'),
  author: z.string().min(1, '作者名不能为空').max(50, '作者名不能超过50字符'),
  prompt: z.string().max(2000, '提示词描述不能超过2000字符').optional().nullable()
});

// PUT /api/admin/works/[id]/edit - 管理员编辑作品信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    // 验证管理员权限
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 解析请求体
    const body = await request.json();
    
    // 验证输入数据
    const validationResult = AdminWorkEditSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { name, author, prompt } = validationResult.data;

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
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

    if (!existingWork) {
      return NextResponse.json({
        success: false,
        error: '作品不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 更新作品信息
    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        name,
        author,
        prompt,  // 直接使用prompt字段
        updatedAt: new Date()
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

    console.log(`管理员编辑作品: ${updatedWork.name} (ID: ${id}), 管理员: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      data: toPlainJSON(updatedWork),
      message: '作品信息更新成功'
    });

  } catch (error) {
    console.error('管理员编辑作品失败:', error);
    
    // 处理数据库约束错误
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({
        success: false,
        error: '作品名称已存在',
        code: 'CONFLICT'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// GET /api/admin/works/[id]/edit - 获取作品编辑信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    // 验证管理员权限
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 获取作品信息
    const work = await prisma.work.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        author: true,
        prompt: true,  // 获取提示词信息
        status: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
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
      return NextResponse.json({
        success: false,
        error: '作品不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: toPlainJSON(work)
    });

  } catch (error) {
    console.error('获取作品编辑信息失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}