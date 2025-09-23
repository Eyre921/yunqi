import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// 加载环境变量
config();

// 定义OSS响应类型接口
interface OSSHeaders {
  'content-length'?: string;
  'content-type'?: string;
  'last-modified'?: string;
  'etag'?: string;
  'x-oss-storage-class'?: string;
  [key: string]: string | undefined;
}

interface OSSHeadResult {
  res: {
    headers: OSSHeaders;
  };
}

// 扩展 PutObjectResult 类型定义
interface ExtendedPutObjectResult {
  name: string;
  url: string;
  etag: string;
  res: {
    status: number;
    headers: OSSHeaders;
    size: number;
    aborted: boolean;
    rt: number;
    keepAliveSocket: boolean;
    data: Buffer;
    requestUrls: string[];
    timing: any;
    remoteAddress: string;
    remotePort: number;
    socketHandledRequests: number;
    socketHandledResponses: number;
  };
}

interface OSSBucketInfo {
  bucket?: {
    name: string;
    creationDate: string;
    region: string;
    storageClass: string;
    acl: string;
  };
}

interface OSSListBucketsResult {
  buckets?: Array<{
    name: string;
    region: string;
    creationDate: string;
  }>;
}

// 配置OSS客户端
const client = new OSS({
  region: process.env.ALI_OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.ALI_OSS_BUCKET || '',
  endpoint: process.env.ALI_OSS_ENDPOINT
});

// 测试配置
const TEST_CONFIG = {
  testFileName: 'test-image.jpg',
  testFilePath: './test-files/test-image.jpg',
  ossKey: `test/${Date.now()}-test-image.jpg`,
  downloadPath: './downloads/downloaded-test-image.jpg'
};

// 创建测试文件（如果不存在）
function createTestFile(): void {
  const testDir = './test-files';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_CONFIG.testFilePath)) {
    // 创建一个简单的测试文件
    const testContent = Buffer.from('This is a test file for OSS upload');
    fs.writeFileSync(TEST_CONFIG.testFilePath, testContent);
    console.log('✅ 测试文件已创建:', TEST_CONFIG.testFilePath);
  }
}

// 测试查看存储空间列表
async function testListBuckets(): Promise<void> {
  try {
    console.log('\n🔄 开始测试查看存储空间列表...');
    
    // 修复：使用正确的类型和参数
    const result = await client.listBuckets({}, {}) as OSSListBucketsResult;
    
    console.log('✅ 获取存储空间列表成功!');
    
    const buckets = result.buckets || [];
    console.log('- 存储空间数量:', buckets.length);
    
    if (buckets.length > 0) {
      console.log('- 存储空间列表:');
      buckets.forEach((bucket, index: number) => {
        console.log(`  ${index + 1}. ${bucket.name} (${bucket.region}) - 创建时间: ${bucket.creationDate}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ 获取存储空间列表失败:', error.message);
    throw error;
  }
}

// 测试上传文件（带自定义请求头）
async function testUpload(): Promise<ExtendedPutObjectResult> {
  try {
    console.log('\n🔄 开始测试文件上传...');
    
    // 自定义请求头
    const headers = {
      // 指定Object的存储类型
      'x-oss-storage-class': 'Standard',
      // 指定Object的访问权限
      'x-oss-object-acl': 'private',
      // 通过文件URL访问文件时，指定以附件形式下载文件
      'Content-Disposition': 'attachment; filename="test-file.txt"',
      // 设置Object的标签
      'x-oss-tagging': 'Environment=Test&Purpose=Demo'
    };
    
    const result = await client.put(TEST_CONFIG.ossKey, TEST_CONFIG.testFilePath, {
      headers
    }) as unknown as ExtendedPutObjectResult;
    
    console.log('✅ 文件上传成功!');
    console.log('- OSS Key:', result.name);
    console.log('- URL:', result.url);
    console.log('- ETag:', result.etag);
    console.log('- 存储类型: Standard');
    console.log('- 访问权限: private');
    
    return result;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ 文件上传失败:', err.message);
    throw error;
  }
}

// 测试获取文件信息
async function testGetObjectInfo(ossKey: string): Promise<OSSHeadResult> {
  try {
    console.log('\n🔄 开始测试获取文件信息...');
    
    const result = await client.head(ossKey) as OSSHeadResult;
    
    console.log('✅ 获取文件信息成功!');
    console.log('- 文件大小:', result.res.headers['content-length'], 'bytes');
    console.log('- 内容类型:', result.res.headers['content-type']);
    console.log('- 最后修改时间:', result.res.headers['last-modified']);
    console.log('- ETag:', result.res.headers['etag']);
    console.log('- 存储类型:', result.res.headers['x-oss-storage-class'] || 'Standard');
    
    return result;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ 获取文件信息失败:', err.message);
    throw error;
  }
}

// 测试下载文件
async function testDownload(ossKey: string): Promise<any> {
  try {
    console.log('\n🔄 开始测试文件下载...');
    
    // 确保下载目录存在
    const downloadDir = path.dirname(TEST_CONFIG.downloadPath);
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const result = await client.get(ossKey, TEST_CONFIG.downloadPath);
    
    console.log('✅ 文件下载成功!');
    console.log('- 下载路径:', TEST_CONFIG.downloadPath);
    console.log('- 文件大小:', fs.statSync(TEST_CONFIG.downloadPath).size, 'bytes');
    
    return result;
  } catch (error: any) {
    console.error('❌ 文件下载失败:', error.message);
    throw error;
  }
}

// 测试生成签名URL
async function testSignedUrl(ossKey: string): Promise<string> {
  try {
    console.log('\n🔄 开始测试生成签名URL...');
    
    // 生成1小时有效期的签名URL
    const signedUrl = client.signatureUrl(ossKey, {
      expires: 3600, // 1小时
      method: 'GET'
    });
    
    console.log('✅ 签名URL生成成功!');
    console.log('- 签名URL:', signedUrl);
    console.log('- 有效期: 1小时');
    
    return signedUrl;
  } catch (error: any) {
    console.error('❌ 生成签名URL失败:', error.message);
    throw error;
  }
}

// 测试列出文件（增强版）
async function testListObjects(): Promise<any> {
  try {
    console.log('\n🔄 开始测试列出文件...');
    
    // 修复：提供必需的 options 参数
    const result = await client.list({
      prefix: 'test/',
      'max-keys': 10
    }, {});
    
    console.log('✅ 列出文件成功!');
    console.log('- 文件数量:', result.objects?.length || 0);
    console.log('- 是否截断:', result.isTruncated || false);
    
    if (result.objects && result.objects.length > 0) {
      console.log('- 文件列表:');
      result.objects.forEach((obj: any, index: number) => {
        console.log(`  ${index + 1}. ${obj.name} (${obj.size} bytes) - ${obj.lastModified}`);
      });
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ 列出文件失败:', error.message);
    throw error;
  }
}

// 测试删除单个文件
async function testDelete(ossKey: string): Promise<any> {
  try {
    console.log('\n🔄 开始测试文件删除...');
    
    const result = await client.delete(ossKey);
    
    console.log('✅ 文件删除成功!');
    console.log('- 删除的文件:', ossKey);
    
    return result;
  } catch (error: any) {
    console.error('❌ 文件删除失败:', error.message);
    throw error;
  }
}

// 测试批量删除
async function testBatchDelete(): Promise<any> {
  try {
    console.log('\n🔄 开始测试批量删除...');
    
    // 先上传几个测试文件
    const testKeys: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const key = `test/batch-test-${Date.now()}-${i}.txt`;
      await client.put(key, Buffer.from(`Test file ${i}`));
      testKeys.push(key);
      console.log(`- 已上传测试文件: ${key}`);
    }
    
    // 批量删除
    const result = await client.deleteMulti(testKeys);
    
    console.log('✅ 批量删除成功!');
    console.log('- 删除的文件数量:', result.deleted?.length || 0);
    
    return result;
  } catch (error: any) {
    console.error('❌ 批量删除失败:', error.message);
    throw error;
  }
}

// 测试获取Bucket信息
async function testGetBucketInfo(): Promise<any> {
  try {
    console.log('\n🔄 开始测试获取Bucket信息...');
    
    const bucketName = process.env.ALI_OSS_BUCKET || '';
    // 修复：使用正确的类型断言
    const result = await (client as any).getBucketInfo(bucketName) as OSSBucketInfo;
    
    console.log('✅ 获取Bucket信息成功!');
    console.log('- Bucket名称:', result.bucket?.name);
    console.log('- 创建时间:', result.bucket?.creationDate);
    console.log('- 地域:', result.bucket?.region);
    console.log('- 存储类型:', result.bucket?.storageClass);
    console.log('- 访问权限:', result.bucket?.acl);
    
    return result;
  } catch (error: any) {
    console.error('❌ 获取Bucket信息失败:', error.message);
    console.log('💡 提示: getBucketInfo方法可能不可用，可以使用listBuckets获取基本信息');
    throw error;
  }
}

// 检查环境变量
function checkEnvironment(): void {
  console.log('🔍 检查环境变量配置...');
  
  const requiredEnvs = [
    'ALI_OSS_REGION',
    'ALI_OSS_ACCESS_KEY_ID', 
    'ALI_OSS_ACCESS_KEY_SECRET',
    'ALI_OSS_BUCKET'
  ];
  
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missing.forEach(env => console.error(`  - ${env}`));
    console.error('\n请在 .env 文件中配置这些变量');
    process.exit(1);
  }
  
  console.log('✅ 环境变量配置完整');
  console.log('- Region:', process.env.ALI_OSS_REGION);
  console.log('- Bucket:', process.env.ALI_OSS_BUCKET);
  console.log('- Access Key ID:', process.env.ALI_OSS_ACCESS_KEY_ID?.substring(0, 8) + '...');
  console.log('- Endpoint:', process.env.ALI_OSS_ENDPOINT);
}

// 主测试函数
async function runTests(): Promise<void> {
  console.log('🚀 开始OSS功能测试\n');
  
  try {
    // 检查环境
    checkEnvironment();
    
    // 测试查看存储空间列表
    await testListBuckets();
    
    // 测试获取Bucket信息
    await testGetBucketInfo();
    
    // 创建测试文件
    createTestFile();
    
    // 测试上传
    const uploadResult = await testUpload();
    const ossKey = uploadResult.name;
    
    // 测试获取文件信息
    await testGetObjectInfo(ossKey);
    
    // 测试下载
    await testDownload(ossKey);
    
    // 测试签名URL
    await testSignedUrl(ossKey);
    
    // 测试列出文件
    await testListObjects();
    
    // 测试批量删除
    await testBatchDelete();
    
    // 最后删除测试文件
    await testDelete(ossKey);
    
    console.log('\n🎉 所有OSS测试完成!');
    
  } catch (error: any) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    if (error.status) {
      console.error('HTTP状态:', error.status);
    }
    process.exit(1);
  }
}

// 清理函数
function cleanup(): void {
  console.log('\n🧹 清理测试文件...');
  
  // 删除本地测试文件
  if (fs.existsSync(TEST_CONFIG.testFilePath)) {
    fs.unlinkSync(TEST_CONFIG.testFilePath);
    console.log('- 已删除:', TEST_CONFIG.testFilePath);
  }
  
  if (fs.existsSync(TEST_CONFIG.downloadPath)) {
    fs.unlinkSync(TEST_CONFIG.downloadPath);
    console.log('- 已删除:', TEST_CONFIG.downloadPath);
  }
  
  // 删除空目录
  ['./test-files', './downloads'].forEach(dir => {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      console.log('- 已删除空目录:', dir);
    }
  });
}

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n⚠️  收到中断信号，正在清理...');
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

// 运行测试
if (require.main === module) {
  runTests();
}

export {
  testUpload,
  testDownload,
  testDelete,
  testSignedUrl,
  testListObjects,
  testBatchDelete,
  testListBuckets,
  testGetBucketInfo
};