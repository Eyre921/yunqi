import axios, { AxiosInstance } from 'axios';
import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

class APITester {
  private baseURL: string;
  private client: AxiosInstance;
  private sessionToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // 重要：启用cookie支持
    });
  }

  // 测试数据库连接和用户数据
  async testDatabaseConnection() {
    console.log('🔍 测试数据库连接和用户数据...');
    
    try {
      const user = await prisma.user.findUnique({
        where: { email: 'admin@yunqi.com' }
      });
      
      if (user) {
        console.log('✅ 找到管理员用户:', user.email);
        console.log('用户角色:', user.role);
        
        // 验证密码
        const isValidPassword = await bcrypt.compare('admin123456', user.password!);
        console.log('密码验证:', isValidPassword ? '✅ 正确' : '❌ 错误');
      } else {
        console.log('❌ 未找到管理员用户');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      return false;
    }
  }

  // 测试健康检查
  async testHealthCheck() {
    try {
      const response = await this.client.get('/api/health');
      console.log('健康检查响应:', response.status);
      console.log('健康检查数据:', response.data);
      return response.status === 200;
    } catch (error: any) {
      console.error('❌ 健康检查失败:', error.response?.status, error.message);
      return false;
    }
  }

  // 修复的登录方法 - 使用正确的NextAuth流程
  async login(email: string, password: string) {
    try {
      console.log(`🔐 正在登录: ${email}`);
      
      // 步骤1: 获取CSRF token
      const csrfResponse = await this.client.get('/api/auth/csrf');
      if (csrfResponse.status !== 200) {
        console.error('❌ 无法获取CSRF token');
        return false;
      }
      
      const csrfToken = csrfResponse.data.csrfToken;
      console.log('✅ 获取CSRF token成功');
      
      // 步骤2: 使用正确的NextAuth登录端点
      const loginData = new URLSearchParams({
        email: email,
        password: password,
        csrfToken: csrfToken,
        callbackUrl: this.baseURL,
        json: 'true'
      });

      const loginResponse = await this.client.post('/api/auth/callback/credentials', loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400 || status === 302
      });

      console.log('登录响应状态:', loginResponse.status);
      
      // 步骤3: 验证会话
      const sessionResponse = await this.client.get('/api/auth/session');
      console.log('会话响应状态:', sessionResponse.status);
      
      if (sessionResponse.status === 200 && sessionResponse.data?.user) {
        console.log('✅ 登录成功');
        console.log(`👤 用户信息: ${sessionResponse.data.user.name} (${sessionResponse.data.user.role})`);
        return true;
      } else {
        console.log('❌ 登录失败 - 无法建立会话');
        console.log('会话数据:', sessionResponse.data);
        return false;
      }
      
    } catch (error: any) {
      console.error('登录错误:', error.response?.status, error.response?.data || error.message);
      return false;
    }
  }

  // 记录响应信息
  logResponse(endpoint: string, response: any) {
    console.log(`\n📡 ${endpoint}`);
    console.log(`状态: ${response.status}`);
    if (response.data?.success) {
      console.log('✅ 请求成功');
      if (response.data.data) {
        console.log('数据:', JSON.stringify(response.data.data, null, 2));
      }
    } else {
      console.log('❌ 请求失败');
      console.log('错误:', response.data?.error || '未知错误');
    }
  }

  // 测试统计API
  async testStatsAPI() {
    console.log('\n📊 测试统计API...');
    
    try {
      const response = await this.client.get('/api/admin/stats');
      this.logResponse('GET /api/admin/stats', response);
      return true;
    } catch (error: any) {
      console.error('❌ 统计API测试失败:', error.response?.status, error.response?.data);
      return false;
    }
  }

  // 测试用户管理API
  async testUserAPI() {
    console.log('\n👥 测试用户管理API...');
    
    try {
      const response = await this.client.get('/api/admin/users?page=1&limit=5');
      this.logResponse('GET /api/admin/users', response);
      return true;
    } catch (error: any) {
      console.error('❌ 用户API测试失败:', error.response?.status, error.response?.data);
      return false;
    }
  }

  // 测试作品管理API
  async testWorksAPI() {
    console.log('\n🎨 测试作品管理API...');
    
    try {
      const response = await this.client.get('/api/admin/works?page=1&limit=5');
      this.logResponse('GET /api/admin/works', response);
      return true;
    } catch (error: any) {
      console.error('❌ 作品API测试失败:', error.response?.status, error.response?.data);
      return false;
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始API测试...');
    console.log('==================================================');
    
    // 1. 测试数据库连接
    const dbConnected = await this.testDatabaseConnection();
    if (!dbConnected) {
      console.log('\n❌ 数据库连接失败，请检查数据库配置和种子数据');
      return;
    }
    
    // 2. 测试健康检查
    const healthOk = await this.testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ 健康检查失败，请确保服务器正在运行');
      return;
    }
    
    // 3. 登录
    const loginSuccess = await this.login('admin@yunqi.com', 'admin123456');
    if (!loginSuccess) {
      console.log('\n❌ 登录失败，无法继续测试');
      console.log('\n🔧 调试建议:');
      console.log('1. 检查NextAuth配置是否正确');
      console.log('2. 确认NEXTAUTH_SECRET环境变量已设置');
      console.log('3. 重启开发服务器: npm run dev');
      return;
    }
    
    // 4. 测试各个API
    await this.testUserAPI();
    await this.testWorksAPI();
    await this.testStatsAPI();
    
    console.log('\n🎉 API测试完成！');
  }
}

// 运行测试
const tester = new APITester();
tester.runAllTests().catch(console.error);