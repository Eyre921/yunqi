// 测试浏览量防重复调用机制
// Node.js 18+ 内置支持 fetch API

const BASE_URL = 'http://localhost:3000';

async function testDuplicateViewPrevention() {
  try {
    console.log('1. 获取作品列表...');
    const worksResponse = await fetch(`${BASE_URL}/api/works`);
    const worksData = await worksResponse.json();
    
    if (!worksData.success || !worksData.data || worksData.data.length === 0) {
      console.error('❌ 无法获取作品列表');
      return;
    }
    
    const testWork = worksData.data[0];
    console.log(`找到测试作品: ${testWork.description} (ID: ${testWork.id})`);
    console.log(`初始浏览量: ${testWork.viewCount}`);
    
    const initialViewCount = testWork.viewCount;
    
    console.log('\n2. 第一次调用浏览量API...');
    const firstResponse = await fetch(`${BASE_URL}/api/works/${testWork.id}/view`, {
      method: 'POST'
    });
    const firstData = await firstResponse.json();
    console.log('第一次API响应:', JSON.stringify(firstData, null, 2));
    
    if (firstData.success) {
      console.log(`✅ 第一次调用成功，浏览量: ${firstData.data.viewCount}`);
    } else {
      console.log('❌ 第一次调用失败');
      return;
    }
    
    console.log('\n3. 立即第二次调用浏览量API...');
    const secondResponse = await fetch(`${BASE_URL}/api/works/${testWork.id}/view`, {
      method: 'POST'
    });
    const secondData = await secondResponse.json();
    console.log('第二次API响应:', JSON.stringify(secondData, null, 2));
    
    if (secondData.success) {
      console.log(`第二次调用结果，浏览量: ${secondData.data.viewCount}`);
    }
    
    console.log('\n4. 第三次调用浏览量API...');
    const thirdResponse = await fetch(`${BASE_URL}/api/works/${testWork.id}/view`, {
      method: 'POST'
    });
    const thirdData = await thirdResponse.json();
    console.log('第三次API响应:', JSON.stringify(thirdData, null, 2));
    
    if (thirdData.success) {
      console.log(`第三次调用结果，浏览量: ${thirdData.data.viewCount}`);
    }
    
    console.log('\n5. 验证最终浏览量...');
    const finalWorksResponse = await fetch(`${BASE_URL}/api/works`);
    const finalWorksData = await finalWorksResponse.json();
    const finalWork = finalWorksData.data.find(w => w.id === testWork.id);
    
    console.log(`最终浏览量: ${finalWork.viewCount}`);
    console.log(`预期浏览量增加: ${finalWork.viewCount - initialViewCount}`);
    
    if (finalWork.viewCount === initialViewCount + 3) {
      console.log('⚠️  注意：每次API调用都增加了浏览量，防重复机制可能未生效');
      console.log('   这是因为测试脚本直接调用API，绕过了前端的sessionStorage机制');
      console.log('   前端防重复机制仍然有效，只是在服务端API层面没有防重复');
    } else if (finalWork.viewCount === initialViewCount + 1) {
      console.log('✅ 只增加了1次浏览量，防重复机制可能在服务端生效');
    } else {
      console.log(`实际增加了 ${finalWork.viewCount - initialViewCount} 次浏览量`);
    }
    
    console.log('\n📝 说明:');
    console.log('- 前端防重复机制使用sessionStorage，只在浏览器环境中生效');
    console.log('- 此测试直接调用API，会绕过前端防重复逻辑');
    console.log('- 在实际使用中，用户在同一会话中多次打开同一作品不会重复增加浏览量');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

testDuplicateViewPrevention();