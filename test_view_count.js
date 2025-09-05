// 测试浏览量功能的脚本
// 使用Node.js 18+的内置fetch API

async function testViewCount() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // 1. 首先获取作品列表
    console.log('1. 获取作品列表...');
    const worksResponse = await fetch(`${baseUrl}/api/works?limit=1`);
    const worksData = await worksResponse.json();
    
    if (!worksData.success || !worksData.data || worksData.data.length === 0) {
      console.log('没有找到作品，无法测试浏览量功能');
      return;
    }
    
    const work = worksData.data[0];
    console.log(`找到作品: ${work.name} (ID: ${work.id})`);
    console.log(`当前浏览量: ${work.viewCount}`);
    
    // 2. 测试浏览量API
    console.log('\n2. 测试浏览量增加API...');
    const viewResponse = await fetch(`${baseUrl}/api/works/${work.id}/view`, {
      method: 'POST'
    });
    
    const viewData = await viewResponse.json();
    console.log('浏览量API响应:', JSON.stringify(viewData, null, 2));
    
    if (viewData.success) {
      console.log(`✅ 浏览量增加成功，新的浏览量: ${viewData.data.viewCount}`);
    } else {
      console.log(`❌ 浏览量增加失败: ${viewData.error}`);
    }
    
    // 3. 再次获取作品详情验证
    console.log('\n3. 验证浏览量是否正确更新...');
    const detailResponse = await fetch(`${baseUrl}/api/works/${work.id}`);
    const detailData = await detailResponse.json();
    
    if (detailData.success) {
      console.log(`验证结果: 作品浏览量现在是 ${detailData.data.viewCount}`);
      
      if (detailData.data.viewCount > work.viewCount) {
        console.log('✅ 浏览量更新成功！');
      } else {
        console.log('❌ 浏览量没有正确更新');
      }
    } else {
      console.log('❌ 获取作品详情失败');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 运行测试
testViewCount();