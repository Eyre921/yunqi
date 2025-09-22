# 性能优化指南

本文档提供了云栖平台的性能优化策略和实施方案。

## 目录

1. [应用层优化](#应用层优化)
2. [前端优化](#前端优化)
3. [数据库查询优化](#数据库查询优化)
4. [监控和调优](#监控和调优)

## 应用层优化

### 1. Node.js 应用优化

运行应用层优化脚本：

```bash
chmod +x scripts/optimize-server.sh
./scripts/optimize-server.sh
```

### 2. PM2 集群模式

使用 PM2 集群模式提升性能：

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'yunqi-platform',
    script: 'server.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=8192'
    }
  }]
}
```

### 3. 内存优化

```bash
# 设置 Node.js 内存限制（16GB服务器推荐8GB）
export NODE_OPTIONS="--max-old-space-size=8192"

# 启动应用
npm run build
pm2 start ecosystem.config.js --env production
```

## 前端优化

### 1. 静态资源优化

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
}
```

### 2. 缓存策略

```javascript
// 静态资源缓存
const cacheConfig = {
  'Cache-Control': 'public, max-age=31536000, immutable'
}

// API缓存
const apiCache = {
  'Cache-Control': 'public, max-age=300, s-maxage=600'
}
```

## 数据库查询优化

### 1. Prisma 查询优化

避免 N+1 查询问题：

```typescript
// ❌ 错误：N+1 查询
const users = await prisma.user.findMany();
for (const user of users) {
  const works = await prisma.work.findMany({ 
    where: { userId: user.id } 
  });
}

// ✅ 正确：使用 include
const users = await prisma.user.findMany({
  include: {
    works: true
  }
});
```

### 2. 索引优化

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_work_status ON "Work"(status);
CREATE INDEX idx_work_user_id ON "Work"("userId");
```

### 3. 连接池配置

```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});
```

## 🚀 部署和使用

### 1. 应用部署

```bash
# 安装依赖
npm install

# 构建应用
npm run build

# 启动应用层优化
./scripts/optimize-server.sh
```

## 监控和调优

### 1. PM2 应用监控

```bash
# PM2 实时监控
pm2 monit

# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs

# 重启应用
pm2 restart all
```

### 2. 性能测试

```bash
# 基础性能测试
node scripts/performance-test.js test

# 压力测试
node scripts/performance-test.js stress

# 自定义测试
TEST_URL=http://localhost:3000 CONCURRENCY=50 TOTAL_REQUESTS=500 node scripts/performance-test.js test
```

### 3. 应用监控API

```bash
# 获取性能指标
curl http://localhost:3000/api/admin/performance

# 获取历史数据
curl "http://localhost:3000/api/admin/performance?hours=24"
```

### 4. 性能指标

监控以下关键指标：

- **响应时间**: API 平均响应时间
- **内存使用**: Node.js 进程内存占用
- **CPU 使用率**: 应用 CPU 占用
- **并发连接数**: 同时处理的请求数
- **错误率**: API 错误响应比例

## 🔧 配置详解

### PM2集群配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'yunqi-platform',
    script: 'server.js',
    instances: 4,  // 16GB内存服务器推荐4个实例
    exec_mode: 'cluster',
    max_memory_restart: '3G',  // 每个实例3GB内存限制
    node_args: '--max-old-space-size=3072',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 数据库连接优化

```typescript
// src/lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const start = Date.now()
        const result = await query(args)
        const end = Date.now()
        
        // 记录慢查询 (>1秒)
        if (end - start > 1000) {
          console.warn(`慢查询检测: ${model}.${operation} 耗时 ${end - start}ms`)
        }
        
        return result
      },
    },
  },
})
```

### 性能监控配置

```typescript
// src/lib/performance-monitor.ts
const monitor = new PerformanceMonitor({
  maxHistorySize: 1000,
  alertThresholds: {
    cpu: 80,      // CPU使用率告警阈值
    memory: 85,   // 内存使用率告警阈值
    responseTime: 1000  // 响应时间告警阈值(ms)
  }
})
```

## 📈 性能基准

### 预期性能指标

| 指标 | 目标值 | 优化前 | 优化后 |
|------|--------|--------|--------|
| 平均响应时间 | < 200ms | 500-800ms | 100-200ms |
| 并发连接数 | 200+ | 50-100 | 200-500 |
| CPU利用率 | 60-80% | 20-40% | 60-80% |
| 内存利用率 | 70-85% | 40-60% | 70-85% |
| QPS | 100+ | 20-50 | 100-300 |
| 错误率 | < 0.1% | 1-2% | < 0.1% |

### 压力测试结果

```bash
# 轻负载 (10并发, 100请求)
✅ 响应时间: 优秀 (< 100ms)
✅ 吞吐量: 优秀 (> 100 QPS)
✅ 稳定性: 优秀 (> 99%)

# 中等负载 (50并发, 500请求)
⚠️  响应时间: 良好 (100-200ms)
✅ 吞吐量: 优秀 (> 100 QPS)
✅ 稳定性: 优秀 (> 99%)

# 高负载 (100并发, 1000请求)
⚠️  响应时间: 良好 (200-300ms)
⚠️  吞吐量: 良好 (80-100 QPS)
✅ 稳定性: 优秀 (> 99%)
```

## 🛠️ 故障排除

### 常见问题

1. **内存使用过高**
   ```bash
   # 检查内存使用
   pm2 status
   
   # 重启高内存进程
   pm2 restart all
   
   # 查看内存详情
   pm2 show yunqi-platform
   ```

2. **应用响应缓慢**
   ```bash
   # 查看应用日志
   pm2 logs
   
   # 查看实时监控
   pm2 monit
   
   # 重启应用
   pm2 restart yunqi-platform
   ```

3. **数据库查询慢**
   ```bash
   # 查看应用日志中的慢查询警告
   pm2 logs | grep "慢查询检测"
   
   # 检查数据库连接
   curl http://localhost:3000/api/admin/performance
   ```

4. **构建失败**
   ```bash
   # 清理缓存
   npm run clean
   
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   
   # 重新构建
   npm run build
   ```

### 性能调优建议

1. **定期重启应用**：设置定时任务每天重启应用
2. **监控内存使用**：当内存使用超过 2GB 时自动重启
3. **日志轮转**：定期清理应用日志文件
4. **数据库查询优化**：监控慢查询并优化

### 应用层优化建议

1. **缓存策略**
   - 实现 API 响应缓存
   - 缓存热点数据
   - 使用浏览器缓存

2. **代码优化**
   - 优化数据库查询逻辑
   - 减少不必要的计算
   - 使用异步处理

3. **资源优化**
   - 压缩静态资源
   - 优化图片格式
   - 启用 Gzip 压缩

## 📝 维护计划

### 日常维护

- **每日**: 检查 PM2 应用状态
- **每周**: 分析性能监控数据
- **每月**: 清理日志文件和缓存

### 定期任务

```bash
# 每日重启应用（可选）
0 3 * * * pm2 restart yunqi-platform

# 每周清理日志
0 2 * * 0 pm2 flush

# 每月性能报告
0 9 1 * * curl http://localhost:3000/api/admin/performance > /tmp/monthly-report.json
```

### 监控告警

应用层监控告警阈值：

- 内存使用率 > 85% 持续5分钟
- 平均响应时间 > 1秒 持续2分钟
- 错误率 > 1% 持续1分钟
- PM2 进程重启次数 > 5次/小时

## 🔗 相关文档

- [Next.js 性能优化](https://nextjs.org/docs/advanced-features/measuring-performance)
- [PM2 集群模式](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [Prisma 性能优化](https://www.prisma.io/docs/guides/performance-and-optimization)

## 📞 技术支持

如遇到性能问题，请提供以下信息：

1. 系统监控报告 (`/usr/local/bin/server-monitor.sh`)
2. PM2 进程状态 (`pm2 status`)
3. 性能测试结果 (`node scripts/performance-test.js test`)
4. 错误日志 (`pm2 logs --lines 100`)

---

**最后更新**: 2024年1月
**版本**: 1.0.0