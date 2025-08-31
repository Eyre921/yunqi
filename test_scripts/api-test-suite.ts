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

interface TestSuiteResult {
  suiteName: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  tests: TestResult[];
  environment: {
    nodeVersion: string;
    platform: string;
    baseURL: string;
  };
}

class APITestSuite {
  private api: AxiosInstance;
  private prisma: PrismaClient;
  private sessionCookie: string = '';
  private results: TestResult[] = [];
  private suiteStartTime: Date;
  private baseURL = 'http://localhost:3000';

  constructor() {
    this.suiteStartTime = new Date();
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Suite/1.0'
      }
    });
    this.prisma = new PrismaClient();

    // 响应拦截器处理cookies
    this.api.interceptors.response.use(
      (response) => {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          const sessionToken = setCookie.find(cookie => 
            cookie.includes('next-auth.session-token') || 
            cookie.includes('__Secure-next-auth.session-token')
          );
          if (sessionToken) {
            this.sessionCookie = sessionToken.split(';')[0];
          }
        }
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log(`🧪 ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        status: 'PASS',
        duration,
        timestamp,
        details: result
      };
      
      console.log(`✅ ${testName} - ${duration}ms`);
      this.results.push(testResult);
      return testResult;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        status: 'FAIL',
        duration,
        timestamp,
        error: error.message,
        details: error.response?.data
      };
      
      console.log(`❌ ${testName} - ${duration}ms - ${error.message}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  async testDatabaseConnection(): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: 'admin@yunqi.com' }
    });

    if (!user) {
      throw new Error('管理员用户不存在');
    }

    if (!user.password) {
      throw new Error('管理员用户密码未设置');
    }

    const isValidPassword = await bcrypt.compare('admin123456', user.password);
    if (!isValidPassword) {
      throw new Error('管理员密码验证失败');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      passwordValid: true
    };
  }

  async testHealthCheck(): Promise<any> {
    const response = await this.api.get('/api/health');
    
    if (response.status !== 200) {
      throw new Error(`健康检查失败: ${response.status}`);
    }

    return {
      status: response.status,
      data: response.data
    };
  }

  async testLogin(): Promise<any> {
    // 1. 获取CSRF token
    const csrfResponse = await this.api.get('/api/auth/csrf');
    const csrfToken = csrfResponse.data.csrfToken;

    // 2. 使用正确的NextAuth signin API
    const loginData = {
      email: 'admin@yunqi.com',
      password: 'admin123456',
      csrfToken,
      callbackUrl: this.baseURL,
      json: true
    };

    const loginResponse = await this.api.post('/api/auth/signin', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || status === 302
    });

    // 3. 如果是重定向，跟随重定向
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.location;
      if (location && !location.includes('error')) {
        // 登录成功，验证会话
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sessionResponse = await this.api.get('/api/auth/session');
        
        if (!sessionResponse.data?.user) {
          throw new Error('会话建立失败');
        }

        return {
          loginStatus: 'success',
          sessionData: sessionResponse.data,
          cookieSet: !!this.sessionCookie
        };
      } else {
        throw new Error('登录失败：' + location);
      }
    }

    // 4. 直接返回成功的情况
    if (loginResponse.status === 200) {
      const sessionResponse = await this.api.get('/api/auth/session');
      
      if (!sessionResponse.data?.user) {
        throw new Error('会话建立失败');
      }

      return {
        loginStatus: loginResponse.status,
        sessionData: sessionResponse.data,
        cookieSet: !!this.sessionCookie
      };
    }

    throw new Error(`登录失败: ${loginResponse.status}`);
  }

  async testUserAPI(): Promise<any> {
    const response = await this.api.get('/api/admin/users?page=1&limit=5', {
      headers: { 'Cookie': this.sessionCookie }
    });

    if (response.status !== 200) {
      throw new Error(`用户API失败: ${response.status}`);
    }

    return {
      status: response.status,
      userCount: response.data.data?.users?.length || 0,
      totalUsers: response.data.data?.total || 0
    };
  }

  async testStatsAPI(): Promise<any> {
    const response = await this.api.get('/api/admin/stats', {
      headers: { 'Cookie': this.sessionCookie }
    });

    if (response.status !== 200) {
      throw new Error(`统计API失败: ${response.status}`);
    }

    const data = response.data.data;
    return {
      status: response.status,
      overview: data?.overview,
      hasCharts: !!data?.charts,
      hasLists: !!data?.lists
    };
  }

  async testWorksAPI(): Promise<any> {
    const response = await this.api.get('/api/admin/works?page=1&limit=5', {
      headers: { 'Cookie': this.sessionCookie }
    });

    if (response.status !== 200) {
      throw new Error(`作品API失败: ${response.status}`);
    }

    return {
      status: response.status,
      workCount: response.data.data?.works?.length || 0,
      totalWorks: response.data.data?.total || 0
    };
  }

  async testUnauthorizedAccess(): Promise<any> {
    // 测试未登录访问管理员API
    try {
      await this.api.get('/api/admin/users', {
        headers: { 'Cookie': '' } // 清空cookie
      });
      throw new Error('未授权访问应该被拒绝');
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          status: error.response.status,
          message: '正确拒绝未授权访问'
        };
      }
      throw error;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 开始API测试套件...');
    console.log('==================================================');

    // 运行所有测试
    await this.runTest('数据库连接测试', () => this.testDatabaseConnection());
    await this.runTest('健康检查测试', () => this.testHealthCheck());
    await this.runTest('用户登录测试', () => this.testLogin());
    await this.runTest('用户管理API测试', () => this.testUserAPI());
    await this.runTest('统计API测试', () => this.testStatsAPI());
    await this.runTest('作品管理API测试', () => this.testWorksAPI());
    await this.runTest('未授权访问测试', () => this.testUnauthorizedAccess());

    // 生成测试报告
    await this.generateReport();
  }

  private async generateReport(): Promise<void> {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.suiteStartTime.getTime();
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    const report: TestSuiteResult = {
      suiteName: 'API Test Suite',
      startTime: this.suiteStartTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration,
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      tests: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        baseURL: this.baseURL
      }
    };

    // 保存JSON报告
    const resultsDir = path.join(process.cwd(), 'test_results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(resultsDir, `api-test-report-${timestamp}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // 控制台输出摘要
    console.log('\n==================================================');
    console.log('📊 测试结果摘要:');
    console.log(`总测试数: ${report.totalTests}`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`⏭️  跳过: ${skipped}`);
    console.log(`⏱️  总耗时: ${totalDuration}ms`);
    console.log(`📄 详细报告: ${reportPath}`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.testName}: ${test.error}`);
      });
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// 运行测试套件
const testSuite = new APITestSuite();
testSuite.runAllTests()
  .catch(console.error)
  .finally(() => testSuite.cleanup());