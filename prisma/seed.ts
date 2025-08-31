import { PrismaClient, Role, WorkStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库种子数据初始化...');

  // 创建管理员用户
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@yunqi.com' },
    update: {},
    create: {
      email: 'admin@yunqi.com',
      name: '系统管理员',
      role: Role.ADMIN,
      password: hashedPassword,
    },
  });

  console.log('管理员用户已创建:', admin);

  // 创建示例作品数据
  const sampleWorks = [
    {
      name: '数字艺术作品1',
      title: '这是一个充满创意的数字艺术作品，展现了现代科技与传统艺术的完美结合。',
      author: '张艺术',
      prompt: 'A beautiful digital art piece combining traditional Chinese elements with modern technology, vibrant colors, high resolution',
      imageUrl: '/images/DM_20250831112136_001.PNG',
      status: WorkStatus.APPROVED,
      likeCount: 128,
      viewCount: 1024,
      approvedAt: new Date(),
    },
    {
      name: '未来城市概念图',
      title: '展现2050年智慧城市的概念设计，融合了绿色环保和高科技元素。',
      author: '李设计师',
      prompt: 'Futuristic smart city concept art, green technology, sustainable architecture, flying cars, year 2050',
      imageUrl: '/images/DM_20250831112136_002.PNG',
      status: WorkStatus.APPROVED,
      likeCount: 256,
      viewCount: 2048,
      approvedAt: new Date(),
    },
    {
      name: '抽象几何艺术',
      title: '运用几何图形创造的抽象艺术作品，色彩丰富，层次分明。',
      author: '王几何',
      prompt: 'Abstract geometric art, colorful shapes, mathematical precision, modern design',
      imageUrl: '/images/DM_20250831112136_003.PNG',
      status: WorkStatus.APPROVED,
      likeCount: 89,
      viewCount: 512,
      approvedAt: new Date(),
    },
  ];

  // 批量创建作品
  for (const work of sampleWorks) {
    // 检查是否已存在相同名称的作品
    const existingWork = await prisma.work.findFirst({
      where: { name: work.name }
    });
    
    if (!existingWork) {
      await prisma.work.create({
        data: work,
      });
    }
  }

  // 创建更多示例作品（使用现有图片）
  const imageCount = 52; // 根据实际图片数量
  const authors = ['陈创意', '刘画家', '赵设计', '钱艺术家', '孙创作者', '周画师', '吴设计师', '郑艺术'];
  const titleTemplates = [
    '充满想象力的数字艺术创作',
    '现代科技与传统文化的融合',
    '色彩斑斓的视觉盛宴',
    '极具创意的概念设计',
    '富有诗意的艺术表达',
    '前卫的视觉艺术作品',
    '独特风格的数字绘画',
    '令人惊叹的创意设计',
  ];

  for (let i = 4; i <= Math.min(imageCount, 30); i++) {
    const imageNumber = i.toString().padStart(3, '0');
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const randomTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    
    // 检查是否已存在
    const workName = `数字作品${i}`;
    const existingWork = await prisma.work.findFirst({
      where: { name: workName }
    });
    
    if (!existingWork) {
      await prisma.work.create({
        data: {
          name: workName,
          title: randomTitle,
          author: randomAuthor,
          imageUrl: `/images/DM_20250831112136_${imageNumber}.PNG`,
          status: WorkStatus.APPROVED,
          likeCount: Math.floor(Math.random() * 200) + 10,
          viewCount: Math.floor(Math.random() * 1000) + 100,
          approvedAt: new Date(),
        },
      });
    }
  }

  console.log('示例作品数据已创建');
  console.log('数据库种子数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });