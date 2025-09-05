import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET /api/online-counter - 获取当前在线人数
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 获取最新的在线人数配置
    let config = await prisma.onlineCounterConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // 如果没有配置，创建默认配置
    if (!config) {
      config = await prisma.onlineCounterConfig.create({
        data: {
          currentCount: 1075,
          baseCount: 1000,
          maxCount: 2000,
          growthRate: 0.5,
          isEnabled: true,
          displayText: '人正在云栖大会创作',
          lastUpdated: new Date()
        }
      });
    }

    // 如果功能未启用，返回固定值
    if (!config.isEnabled) {
      return NextResponse.json({
        success: true,
        data: {
          count: config.currentCount,
          displayText: config.displayText,
          isEnabled: false
        }
      });
    }

    // 计算基于10秒间隔的随机增长
    const now = new Date();
    const lastUpdated = new Date(config.lastUpdated);
    const secondsPassed = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    
    let newCount = config.currentCount;
    
    // 每10秒检查一次是否需要增长
    if (secondsPassed >= 10) {
      // 计算经过了多少个10秒间隔
      const intervals = Math.floor(secondsPassed / 10);
      
      // 为每个间隔随机增加人数（0到growthRate之间）
      for (let i = 0; i < intervals; i++) {
        const randomIncrease = Math.floor(Math.random() * (config.growthRate + 1));
        newCount += randomIncrease;
      }
      
      // 确保不超过最大值和最小值
      newCount = Math.max(config.baseCount, Math.min(config.maxCount, newCount));
      
      // 更新数据库
      await prisma.onlineCounterConfig.update({
        where: { id: config.id },
        data: {
          currentCount: newCount,
          lastUpdated: now
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        count: newCount,
        displayText: config.displayText,
        isEnabled: config.isEnabled,
        lastUpdated: now.toISOString()
      }
    });

  } catch (error) {
    console.error('获取在线人数失败:', error);
    
    // 数据库错误
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({
        success: false,
        error: '数据库操作失败',
        code: 'DATABASE_ERROR'
      }, { status: 500 });
    }
    
    // 发生错误时返回默认值
    return NextResponse.json({
      success: true,
      data: {
        count: 1075,
        displayText: '人正在云栖大会创作',
        isEnabled: true
      }
    });
  }
}

// 输入验证模式
const IncrementSchema = z.object({
  increment: z.number().int().min(1).max(100).optional().default(1)
});

// POST /api/online-counter/increment - 手动增加在线人数（可选功能）
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // 验证输入数据
    const validatedData = IncrementSchema.parse(body);
    const { increment } = validatedData;

    // 获取当前配置
    let config = await prisma.onlineCounterConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      config = await prisma.onlineCounterConfig.create({
        data: {
          currentCount: 1075,
          baseCount: 1000,
          maxCount: 2000,
          growthRate: 0.5,
          isEnabled: true,
          displayText: '人正在云栖大会创作',
          lastUpdated: new Date()
        }
      });
    }

    // 增加人数，但不超过最大值
    const newCount = Math.min(config.maxCount, config.currentCount + increment);
    
    const updatedConfig = await prisma.onlineCounterConfig.update({
      where: { id: config.id },
      data: {
        currentCount: newCount,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        count: updatedConfig.currentCount,
        displayText: updatedConfig.displayText,
        isEnabled: updatedConfig.isEnabled
      },
      message: `在线人数已增加 ${increment}`
    });

  } catch (error) {
    console.error('增加在线人数失败:', error);
    
    // 输入验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '输入数据无效',
        code: 'VALIDATION_ERROR',
        details: error.issues
      }, { status: 400 });
    }
    
    // 数据库错误
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({
        success: false,
        error: '数据库操作失败',
        code: 'DATABASE_ERROR'
      }, { status: 500 });
    }
    
    // 通用服务器错误
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}