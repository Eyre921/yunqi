const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFormInit() {
  try {
    console.log('=== 调试表单初始化问题 ===\n');
    
    // 1. 查询有prompt数据的作品
    console.log('1. 查询有prompt数据的作品:');
    const worksWithPrompt = await prisma.work.findMany({
      where: {
        prompt: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        author: true,
        prompt: true
      },
      take: 3
    });
    
    console.log('找到的作品:', worksWithPrompt);
    console.log('');
    
    if (worksWithPrompt.length === 0) {
      console.log('❌ 没有找到有prompt数据的作品');
      return;
    }
    
    // 2. 模拟API返回的数据结构
    const testWorkId = worksWithPrompt[0].id;
    console.log(`2. 模拟API /api/admin/works/${testWorkId}/edit 的返回数据:`);
    
    const apiResponse = {
      success: true,
      data: worksWithPrompt[0]
    };
    
    console.log('API响应:', JSON.stringify(apiResponse, null, 2));
    console.log('');
    
    // 3. 模拟前端表单初始化逻辑
    console.log('3. 模拟前端表单初始化逻辑:');
    
    const workData = apiResponse.data;
    const editForm = {
      name: workData.name || '',
      author: workData.author || '',
      prompt: workData.prompt || ''
    };
    
    console.log('表单初始化结果:', editForm);
    console.log('');
    
    // 4. 检查字段值
    console.log('4. 字段值检查:');
    console.log(`- name: "${editForm.name}" (长度: ${editForm.name.length})`);
    console.log(`- author: "${editForm.author}" (长度: ${editForm.author.length})`);
    console.log(`- prompt: "${editForm.prompt}" (长度: ${editForm.prompt.length})`);
    console.log('');
    
    // 5. 检查prompt字段的具体内容
    console.log('5. prompt字段详细信息:');
    console.log('- 类型:', typeof editForm.prompt);
    console.log('- 是否为空字符串:', editForm.prompt === '');
    console.log('- 是否为null:', editForm.prompt === null);
    console.log('- 是否为undefined:', editForm.prompt === undefined);
    console.log('- 前50个字符:', editForm.prompt.substring(0, 50));
    
    if (editForm.prompt.length > 0) {
      console.log('✅ prompt字段有内容，应该能正确显示在表单中');
    } else {
      console.log('❌ prompt字段为空，这可能是问题所在');
    }
    
  } catch (error) {
    console.error('调试过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFormInit();