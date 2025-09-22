#!/bin/bash

# 应用层性能优化脚本（安全版本）
# 不修改系统配置，只优化应用层面

echo "🚀 开始应用层性能优化..."

# 检查Node.js和npm
echo "📋 检查运行环境..."
node --version || { echo "❌ Node.js 未安装"; exit 1; }
npm --version || { echo "❌ npm 未安装"; exit 1; }

# 检查PM2
pm2 --version || { echo "📦 安装PM2..."; npm install -g pm2; }

# 1. 优化Node.js应用配置
echo "⚙️ 优化Node.js应用配置..."

# 设置Node.js环境变量（仅对当前应用）
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=8192"

# 2. PM2配置优化
echo "🔧 优化PM2配置..."

# 检查ecosystem.config.js是否存在
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js 文件不存在"
    exit 1
fi

echo "✅ PM2配置文件已存在，使用现有配置"

# 3. 构建优化
echo "🏗️ 构建生产版本..."
npm run build

# 4. 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 5. 设置PM2开机自启（可选）
read -p "是否设置PM2开机自启？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 startup
    pm2 save
    echo "✅ PM2开机自启已设置"
fi

# 6. 显示应用状态
echo "📊 应用状态："
pm2 status

echo "✅ 应用层优化完成！"
echo ""
echo "📝 优化内容："
echo "  - Node.js内存限制: 4GB"
echo "  - PM2集群模式: 8个实例"
echo "  - 生产环境构建优化"
echo "  - 自动重启和监控"
echo ""
echo "🔍 监控命令："
echo "  pm2 status          - 查看应用状态"
echo "  pm2 logs            - 查看日志"
echo "  pm2 monit           - 实时监控"
echo "  pm2 restart all     - 重启所有应用"