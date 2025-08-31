import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: any;
  timestamp: string;
}

class EnhancedAPITestSuite {
  private api: AxiosInstance;
  private prisma: PrismaClient;
  private sessionCookie: string = '';
  private results: TestResult[] = [];
  private baseURL = 'http://localhost:3000';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Enhanced-API-Test-Suite/1.0'
      }
    });
    
    this.prisma = new PrismaClient();

    // 增强的Cookie处理
    this.api.interceptors.response.use(
      (response) => {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          // 提取所有NextAuth相关的Cookie
          const authCookies = setCookie.filter(cookie => 
            cookie.includes('next-auth') || 
            cookie.includes('__Secure-next-auth') ||
            cookie.includes('__Host-next-auth')
          );
          
          if (authCookies.length > 0) {
            this.sessionCookie = authCookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log('🍪 Cookie已更新:', this.sessionCookie.substring(0, 50) + '...');
          }
        }
        return response;
      },
      (error) => {
        console.log('❌ 请求错误详情:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    // 请求拦截器添加Cookie
    this.api.interceptors.request.use(
      (config) => {
        if (this.sessionCookie) {
          config.headers.Cookie = this.sessionCookie;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`\n🧪 运行测试: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        status: 'PASS',
        duration,
        details: result,
        timestamp
      };
      
      console.log(`✅ ${testName} - 通过 (${duration}ms)`);
      this.results.push(testResult);
      return testResult;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testName,
        status: 'FAIL',
        duration,
        error: error.message,
        details: error.response?.data || error,
        timestamp
      };
      
      console.log(`❌ ${testName} - 失败 (${duration}ms): ${error.message}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  async testDatabaseConnection(): Promise<any> {
    await this.prisma.$connect();
    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('未找到管理员用户');
    }
    
    return {
      connected: true,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name
      }
    };
  }

  async testHealthCheck(): Promise<any> {
    const response = await this.api.get('/api/health');
    
    if (response.status !== 200) {
      throw new Error(`健康检查失败: ${response.status}`);
    }
    
    return response.data;
  }

  async testLogin(): Promise<any> {
    console.log('🔐 开始登录测试...');
    
    try {
      // 步骤1: 获取CSRF token
      console.log('📋 获取CSRF token...');
      const csrfResponse = await this.api.get('/api/auth/csrf');
      
      if (csrfResponse.status !== 200) {
        throw new Error(`无法获取CSRF token: ${csrfResponse.status}`);
      }
      
      const csrfToken = csrfResponse.data.csrfToken;
      console.log('✅ CSRF token获取成功');

      // 步骤2: 使用正确的NextAuth登录端点
      console.log('🚀 发送登录请求...');
      const loginData = new URLSearchParams({
        email: 'admin@yunqi.com',
        password: 'admin123456',
        csrfToken: csrfToken,
        callbackUrl: this.baseURL,
        json: 'true'
      });

      const loginResponse = await this.api.post('/api/auth/callback/credentials', loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400 || status === 302
      });

      console.log('📊 登录响应状态:', loginResponse.status);
      
      // 步骤3: 等待会话建立
      console.log('⏳ 等待会话建立...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 步骤4: 验证会话
      console.log('🔍 验证会话...');
      const sessionResponse = await this.api.get('/api/auth/session');
      
      console.log('📊 会话响应状态:', sessionResponse.status);
      console.log('👤 会话数据:', sessionResponse.data);

      if (sessionResponse.status === 200 && sessionResponse.data?.user) {
        console.log('✅ 登录成功!');
        return {
          loginStatus: loginResponse.status,
          sessionData: sessionResponse.data,
          cookieSet: !!this.sessionCookie,
          user: sessionResponse.data.user
        };
      }

      throw new Error('会话建立失败 - 未找到用户数据');
      
    } catch (error: any) {
      console.log('❌ 登录失败:', error.message);
      if (error.response) {
        console.log('📊 错误响应:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw error;
    }
  }

  async testUserManagementAPI(): Promise<any> {
    const response = await this.api.get('/api/admin/users');
    
    if (response.status !== 200) {
      throw new Error(`用户管理API失败: ${response.status}`);
    }
    
    return {
      status: response.status,
      userCount: response.data.users?.length || 0,
      hasData: !!response.data.users
    };
  }

  async testStatsAPI(): Promise<any> {
    const response = await this.api.get('/api/admin/stats');
    
    if (response.status !== 200) {
      throw new Error(`统计API失败: ${response.status}`);
    }
    
    return {
      status: response.status,
      hasStats: !!response.data.data,
      stats: response.data.data
    };
  }

  async testWorksAPI(): Promise<any> {
    const response = await this.api.get('/api/admin/works');
    
    if (response.status !== 200) {
      throw new Error(`作品管理API失败: ${response.status}`);
    }
    
    return {
      status: response.status,
      workCount: response.data.works?.length || 0,
      hasData: !!response.data.works
    };
  }

  async testUnauthorizedAccess(): Promise<any> {
    // 清除认证Cookie进行未授权测试
    const originalCookie = this.sessionCookie;
    this.sessionCookie = '';
    
    try {
      const response = await this.api.get('/api/admin/users');
      
      // 恢复Cookie
      this.sessionCookie = originalCookie;
      
      if (response.status === 200) {
        throw new Error('未授权访问应该被拒绝');
      }
      
      return {
        status: response.status,
        properlyBlocked: response.status === 401 || response.status === 403
      };
    } catch (error: any) {
      // 恢复Cookie
      this.sessionCookie = originalCookie;
      
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return {
          status: error.response.status,
          properlyBlocked: true,
          message: '正确阻止了未授权访问'
        };
      }
      
      throw error;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行API测试套件...');
    console.log('=' .repeat(50));
    
    // 运行所有测试
    await this.runTest('数据库连接测试', () => this.testDatabaseConnection());
    await this.runTest('健康检查测试', () => this.testHealthCheck());
    await this.runTest('用户登录测试', () => this.testLogin());
    await this.runTest('用户管理API测试', () => this.testUserManagementAPI());
    await this.runTest('统计API测试', () => this.testStatsAPI());
    await this.runTest('作品管理API测试', () => this.testWorksAPI());
    await this.runTest('未授权访问测试', () => this.testUnauthorizedAccess());
    
    // 生成测试报告
    await this.generateReport();
  }

  private async generateReport(): Promise<void> {
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      skipped: this.results.filter(r => r.status === 'SKIP').length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      timestamp: new Date().toISOString()
    };

    const report = {
      summary,
      results: this.results
    };

    // 确保test_results目录存在
    const resultsDir = path.join(process.cwd(), 'test_results');
    try {
      await fs.access(resultsDir);
    } catch {
      await fs.mkdir(resultsDir, { recursive: true });
    }

    // 保存详细报告
    const reportPath = path.join(resultsDir, `api-test-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // 控制台输出摘要
    console.log('\n' + '=' .repeat(50));
    console.log('📊 测试结果摘要:');
    console.log(`总测试数: ${summary.totalTests}`);
    console.log(`✅ 通过: ${summary.passed}`);
    console.log(`❌ 失败: ${summary.failed}`);
    console.log(`⏭️  跳过: ${summary.skipped}`);
    console.log(`⏱️  总耗时: ${summary.totalDuration}ms`);
    console.log(`📄 详细报告: ${reportPath}`);
    console.log('=' .repeat(50));
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('🧹 清理完成');
  }
}

// 运行测试
const testSuite = new EnhancedAPITestSuite();
testSuite.runAllTests()
  .catch(console.error)
  .finally(() => testSuite.cleanup());