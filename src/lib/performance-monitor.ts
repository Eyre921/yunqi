import os from 'os';
import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usagePercent: number;
    heapUsed: number;
    heapTotal: number;
  };
  uptime: number;
  responseTime?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // 保留最近1000条记录

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 获取当前系统性能指标
  public getCurrentMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      timestamp: Date.now(),
      cpu: {
        usage: this.getCpuUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        used: usedMem,
        free: freeMem,
        total: totalMem,
        usagePercent: (usedMem / totalMem) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      },
      uptime: process.uptime(),
    };
  }

  // 记录性能指标
  public recordMetrics(responseTime?: number): void {
    const metrics = this.getCurrentMetrics();
    if (responseTime) {
      metrics.responseTime = responseTime;
    }

    this.metrics.push(metrics);

    // 保持数组大小在限制内
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // 获取历史指标
  public getMetrics(limit?: number): PerformanceMetrics[] {
    if (limit) {
      return this.metrics.slice(-limit);
    }
    return [...this.metrics];
  }

  // 获取性能统计
  public getStats(minutes: number = 5): {
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgResponseTime: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
    maxResponseTime: number;
  } {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgResponseTime: 0,
        maxMemoryUsage: 0,
        maxCpuUsage: 0,
        maxResponseTime: 0,
      };
    }

    const responseTimes = recentMetrics
      .filter(m => m.responseTime !== undefined)
      .map(m => m.responseTime!);

    return {
      avgCpuUsage: recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length,
      avgMemoryUsage: recentMetrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / recentMetrics.length,
      avgResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
        : 0,
      maxMemoryUsage: Math.max(...recentMetrics.map(m => m.memory.usagePercent)),
      maxCpuUsage: Math.max(...recentMetrics.map(m => m.cpu.usage)),
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    };
  }

  // 检查是否需要告警
  public checkAlerts(): {
    type: 'warning' | 'critical' | 'info';
    message: string;
  }[] {
    const current = this.getCurrentMetrics();
    const alerts: { type: 'warning' | 'critical' | 'info'; message: string }[] = [];

    // CPU使用率告警
    if (current.cpu.usage > 90) {
      alerts.push({
        type: 'critical',
        message: `CPU使用率过高: ${current.cpu.usage.toFixed(1)}%`
      });
    } else if (current.cpu.usage > 70) {
      alerts.push({
        type: 'warning',
        message: `CPU使用率较高: ${current.cpu.usage.toFixed(1)}%`
      });
    }

    // 内存使用率告警
    if (current.memory.usagePercent > 90) {
      alerts.push({
        type: 'critical',
        message: `内存使用率过高: ${current.memory.usagePercent.toFixed(1)}%`
      });
    } else if (current.memory.usagePercent > 80) {
      alerts.push({
        type: 'warning',
        message: `内存使用率较高: ${current.memory.usagePercent.toFixed(1)}%`
      });
    }

    // 负载平均值告警
    const loadAvg1min = current.cpu.loadAverage[0];
    const cores = current.cpu.cores;
    if (loadAvg1min > cores * 2) {
      alerts.push({
        type: 'critical',
        message: `系统负载过高: ${loadAvg1min.toFixed(2)} (${cores}核)`
      });
    } else if (loadAvg1min > cores * 1.5) {
      alerts.push({
        type: 'warning',
        message: `系统负载较高: ${loadAvg1min.toFixed(2)} (${cores}核)`
      });
    }

    return alerts;
  }

  // 获取CPU使用率（简化版本）
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  // 启动定期监控
  public startMonitoring(intervalMs: number = 30000): void {
    setInterval(() => {
      this.recordMetrics();
    }, intervalMs);
  }
}

// 中间件：记录API响应时间
export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = performance.now();
    
    res.on('finish', () => {
      const duration = performance.now() - start;
      const monitor = PerformanceMonitor.getInstance();
      monitor.recordMetrics(duration);
    });
    
    next();
  };
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();