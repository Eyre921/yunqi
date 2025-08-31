import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 健康检查API
export async function GET(request: NextRequest) {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: 'API服务正常',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    return NextResponse.json({
      success: false,
      message: 'API服务异常',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}