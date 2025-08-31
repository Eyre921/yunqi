import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

// 用户更新验证模式
const UserUpdateSchema = z.object({
  name: z.string().min(1, '姓名不能为空').optional(),
  email: z.string().email('无效的邮箱格式').optional(),
  role: z.enum(['USER', 'ADMIN']).optional()
});

// 获取单个用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        works: {
          select: {
            id: true,
            name: true,
            title: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// 更新用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UserUpdateSchema.parse(body);

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 如果更新邮箱，检查邮箱是否已被使用
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return NextResponse.json({
          success: false,
          error: '该邮箱已被使用',
          code: 'CONFLICT'
        }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    
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

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 不能删除自己
    if (session.user.id === id) {
      return NextResponse.json({
        success: false,
        error: '不能删除自己的账户',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        works: true
      }
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 如果用户有作品，先删除作品
    if (existingUser.works.length > 0) {
      await prisma.work.deleteMany({
        where: { userId: id }
      });
    }

    // 删除用户
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}