module.exports = {
  apps: [
    {
      name: 'yunqi-platform',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 4, // 16GB内存服务器使用4个实例，每个实例3GB，总计12GB，保留4GB给系统
      exec_mode: 'cluster', // 启用集群模式
      autorestart: true,
      watch: false,
      max_memory_restart: '3G', // 16GB内存，每个实例最大3GB
      max_restarts: 10,
      min_uptime: '10s',
      
      // 性能优化配置
      node_args: '--max-old-space-size=3072', // 每个Node.js进程最大3GB内存
      
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 优化Node.js性能
        UV_THREADPOOL_SIZE: 16, // 增加线程池大小（默认4）
        NODE_OPTIONS: '--max-old-space-size=3072'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 16,
        NODE_OPTIONS: '--max-old-space-size=3072'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      
      // 性能监控
      pmx: true,
      monitoring: true,
      
      // 负载均衡配置
      listen_timeout: 8000,
      kill_timeout: 5000,
      
      // 健康检查
      health_check_grace_period: 3000,
    },
    {
      name: 'yunqi-platform-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: [
        'node_modules',
        '.next',
        'logs',
        '.git',
        'public/uploads'
      ],
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      // 开发环境日志
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log'
    }
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

// PM2 使用说明：
// 
// 1. 安装 PM2（如果还没安装）：
//    npm install -g pm2
// 
// 2. 启动生产环境：
//    pm2 start ecosystem.config.js --env production
// 
// 3. 启动开发环境：
//    pm2 start ecosystem.config.js --only yunqi-platform-dev
// 
// 4. 查看进程状态：
//    pm2 status
//    pm2 logs
//    pm2 monit
// 
// 5. 重启应用：
//    pm2 restart yunqi-platform
// 
// 6. 停止应用：
//    pm2 stop yunqi-platform
// 
// 7. 删除应用：
//    pm2 delete yunqi-platform
// 
// 8. 保存PM2配置（开机自启）：
//    pm2 save
//    pm2 startup
// 
// 9. 查看实时日志：
//    pm2 logs yunqi-platform --lines 100
//Qaz.758945