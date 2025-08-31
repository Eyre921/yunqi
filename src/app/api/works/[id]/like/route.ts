import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkStatus } from '@prisma/client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/works/[id]/like - 点赞作品
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // 检查作品是否存在且已审核通过
    const work = await prisma.work.findUnique({
      where: { id },
      select: { id: true, status: true, likeCount: true },
    });
    
    if (!work || work.status !== WorkStatus.APPROVED) {
      return NextResponse.json(
        { 
          success: false,
          error: '作品不存在或未审核通过' 
        },
        { status: 404 }
      );
    }
    
    // 增加点赞数
    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
      select: {
        likeCount: true,
      },
    });
    
    return NextResponse.json({ 
      success: true,
      data: {
        likeCount: updatedWork.likeCount
      }
    });
  } catch (error) {
    console.error('点赞失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '点赞失败' 
      },
      { status: 500 }
    );
  }
}