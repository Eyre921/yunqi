import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkStatus } from '@prisma/client';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/works/[id]/view - 增加浏览量
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // 检查作品是否存在且已审核通过
    const work = await prisma.work.findUnique({
      where: { id },
      select: { id: true, status: true },
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
    
    // 增加浏览量
    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        viewCount: true,
      },
    });
    
    return NextResponse.json({ 
      success: true,
      data: {
        viewCount: updatedWork.viewCount
      }
    });
  } catch (error) {
    console.error('增加浏览量失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '增加浏览量失败' 
      },
      { status: 500 }
    );
  }
}