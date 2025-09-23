import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 开始验证数据库连接和数据...');
    
    // 1. 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 2. 检查用户表
    const userCount = await prisma.user.count();
    console.log(`👥 用户总数: ${userCount}`);
    
    // 3. 检查管理员用户
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    });
    console.log('👑 管理员用户:', adminUsers);
    
    // 4. 检查作品数据
    const workStats = await prisma.work.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    console.log('🎨 作品统计:');
    workStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status} 个`);
    });
    
    // 5. 检查最新的作品
    const latestWorks = await prisma.work.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: true
      }
    });
    console.log('📝 最新5个作品:');
    latestWorks.forEach(work => {
      console.log(`  ${work.title} - ${work.status} - ${work.createdAt}`);
    });
    
    // 6. 检查配置表
    const uploadConfig = await prisma.uploadConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('⚙️ 上传配置:', uploadConfig ? '已配置' : '未配置');
    
    const platformConfig = await prisma.platformConfig.findFirst();
    console.log('🏠 平台配置:', platformConfig ? platformConfig.title : '未配置');
    
    console.log('\n✅ 数据库验证完成');
    
  } catch (error: unknown) {
    console.error('❌ 数据库验证失败:', error);
    
    // 类型守卫：检查是否为 Prisma 错误
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P1001') {
        console.error('💡 解决方案: 检查数据库连接字符串和网络连接');
      } else if (error.code === 'P2021') {
        console.error('💡 解决方案: 数据库表不存在，需要运行迁移');
      }
    } else if (error instanceof Error) {
      console.error('💡 错误信息:', error.message);
    } else {
      console.error('💡 未知错误类型');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// 创建管理员用户的函数
async function createAdminUser() {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@yunqi.com' },
      update: {},
      create: {
        email: 'admin@yunqi.com',
        name: '管理员',
        role: 'ADMIN',
        password: hashedPassword
      }
    });
    
    console.log('👑 管理员用户已创建/更新:', admin.email);
  } catch (error: unknown) {
    console.error('❌ 创建管理员用户失败:', error);
    
    if (error instanceof Error) {
      console.error('💡 错误详情:', error.message);
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-admin')) {
    await createAdminUser();
  } else {
    await verifyDatabase();
  }
}

main().catch((error: unknown) => {
  console.error('程序执行失败:', error);
  if (error instanceof Error) {
    console.error('错误详情:', error.message);
  }
});