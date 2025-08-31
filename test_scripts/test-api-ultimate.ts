import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

class APITester {
  private api: AxiosInstance;
  private prisma: PrismaClient;
  private sessionCookie: string = '';

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script/1.0'
      }
    });
    this.prisma = new PrismaClient();

    // 拦截器来处理cookies
    this.api.interceptors.response.use(
      (response) => {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          // 提取NextAuth session token
          const sessionToken = setCookie.find(cookie => 
            cookie.includes('next-auth.session-token') || 
            cookie.includes('__Secure-next-auth.session-token')
          );
          if (sessionToken) {
            this.sessionCookie = sessionToken.split(';')[0];
            console.log('🍪 Session cookie captured:', this.sessionCookie.substring(0, 50) + '...');
          }
        }
        return response;
      },
      (error) => {
        console.error('❌ Request failed:', error.response?.status, error.response?.statusText);
        return Promise.reject(error);
      }
    );
  }

  async testDatabaseConnection() {
    console.log('🔍 测试数据库连接和用户数据...');
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: 'admin@yunqi.com' }
      });

      if (!user) {
        console.log('❌ 未找到管理员用户');
        return false;
      }

      console.log('✅ 找到管理员用户:', user.email);
      console.log('用户角色:', user.role);
      
      if (user.password) {
        const isValidPassword = await bcrypt.compare('admin123456', user.password);
        console.log('密码验证:', isValidPassword ? '✅ 正确' : '❌ 错误');
        return isValidPassword;
      }
      
      return false;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      return false;
    }
  }

  async testHealthCheck() {
    try {
      const response = await this.api.get('/api/health');
      console.log('健康检查响应:', response.status);
      console.log('健康检查数据:', response.data);
      return response.status === 200;
    } catch (error: any) {
      console.error('❌ 健康检查失败:', error.response?.status || error.message);
      return false;
    }
  }

  async login(email: string, password: string) {
    console.log('🔐 正在登录:', email);
    try {
      // 1. 获取CSRF token
      const csrfResponse = await this.api.get('/api/auth/csrf');
      const csrfToken = csrfResponse.data.csrfToken;
      console.log('✅ 获取CSRF token成功');

      // 2. 尝试直接使用NextAuth的signIn API
      const signInResponse = await this.api.post('/api/auth/signin/credentials', {
        email,
        password,
        csrfToken,
        callbackUrl: 'http://localhost:3000',
        json: true
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.sessionCookie
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      });

      console.log('登录响应状态:', signInResponse.status);
      
      // 3. 检查会话
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
      
      const sessionResponse = await this.api.get('/api/auth/session', {
        headers: {
          'Cookie': this.sessionCookie
        }
      });
      
      console.log('会话响应状态:', sessionResponse.status);
      console.log('会话数据:', sessionResponse.data);

      if (sessionResponse.data && sessionResponse.data.user) {
        console.log('✅ 登录成功!');
        return true;
      } else {
        console.log('❌ 登录失败 - 无法建立会话');
        
        // 尝试alternative方法：直接调用callback
        console.log('🔄 尝试alternative登录方法...');
        const callbackResponse = await this.api.post('/api/auth/callback/credentials', {
          email,
          password,
          csrfToken
        }, {
          headers: {
            'Cookie': this.sessionCookie
          }
        });
        
        console.log('Callback响应:', callbackResponse.status, callbackResponse.data);
        
        // 再次检查会话
        const finalSessionResponse = await this.api.get('/api/auth/session', {
          headers: {
            'Cookie': this.sessionCookie
          }
        });
        
        console.log('最终会话数据:', finalSessionResponse.data);
        return finalSessionResponse.data && finalSessionResponse.data.user;
      }
    } catch (error: any) {
      console.error('❌ 登录过程出错:', error.response?.status, error.response?.data || error.message);
      return false;
    }
  }

  async testUserAPI() {
    console.log('\n👥 测试用户管理API...');
    try {
      const response = await this.api.get('/api/admin/users?page=1&limit=5', {
        headers: {
          'Cookie': this.sessionCookie
        }
      });
      console.log('✅ 用户API测试成功:', response.status);
      console.log('用户数据:', response.data.data?.users?.length || 0, '个用户');
      return true;
    } catch (error: any) {
      console.error('❌ 用户API测试失败:', error.response?.status, error.response?.data);
      return false;
    }
  }

  async testStatsAPI() {
    console.log('\n📊 测试统计API...');
    try {
      const response = await this.api.get('/api/admin/stats', {
        headers: {
          'Cookie': this.sessionCookie
        }
      });
      console.log('✅ 统计API测试成功:', response.status);
      console.log('统计数据概览:', {
        totalUsers: response.data.data?.overview?.totalUsers,
        totalWorks: response.data.data?.overview?.totalWorks
      });
      return true;
    } catch (error: any) {
      console.error('❌ 统计API测试失败:', error.response?.status, error.response?.data);
      return false;
    }
  }

  async testWorksAPI() {
    console.log('\n🎨 测试作品管理API...');
    try {
      const response = await this.api.get('/api/admin/works?page=1&limit=5', {
        headers: {
          'Cookie': this.sessionCookie
        }
      });
      console.log('✅ 作品API测试成功:', response.status);
      console.log('作品数据:', response.data.data?.works?.length || 0, '个作品');
      return true;
    } catch (error: any) {
      console.error('❌ 作品API测试失败:', error.response?.status, error.response?.data);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 开始API测试...');
    console.log('==================================================');

    // 1. 测试数据库连接
    const dbOk = await this.testDatabaseConnection();
    if (!dbOk) {
      console.log('❌ 数据库测试失败，停止测试');
      return;
    }

    // 2. 测试健康检查
    const healthOk = await this.testHealthCheck();
    if (!healthOk) {
      console.log('❌ 健康检查失败，停止测试');
      return;
    }

    // 3. 登录
    const loginOk = await this.login('admin@yunqi.com', 'admin123456');
    if (!loginOk) {
      console.log('❌ 登录失败，无法继续测试');
      console.log('\n🔧 调试建议:');
      console.log('1. 检查NextAuth配置是否正确');
      console.log('2. 确认NEXTAUTH_SECRET环境变量已设置');
      console.log('3. 重启开发服务器: npm run dev');
      console.log('4. 检查数据库中的用户密码是否正确');
      return;
    }

    // 4. 测试各个API
    await this.testUserAPI();
    await this.testStatsAPI();
    await this.testWorksAPI();

    console.log('\n🎉 所有测试完成!');
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// 运行测试
const tester = new APITester();
tester.runAllTests()
  .catch(console.error)
  .finally(() => tester.cleanup());