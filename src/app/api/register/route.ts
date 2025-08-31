import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 用户注册验证模式
const RegisterSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位').max(100, '密码不能超过100个字符'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword']
});

// POST /api/register - 用户注册
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.parse(body);

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '该邮箱已被注册',
        code: 'EMAIL_EXISTS'
      }, { status: 409 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'USER' // 默认为普通用户
      },
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
      data: user,
      message: '注册成功，请登录'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('用户注册失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: error.issues      }, { status: 400 });
    }
    
    // 处理 Prisma 错误
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: '该邮箱已被注册',
          code: 'EMAIL_EXISTS'
        }, { status: 409 });
      }
    }
    
    // 处理其他错误
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    return NextResponse.json({
      success: false,
      error: '注册失败，请稍后重试',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}