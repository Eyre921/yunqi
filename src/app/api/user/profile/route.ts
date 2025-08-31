import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// 用户信息更新验证模式
const ProfileUpdateSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, '新密码至少6位').max(100, '新密码不能超过100个字符').optional(),
  confirmNewPassword: z.string().optional()
}).refine((data) => {
  // 如果要修改密码，必须提供当前密码和新密码
  if (data.newPassword || data.confirmNewPassword) {
    return data.currentPassword && data.newPassword && data.confirmNewPassword;
  }
  return true;
}, {
  message: '修改密码时必须提供当前密码和新密码',
  path: ['currentPassword']
}).refine((data) => {
  // 新密码和确认密码必须一致
  if (data.newPassword && data.confirmNewPassword) {
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: '两次输入的新密码不一致',
  path: ['confirmNewPassword']
});

// GET /api/user/profile - 获取用户信息
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            works: true
          }
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
      data: user,
      message: '获取用户信息成功'
    });

  } catch (error: unknown) {
    console.error('获取用户信息失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '获取用户信息失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

// PUT /api/user/profile - 更新用户信息
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ProfileUpdateSchema.parse(body);

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 如果要更新邮箱，检查邮箱是否已被使用
    if (validatedData.email && validatedData.email !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return NextResponse.json({
          success: false,
          error: '该邮箱已被使用',
          code: 'EMAIL_EXISTS'
        }, { status: 409 });
      }
    }

    // 准备更新数据
    const updateData: any = {};
    
    if (validatedData.name) {
      updateData.name = validatedData.name;
    }
    
    if (validatedData.email) {
      updateData.email = validatedData.email;
    }

    // 如果要修改密码
    if (validatedData.newPassword && validatedData.currentPassword) {
      // 验证当前密码
      if (!currentUser.password) {
        return NextResponse.json({
          success: false,
          error: '当前用户未设置密码',
          code: 'NO_PASSWORD'
        }, { status: 400 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        currentUser.password
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json({
          success: false,
          error: '当前密码不正确',
          code: 'INVALID_PASSWORD'
        }, { status: 400 });
      }

      // 加密新密码
      updateData.password = await bcrypt.hash(validatedData.newPassword, 12);
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            works: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '用户信息更新成功'
    });

  } catch (error: unknown) {
    console.error('更新用户信息失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: error.issues
      }, { status: 400 });
    }
    
    // 处理 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: '该邮箱已被使用',
          code: 'EMAIL_EXISTS'
        }, { status: 409 });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '更新用户信息失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}