// 简化的运行脚本，使用 CommonJS
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const OSS = require('ali-oss');

// 验证环境变量函数
function validateEnv() {
  const requiredVars = [
    'ALI_OSS_REGION',
    'ALI_OSS_ACCESS_KEY_ID', 
    'ALI_OSS_ACCESS_KEY_SECRET',
    'ALI_OSS_BUCKET',
    'ALI_OSS_ENDPOINT'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:', missing.join(', '));
    console.error('请检查 .env 或 .env.local 文件中的配置');
    process.exit(1);
  }
  
  console.log('✅ 环境变量验证通过');
}

// 验证环境变量
console.log('🔍 当前环境变量:');
console.log('- ALI_OSS_REGION:', process.env.ALI_OSS_REGION);
console.log('- ALI_OSS_BUCKET:', process.env.ALI_OSS_BUCKET);
console.log('- ALI_OSS_ACCESS_KEY_ID:', process.env.ALI_OSS_ACCESS_KEY_ID ? process.env.ALI_OSS_ACCESS_KEY_ID.substring(0, 8) + '...' : '未设置');
console.log('- ALI_OSS_ENDPOINT:', process.env.ALI_OSS_ENDPOINT);

// 验证环境变量
validateEnv();

// 配置OSS客户端
const client = new OSS({
  region: process.env.ALI_OSS_REGION,
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALI_OSS_BUCKET,
  endpoint: process.env.ALI_OSS_ENDPOINT
});

// 快速测试函数
async function quickTest() {
  console.log('🚀 开始OSS快速测试\n');
  
  try {
    // 检查配置
    if (!process.env.ALI_OSS_ACCESS_KEY_ID) {
      throw new Error('请配置 ALI_OSS_ACCESS_KEY_ID 环境变量');
    }
    
    console.log('✅ OSS配置检查通过');
    console.log('- Region:', process.env.ALI_OSS_REGION);
    console.log('- Bucket:', process.env.ALI_OSS_BUCKET);
    console.log('- Endpoint:', process.env.ALI_OSS_ENDPOINT);
    
    // 测试查看存储空间列表
    console.log('\n🔄 测试查看存储空间列表...');
    const bucketsResult = await client.listBuckets();
    console.log('✅ 存储空间数量:', bucketsResult.buckets?.length || 0);
    
    // 测试获取当前Bucket信息
    console.log('\n🔄 测试获取Bucket信息...');
    const bucketInfo = await client.getBucketInfo(process.env.ALI_OSS_BUCKET);
    console.log('✅ Bucket信息获取成功:', bucketInfo.bucket?.name);
    
    // 创建测试文件
    const testContent = Buffer.from(`OSS测试文件 - ${new Date().toISOString()}`);
    const testKey = `test/quick-test-${Date.now()}.txt`;
    
    // 上传测试
    console.log('\n🔄 测试上传...');
    const uploadResult = await client.put(testKey, testContent, {
      headers: {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'private'
      }
    });
    console.log('✅ 上传成功:', uploadResult.url);
    
    // 下载测试
    console.log('\n🔄 测试下载...');
    const downloadResult = await client.get(testKey);
    console.log('✅ 下载成功，内容长度:', downloadResult.content.length);
    
    // 生成签名URL
    console.log('\n🔄 测试签名URL...');
    const signedUrl = client.signatureUrl(testKey, { expires: 3600 });
    console.log('✅ 签名URL生成成功');
    console.log('URL:', signedUrl);
    
    // 列出文件
    console.log('\n🔄 测试列出文件...');
    const listResult = await client.list({ prefix: 'test/', 'max-keys': 5 });
    console.log('✅ 文件列表获取成功，文件数量:', listResult.objects?.length || 0);
    
    // 删除测试文件
    console.log('\n🔄 测试删除...');
    await client.delete(testKey);
    console.log('✅ 删除成功');
    
    console.log('\n🎉 OSS快速测试完成!');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    if (error.status) {
      console.error('HTTP状态:', error.status);
    }
    if (error.requestId) {
      console.error('请求ID:', error.requestId);
    }
  }
}

// 运行测试
quickTest();