import { PrismaClient, Role, WorkStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库种子数据初始化...');

  // 清理现有数据（可选，谨慎使用）
  // await prisma.work.deleteMany({});
  // await prisma.user.deleteMany({});

  // 创建测试用户账号
  const users = [
    {
      email: 'admin@yunqi.com',
      name: '系统管理员',
      role: Role.ADMIN,
      password: '123456'
    },
    {
      email: 'admin2@yunqi.com',
      name: '副管理员',
      role: Role.ADMIN,
      password: '123456'
    },
    {
      email: 'user1@yunqi.com',
      name: '张三',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'user2@yunqi.com',
      name: '李四',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'user3@yunqi.com',
      name: '王五',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'artist1@yunqi.com',
      name: '陈艺术家',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'artist2@yunqi.com',
      name: '刘设计师',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'creator1@yunqi.com',
      name: '赵创作者',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'designer1@yunqi.com',
      name: '钱设计',
      role: Role.USER,
      password: '123456'
    },
    {
      email: 'test@yunqi.com',
      name: '测试用户',
      role: Role.USER,
      password: '123456'
    }
  ];

  // 创建用户账号
  const createdUsers = [];
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
      },
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
      },
    });
    
    createdUsers.push(user);
    console.log(`用户已创建: ${user.name} (${user.email})`);
  }

  // 创建详细的作品数据
  const detailedWorks = [
    {
      name: '数字艺术作品1',
      title: '梦幻星空下的未来城市',
      description: '这是一幅描绘未来城市夜景的数字艺术作品。画面中，璀璨的星空下，高耸的摩天大楼闪烁着霓虹灯光，飞行器在空中穿梭，展现了一个充满科技感和未来感的都市景象。作品运用了丰富的色彩层次和光影效果，营造出梦幻而又真实的视觉体验。',
      author: '张艺术',
      prompt: 'A beautiful futuristic city at night under starry sky, neon lights, flying vehicles, cyberpunk style, high resolution, digital art',
      imageUrl: '/images/DM_20250831112136_001.PNG',
      status: WorkStatus.APPROVED,
      likeCount: 128,
      viewCount: 1024,
      approvedAt: new Date(),
      userId: createdUsers.find(u => u.email === 'artist1@yunqi.com')?.id
    },
    {
      name: '未来城市概念图',
      title: '2050年智慧生态城市设计',
      description: '展现2050年智慧城市的概念设计，融合了绿色环保和高科技元素。城市中遍布垂直农场、太阳能建筑和空中花园，体现了人与自然和谐共生的理念。设计注重可持续发展，每个建筑都集成了先进的环保技术。',
      author: '李设计师',
      prompt: 'Futuristic smart city concept art, green technology, sustainable architecture, vertical farms, solar panels, year 2050',
      imageUrl: '/images/DM_20250831112136_002.PNG',
      status: WorkStatus.APPROVED,
      likeCount: 256,
      viewCount: 2048,
      approvedAt: new Date(),
      userId: createdUsers.find(u => u.email === 'artist2@yunqi.com')?.id
    },
    {
      name: '抽象几何艺术',
      title: '数学之美：几何图形的诗意表达',
      description: '运用几何图形创造的抽象艺术作品，色彩丰富，层次分明。作品通过精确的数学计算和艺术直觉的结合，创造出既理性又感性的视觉效果。每个几何形状都经过精心设计，形成和谐统一的整体构图。',
      author: '王几何',
      prompt: 'Abstract geometric art, colorful shapes, mathematical precision, modern design, vibrant colors',
      imageUrl: '/images/DM_20250831112136_003.PNG',
      status: WorkStatus.APPROVED,
      likeCount: 89,
      viewCount: 512,
      approvedAt: new Date(),
      userId: createdUsers.find(u => u.email === 'creator1@yunqi.com')?.id
    },
    {
      name: '待审核作品1',
      title: '神秘森林中的精灵',
      description: '描绘了一个神秘森林中精灵的形象，充满奇幻色彩。',
      author: '新手创作者',
      prompt: 'Mystical forest elf, fantasy art, magical atmosphere, detailed illustration',
      imageUrl: '/images/DM_20250831112136_004.PNG',
      status: WorkStatus.PENDING,
      likeCount: 0,
      viewCount: 15,
      userId: createdUsers.find(u => u.email === 'user1@yunqi.com')?.id
    },
    {
      name: '被拒绝作品1',
      title: '低质量测试图片',
      description: '这是一个测试用的低质量图片。',
      author: '测试用户',
      prompt: 'Low quality test image',
      imageUrl: '/images/DM_20250831112136_005.PNG',
      status: WorkStatus.REJECTED,
      likeCount: 0,
      viewCount: 8,
      rejectedAt: new Date(),
      rejectReason: '图片质量不符合平台标准，请提交更高质量的作品。',
      userId: createdUsers.find(u => u.email === 'test@yunqi.com')?.id
    }
  ];

  // 创建详细作品
  for (const work of detailedWorks) {
    const existingWork = await prisma.work.findFirst({
      where: { name: work.name }
    });
    
    if (!existingWork) {
      await prisma.work.create({
        data: work,
      });
      console.log(`作品已创建: ${work.name}`);
    }
  }

  // 批量创建更多作品（使用现有图片）
  const imageCount = 52; // 根据实际图片数量
  const authors = [
    '陈创意', '刘画家', '赵设计', '钱艺术家', '孙创作者', 
    '周画师', '吴设计师', '郑艺术', '冯创作', '褚设计师',
    '卫艺术家', '蒋画家', '沈创意', '韩设计', '杨艺术'
  ];
  
  const titleTemplates = [
    '充满想象力的数字艺术创作',
    '现代科技与传统文化的融合',
    '色彩斑斓的视觉盛宴',
    '极具创意的概念设计',
    '富有诗意的艺术表达',
    '前卫的视觉艺术作品',
    '独特风格的数字绘画',
    '令人惊叹的创意设计',
    '梦幻般的艺术世界',
    '未来主义风格作品',
    '抽象表现主义杰作',
    '超现实主义创作',
    '极简主义美学体现',
    '巴洛克风格的现代诠释',
    '东方美学的数字化表达'
  ];

  const descriptions = [
    '这是一件融合了传统艺术技法与现代数字技术的优秀作品，展现了艺术家深深的功底和创新精神。',
    '作品通过独特的视角和精湛的技艺，为观众呈现了一个全新的艺术世界，令人印象深刻。',
    '艺术家运用丰富的色彩和精妙的构图，创造出了这件具有强烈视觉冲击力的数字艺术作品。',
    '这件作品体现了艺术家对美的独特理解，通过数字媒介表达了深刻的艺术内涵。',
    '作品展现了现代数字艺术的无限可能，是技术与艺术完美结合的典型代表。',
    '通过精心的设计和创作，艺术家为我们带来了这件充满创意和想象力的优秀作品。',
    '这是一件体现了艺术家深厚文化底蕴和现代审美观念的精彩作品。',
    '作品运用了先进的数字技术，展现了艺术家对未来艺术发展方向的深刻思考。'
  ];

  const prompts = [
    'Digital art masterpiece, vibrant colors, high resolution, professional quality',
    'Modern abstract art, creative composition, artistic expression, digital painting',
    'Futuristic concept art, sci-fi elements, detailed illustration, concept design',
    'Fantasy art, magical atmosphere, mystical elements, digital artwork',
    'Contemporary art style, innovative design, creative vision, digital medium',
    'Artistic interpretation, unique perspective, creative expression, digital art',
    'Visual art, aesthetic composition, artistic creativity, digital illustration',
    'Creative artwork, artistic vision, digital masterpiece, professional art'
  ];

  // 创建不同状态的作品
  const statuses = [WorkStatus.APPROVED, WorkStatus.PENDING, WorkStatus.REJECTED];
  const statusWeights = [0.7, 0.2, 0.1]; // 70%通过，20%待审核，10%拒绝

  for (let i = 6; i <= Math.min(imageCount, 50); i++) {
    const imageNumber = i.toString().padStart(3, '0');
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    const randomTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    
    // 根据权重随机选择状态
    const rand = Math.random();
    let status: WorkStatus = WorkStatus.APPROVED;
    if (rand < statusWeights[2]) {
      status = WorkStatus.REJECTED;
    } else if (rand < statusWeights[1] + statusWeights[2]) {
      status = WorkStatus.PENDING;
    }
    
    const workName = `数字作品${i}`;
    const existingWork = await prisma.work.findFirst({
      where: { name: workName }
    });
    
    if (!existingWork) {
      const workData: any = {
        name: workName,
        title: randomTitle,
        description: randomDescription,
        author: randomAuthor,
        prompt: randomPrompt,
        imageUrl: `/images/DM_20250831112136_${imageNumber}.PNG`,
        status: status,
        likeCount: status === WorkStatus.APPROVED ? Math.floor(Math.random() * 300) + 10 : 0,
        viewCount: status === WorkStatus.APPROVED ? Math.floor(Math.random() * 2000) + 100 : Math.floor(Math.random() * 50) + 5,
        userId: randomUser.id
      };

      // 根据状态设置相应的时间戳
      if (status === WorkStatus.APPROVED) {
        workData.approvedAt = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // 最近30天内随机时间
      } else if (status === WorkStatus.REJECTED) {
        workData.rejectedAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // 最近7天内随机时间
        workData.rejectReason = '作品质量需要进一步提升，建议优化构图和色彩搭配。';
      }

      await prisma.work.create({
        data: workData,
      });
    }
  }

  // 统计信息
  const totalUsers = await prisma.user.count();
  const totalWorks = await prisma.work.count();
  const approvedWorks = await prisma.work.count({ where: { status: WorkStatus.APPROVED } });
  const pendingWorks = await prisma.work.count({ where: { status: WorkStatus.PENDING } });
  const rejectedWorks = await prisma.work.count({ where: { status: WorkStatus.REJECTED } });
  const adminUsers = await prisma.user.count({ where: { role: Role.ADMIN } });
  const regularUsers = await prisma.user.count({ where: { role: Role.USER } });

  console.log('\n=== 数据库种子数据初始化完成 ===');
  console.log(`总用户数: ${totalUsers}`);
  console.log(`  - 管理员: ${adminUsers}`);
  console.log(`  - 普通用户: ${regularUsers}`);
  console.log(`总作品数: ${totalWorks}`);
  console.log(`  - 已通过: ${approvedWorks}`);
  console.log(`  - 待审核: ${pendingWorks}`);
  console.log(`  - 已拒绝: ${rejectedWorks}`);
  console.log('\n测试账号信息:');
  console.log('管理员账号: admin@yunqi.com / 123456');
  console.log('副管理员: admin2@yunqi.com / 123456');
  console.log('普通用户: user1@yunqi.com / 123456');
  console.log('艺术家: artist1@yunqi.com / 123456');
  console.log('设计师: designer1@yunqi.com / 123456');
  console.log('测试用户: test@yunqi.com / 123456');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });