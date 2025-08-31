import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, WorkStatus } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 作品编辑验证模式
const WorkEditSchema = z.object({
  name: z.string().min(1, '作品名称不能为空').max(100, '作品名称不能超过100字符').optional(),
  title: z.string().min(1, '作品简述不能为空').max(200, '作品简述不能超过200字符').optional(),
  description: z.string().max(1000, '作品描述不能超过1000字符').optional(),
  author: z.string().min(1, '作者名不能为空').max(50, '作者名不能超过50字符').optional(),
  prompt: z.string().max(2000, 'AI提示词不能超过2000字符').optional(),
  // 允许绝对URL或以 /uploads/ 或 /images/ 开头的相对路径
  imageUrl: z
    .string()
    .min(1, '图片URL不能为空')
    .refine((val: string) => {
      try {
        // 绝对URL通过
        new URL(val);
        return true;
      } catch {
        // 允许 /uploads/... 或 /images/... 相对路径
        return val.startsWith('/uploads/') || val.startsWith('/images/');
      }
    }, '图片URL格式不正确')
    .optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  featured: z.boolean().optional()
});

// GET /api/works/[id] - 获取单个作品
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const work = await prisma.work.findUnique({
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

    if (!work) {
      return NextResponse.json(
        { 
          success: false,
          error: '作品不存在' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: work
    });
  } catch (error) {
    console.error('获取作品失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取作品失败' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/works/[id] - 更新作品
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: '请先登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // 验证输入数据
    const validationResult = WorkEditSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { name, title, description, author, prompt, imageUrl, status, featured } = validationResult.data;

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
      where: { id }
    });

    if (!existingWork) {
      return NextResponse.json({
        success: false,
        error: '作品不存在',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 检查权限：只有作品创建者或管理员可以更新
    if (existingWork.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json({
        success: false,
        error: '权限不足，只能编辑自己的作品',
        code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // 只有管理员可以直接设置状态和精选状态
    if (session.user.role !== Role.ADMIN) {
      if (status !== undefined) {
        return NextResponse.json({
          success: false,
          error: '只有管理员可以设置审核状态',
          code: 'FORBIDDEN'
        }, { status: 403 });
      }
      
      if (featured !== undefined) {
        return NextResponse.json({
          success: false,
          error: '只有管理员可以设置精选状态',
          code: 'FORBIDDEN'
        }, { status: 403 });
      }
    }

    // 检查是否有实际的内容更改
    const hasContentChanges = (
      (name !== undefined && name !== existingWork.name) ||
      (title !== undefined && title !== existingWork.title) ||
      (description !== undefined && description !== existingWork.description) ||
      (author !== undefined && author !== existingWork.author) ||
      (prompt !== undefined && prompt !== existingWork.prompt) ||
      (imageUrl !== undefined && imageUrl !== existingWork.imageUrl)
    );

    // 准备更新数据
    const updateData: any = {};
    
    // 更新基本字段
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (author !== undefined) updateData.author = author;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // 管理员可以直接设置状态和精选
    if (session.user.role === Role.ADMIN) {
      if (status !== undefined) updateData.status = status;
      if (featured !== undefined) updateData.featured = featured;
    } else {
      // 普通用户编辑内容后需要重新审核
      if (hasContentChanges) {
        console.log(`作品 ${id} 检测到内容变化，重新提交审核`);
        console.log('变化详情:', {
          name: name !== undefined && name !== existingWork.name,
          title: title !== undefined && title !== existingWork.title,
          description: description !== undefined && description !== existingWork.description,
          author: author !== undefined && author !== existingWork.author,
          prompt: prompt !== undefined && prompt !== existingWork.prompt,
          imageUrl: imageUrl !== undefined && imageUrl !== existingWork.imageUrl
        });
        
        updateData.status = WorkStatus.PENDING;
        updateData.approvedAt = null;
        updateData.rejectedAt = null;
        updateData.rejectReason = null;
        // 保持精选状态不变，等待管理员重新审核
      } else {
        console.log(`作品 ${id} 未检测到内容变化`);
      }
      
      console.log('准备更新的数据:', updateData);
    }

    // 如果没有任何更改，直接返回当前作品
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        data: existingWork,
        message: '没有检测到更改'
      }, { status: 200 });
    }

    const updatedWork = await prisma.work.update({
      where: { id },
      data: updateData,
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

    console.log(`作品 ${id} 更新完成，新状态:`, updatedWork.status);
    // 根据更新类型返回不同的消息
    let message = '作品更新成功';
    if (session.user.role !== Role.ADMIN && hasContentChanges) {
      message = '作品更新成功，已重新提交审核';
    }

    return NextResponse.json({
      success: true,
      data: updatedWork,
      message
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('更新作品失败:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据验证失败',
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

// DELETE /api/works/[id] - 删除作品
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 检查作品是否存在
    const existingWork = await prisma.work.findUnique({
      where: { id }
    });

    if (!existingWork) {
      return NextResponse.json(
        { error: '作品不存在' },
        { status: 404 }
      );
    }

    // 检查权限：只有作品创建者或管理员可以删除
    if (existingWork.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    await prisma.work.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: '作品删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除作品失败:', error);
    return NextResponse.json(
      { error: '删除作品失败' },
      { status: 500 }
    );
  }
}