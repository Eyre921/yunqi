import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performanceMonitor } from '@/lib/performance-monitor';

// 获取性能指标
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: '未授权访问' 
        },
        { status: 401 }
      );
    }
    
    // 检查管理员权限
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: '权限不足' 
        },
        { status: 403 }
      );
    }

      const url = new URL(request.url);
      const minutes = parseInt(url.searchParams.get('minutes') || '5');
      const includeHistory = url.searchParams.get('history') === 'true';

      // 获取当前指标
      const currentMetrics = performanceMonitor.getCurrentMetrics();
      
      // 获取统计数据
      const stats = performanceMonitor.getStats(minutes);
      
      // 检查告警
      const alerts = performanceMonitor.checkAlerts();

      const response: any = {
        success: true,
        data: {
          current: currentMetrics,
          stats,
          alerts,
          serverInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
          }
        }
      };

      // 如果需要历史数据
      if (includeHistory) {
        response.data.history = performanceMonitor.getMetrics(100); // 最近100条记录
      }

      return NextResponse.json(response);
    } catch (error) {
      console.error('获取性能指标失败:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: '获取性能指标失败' 
        },
        { status: 500 }
      );
    }
  }

// 清理历史数据
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: '未授权访问' 
        },
        { status: 401 }
      );
    }
    
    // 检查管理员权限
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: '权限不足' 
        },
        { status: 403 }
      );
    }

      // 重置监控数据
      const newMonitor = performanceMonitor;
      (newMonitor as any).metrics = [];

      return NextResponse.json({
        success: true,
        message: '性能监控数据已清理'
      });
    } catch (error) {
      console.error('清理性能数据失败:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: '清理性能数据失败' 
        },
        { status: 500 }
      );
    }
  }