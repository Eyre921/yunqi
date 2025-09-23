// 根据环境变量决定启动哪个应用
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// 生产环境配置
const productionApp = {
  name: 'yunqi-platform',
  script: 'npm',
  args: 'start',
  cwd: './',
  instances: 1,
  autorestart: true,
  watch: false,
  // 针对 16G 内存优化，预留系统内存
  max_memory_restart: '12G',
  // 增加 Node.js 内存限制和性能优化
  node_args: [
    '--max-old-space-size=12288',  // 12GB 内存限制
    '--max-semi-space-size=512',   // 优化垃圾回收
    '--optimize-for-size',         // 优化内存使用
    '--gc-interval=100',           // 垃圾回收间隔
    '--expose-gc'                  // 暴露垃圾回收接口
  ],
  env: {
    NODE_ENV: 'production',
    PORT: 3000,
    // 针对 8 核 CPU 优化
    UV_THREADPOOL_SIZE: 16,        // 增加线程池大小（默认4，建议CPU核心数*2）
    NODE_OPTIONS: '--max-old-space-size=12288',
    // 启用 HTTP/2 和压缩
    FORCE_COLOR: 0,
    // 数据库连接池优化
    DATABASE_POOL_MIN: 5,
    DATABASE_POOL_MAX: 20
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000,
    UV_THREADPOOL_SIZE: 16,
    NODE_OPTIONS: '--max-old-space-size=12288',
    DATABASE_POOL_MIN: 5,
    DATABASE_POOL_MAX: 20
  },
  env_development: {
    NODE_ENV: 'development',
    PORT: 3000,
    UV_THREADPOOL_SIZE: 8,
    NODE_OPTIONS: '--max-old-space-size=4096'
  },
  // 日志配置 - 优化日志轮转
  log_file: './logs/combined.log',
  out_file: './logs/out.log',
  error_file: './logs/error.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  log_type: 'json',
  
  // 进程管理配置 - 针对高性能服务器优化
  min_uptime: '30s',             // 增加最小运行时间
  max_restarts: 15,              // 增加重启次数限制
  restart_delay: 5000,           // 重启延迟 5 秒
  
  // 性能监控配置
  pmx: true,
  
  // 集群模式配置（已禁用，但保留注释说明）
  // instances: 'max', // 使用所有CPU核心
  // exec_mode: 'cluster'
  
  // 进程优先级（-20 到 19，数值越小优先级越高）
  nice: -10,
  
  // 文件描述符限制
  max_open_files: 65536
};

// 开发环境配置
const developmentApp = {
  name: 'yunqi-platform-dev',
  script: 'npm',
  args: 'run dev',
  cwd: './',
  instances: 1,
  autorestart: true,
  watch: true,
  // 开发环境内存限制适中
  max_memory_restart: '6G',
  // 开发环境 Node.js 优化
  node_args: [
    '--max-old-space-size=6144',   // 6GB 内存限制
    '--max-semi-space-size=256',   // 适中的垃圾回收配置
    '--expose-gc'
  ],
  ignore_watch: [
    'node_modules',
    '.next',
    'logs',
    '.git',
    'public/uploads',
    '*.log',
    'coverage',
    '.nyc_output'
  ],
  env: {
    NODE_ENV: 'development',
    PORT: 3001,
    UV_THREADPOOL_SIZE: 8,         // 开发环境适中的线程池
    NODE_OPTIONS: '--max-old-space-size=6144',
    DATABASE_POOL_MIN: 2,
    DATABASE_POOL_MAX: 10
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: 3001,
    UV_THREADPOOL_SIZE: 8,
    NODE_OPTIONS: '--max-old-space-size=6144'
  },
  env_development: {
    NODE_ENV: 'development',
    PORT: 3001,
    UV_THREADPOOL_SIZE: 8,
    NODE_OPTIONS: '--max-old-space-size=6144'
  },
  // 开发环境日志 - 优化配置
  log_file: './logs/dev-combined.log',
  out_file: './logs/dev-out.log',
  error_file: './logs/dev-error.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  
  // 开发环境进程管理
  min_uptime: '10s',
  max_restarts: 10,
  restart_delay: 2000,
  
  // 开发环境监控
  pmx: false,  // 开发环境关闭监控以节省资源
  
  // 文件监听优化
  watch_options: {
    followSymlinks: false,
    usePolling: false,
    interval: 1000,
    binaryInterval: 3000
  }
};

module.exports = {
  apps: [
    // 始终包含生产环境应用
    productionApp,
    // 只在开发环境或未指定环境时包含开发应用
    ...(isDevelopment || (!isProduction && !isDevelopment) ? [developmentApp] : [])
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/var/www/yunqi-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

// PM2 使用说明（针对 8c16g 服务器优化）：
// 
// 1. 安装 PM2（如果还没安装）：
//    npm install -g pm2
//    npm install -g pm2-logrotate  # 日志轮转插件
// 
// 2. 系统级优化（建议在启动前执行）：
//    # 增加文件描述符限制
//    echo "* soft nofile 65536" >> /etc/security/limits.conf
//    echo "* hard nofile 65536" >> /etc/security/limits.conf
//    # 优化内核参数
//    echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
//    echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
//    sysctl -p
// 
// 3. 启动生产环境（推荐方式）：
//    # 方式1：只启动生产环境应用
//    pm2 start ecosystem.config.js --only yunqi-platform --env production
//    
//    # 方式2：设置环境变量后启动
//    NODE_ENV=production pm2 start ecosystem.config.js --env production
//    
//    # 设置日志轮转
//    pm2 set pm2-logrotate:max_size 100M  # 设置日志轮转
//    pm2 set pm2-logrotate:retain 30      # 保留30个日志文件
// 
// 4. 启动开发环境：
//    # 方式1：只启动开发环境应用
//    pm2 start ecosystem.config.js --only yunqi-platform-dev
//    
//    # 方式2：设置环境变量后启动
//    NODE_ENV=development pm2 start ecosystem.config.js
// 
// 5. 查看进程状态和性能：
//    pm2 status                    # 基本状态
//    pm2 logs                      # 查看日志
//    pm2 monit                     # 实时监控
//    pm2 show yunqi-platform       # 详细信息
//    pm2 describe yunqi-platform   # 进程描述
// 
// 6. 性能监控命令：
//    pm2 monit                     # 实时CPU和内存监控
//    pm2 list                      # 列表视图
//    pm2 jlist                     # JSON格式输出
//    pm2 prettylist               # 美化列表
// 
// 7. 重启和重载：
//    pm2 restart yunqi-platform    # 重启（会有短暂停机）
//    pm2 reload yunqi-platform     # 平滑重载（推荐）
//    pm2 gracefulReload all        # 优雅重载所有进程
// 
// 8. 停止和删除：
//    pm2 stop yunqi-platform       # 停止应用
//    pm2 delete yunqi-platform     # 删除应用
//    pm2 kill                      # 杀死PM2守护进程
// 
// 9. 保存PM2配置（开机自启）：
//    pm2 save                      # 保存当前进程列表
//    pm2 startup                   # 生成启动脚本
//    pm2 unstartup                 # 移除启动脚本
// 
// 10. 查看实时日志：
//     pm2 logs yunqi-platform --lines 100    # 查看最近100行
//     pm2 logs yunqi-platform --follow       # 实时跟踪
//     pm2 logs yunqi-platform --timestamp    # 带时间戳
//     pm2 flush                              # 清空所有日志
// 
// 11. 内存和性能优化监控：
//     pm2 monit                              # 图形化监控
//     pm2 show yunqi-platform                # 详细进程信息
//     watch -n 1 'pm2 jlist | jq ".[0].monit"'  # 每秒刷新监控数据
// 
// 12. 故障排查：
//     pm2 logs yunqi-platform --err          # 只看错误日志
//     pm2 logs yunqi-platform --out          # 只看输出日志
//     pm2 reset yunqi-platform               # 重置重启计数器
//     pm2 ping                               # 检查PM2守护进程状态
// 
// 13. 高级配置建议：
//     # 对于 8c16g 服务器，建议的系统监控
//     # CPU 使用率应保持在 70% 以下
//     # 内存使用率应保持在 80% 以下
//     # 如果单进程无法充分利用CPU，考虑运行多个不同端口的实例
// 
// 14. 备用端口配置（如需要更高并发）：
//     # 可以复制 yunqi-platform 配置，修改端口为 3002, 3003 等
//     # 然后使用 Nginx 做负载均衡