const { performance } = require('perf_hooks');
const http = require('http');
const cluster = require('cluster');
const os = require('os');

/**
 * 性能测试脚本
 * 用于验证服务器优化效果
 */

class PerformanceTester {
  constructor() {
    this.results = {
      requests: 0,
      responses: 0,
      errors: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      responseTimes: []
    };
  }

  /**
   * 发送HTTP请求并测量响应时间
   */
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      const req = http.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          this.results.responses++;
          this.results.totalTime += responseTime;
          this.results.responseTimes.push(responseTime);
          
          if (responseTime < this.results.minTime) {
            this.results.minTime = responseTime;
          }
          if (responseTime > this.results.maxTime) {
            this.results.maxTime = responseTime;
          }
          
          resolve({
            statusCode: res.statusCode,
            responseTime,
            dataLength: data.length
          });
        });
      });
      
      req.on('error', (err) => {
        this.results.errors++;
        reject(err);
      });
      
      req.setTimeout(30000, () => {
        this.results.errors++;
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      this.results.requests++;
      req.end();
    });
  }

  /**
   * 并发测试
   */
  async concurrentTest(url, concurrency = 10, totalRequests = 100) {
    console.log(`🚀 开始并发测试: ${concurrency} 并发, ${totalRequests} 总请求`);
    console.log(`📍 目标URL: ${url}`);
    console.log('');
    
    const startTime = performance.now();
    const promises = [];
    const requestsPerWorker = Math.ceil(totalRequests / concurrency);
    
    for (let i = 0; i < concurrency; i++) {
      const workerPromises = [];
      
      for (let j = 0; j < requestsPerWorker && (i * requestsPerWorker + j) < totalRequests; j++) {
        workerPromises.push(
          this.makeRequest(url).catch(err => {
            console.error(`❌ 请求失败: ${err.message}`);
            return { error: err.message };
          })
        );
      }
      
      promises.push(Promise.all(workerPromises));
    }
    
    await Promise.all(promises);
    
    const endTime = performance.now();
    const totalTestTime = endTime - startTime;
    
    return this.generateReport(totalTestTime);
  }

  /**
   * 生成测试报告
   */
  generateReport(totalTestTime) {
    const avgResponseTime = this.results.totalTime / this.results.responses;
    const successRate = (this.results.responses / this.results.requests) * 100;
    const requestsPerSecond = (this.results.responses / totalTestTime) * 1000;
    
    // 计算百分位数
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedTimes, 50);
    const p90 = this.getPercentile(sortedTimes, 90);
    const p95 = this.getPercentile(sortedTimes, 95);
    const p99 = this.getPercentile(sortedTimes, 99);
    
    const report = {
      summary: {
        totalRequests: this.results.requests,
        successfulResponses: this.results.responses,
        failedRequests: this.results.errors,
        successRate: successRate.toFixed(2) + '%',
        totalTestTime: (totalTestTime / 1000).toFixed(2) + 's',
        requestsPerSecond: requestsPerSecond.toFixed(2)
      },
      responseTime: {
        average: avgResponseTime.toFixed(2) + 'ms',
        minimum: this.results.minTime.toFixed(2) + 'ms',
        maximum: this.results.maxTime.toFixed(2) + 'ms',
        p50: p50.toFixed(2) + 'ms',
        p90: p90.toFixed(2) + 'ms',
        p95: p95.toFixed(2) + 'ms',
        p99: p99.toFixed(2) + 'ms'
      }
    };
    
    this.printReport(report);
    return report;
  }

  /**
   * 计算百分位数
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }

  /**
   * 打印测试报告
   */
  printReport(report) {
    console.log('');
    console.log('📊 ===== 性能测试报告 =====');
    console.log('');
    
    console.log('📈 请求统计:');
    console.log(`   总请求数: ${report.summary.totalRequests}`);
    console.log(`   成功响应: ${report.summary.successfulResponses}`);
    console.log(`   失败请求: ${report.summary.failedRequests}`);
    console.log(`   成功率: ${report.summary.successRate}`);
    console.log(`   测试时长: ${report.summary.totalTestTime}`);
    console.log(`   QPS: ${report.summary.requestsPerSecond}`);
    console.log('');
    
    console.log('⏱️  响应时间:');
    console.log(`   平均响应时间: ${report.responseTime.average}`);
    console.log(`   最小响应时间: ${report.responseTime.minimum}`);
    console.log(`   最大响应时间: ${report.responseTime.maximum}`);
    console.log(`   50%百分位: ${report.responseTime.p50}`);
    console.log(`   90%百分位: ${report.responseTime.p90}`);
    console.log(`   95%百分位: ${report.responseTime.p95}`);
    console.log(`   99%百分位: ${report.responseTime.p99}`);
    console.log('');
    
    // 性能评估
    const avgTime = parseFloat(report.responseTime.average);
    const qps = parseFloat(report.summary.requestsPerSecond);
    
    console.log('🎯 性能评估:');
    if (avgTime < 100) {
      console.log('   响应时间: ✅ 优秀 (< 100ms)');
    } else if (avgTime < 500) {
      console.log('   响应时间: ⚠️  良好 (100-500ms)');
    } else {
      console.log('   响应时间: ❌ 需要优化 (> 500ms)');
    }
    
    if (qps > 100) {
      console.log('   吞吐量: ✅ 优秀 (> 100 QPS)');
    } else if (qps > 50) {
      console.log('   吞吐量: ⚠️  良好 (50-100 QPS)');
    } else {
      console.log('   吞吐量: ❌ 需要优化 (< 50 QPS)');
    }
    
    const successRate = parseFloat(report.summary.successRate);
    if (successRate > 99) {
      console.log('   稳定性: ✅ 优秀 (> 99%)');
    } else if (successRate > 95) {
      console.log('   稳定性: ⚠️  良好 (95-99%)');
    } else {
      console.log('   稳定性: ❌ 需要优化 (< 95%)');
    }
    
    console.log('');
  }

  /**
   * 系统资源监控
   */
  getSystemInfo() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem * 100).toFixed(2);
    
    console.log('💻 系统信息:');
    console.log(`   CPU核心数: ${cpus.length}`);
    console.log(`   CPU型号: ${cpus[0].model}`);
    console.log(`   总内存: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   已用内存: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${memUsage}%)`);
    console.log(`   可用内存: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   系统平台: ${os.platform()}`);
    console.log(`   系统架构: ${os.arch()}`);
    console.log('');
  }
}

/**
 * 主测试函数
 */
async function runPerformanceTest() {
  const tester = new PerformanceTester();
  
  // 显示系统信息
  tester.getSystemInfo();
  
  // 测试配置
  const testUrl = process.env.TEST_URL || 'http://localhost:3000';
  const concurrency = parseInt(process.env.CONCURRENCY) || 20;
  const totalRequests = parseInt(process.env.TOTAL_REQUESTS) || 200;
  
  console.log('🔧 测试配置:');
  console.log(`   测试URL: ${testUrl}`);
  console.log(`   并发数: ${concurrency}`);
  console.log(`   总请求数: ${totalRequests}`);
  console.log('');
  
  try {
    // 预热测试
    console.log('🔥 预热测试...');
    await tester.makeRequest(testUrl);
    console.log('✅ 预热完成');
    console.log('');
    
    // 重置统计
    tester.results = {
      requests: 0,
      responses: 0,
      errors: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      responseTimes: []
    };
    
    // 开始正式测试
    await tester.concurrentTest(testUrl, concurrency, totalRequests);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

/**
 * 压力测试
 */
async function runStressTest() {
  console.log('🔥 ===== 压力测试 =====');
  console.log('');
  
  const testUrl = process.env.TEST_URL || 'http://localhost:3000';
  const stages = [
    { concurrency: 10, requests: 100, name: '轻负载测试' },
    { concurrency: 50, requests: 500, name: '中等负载测试' },
    { concurrency: 100, requests: 1000, name: '高负载测试' },
    { concurrency: 200, requests: 2000, name: '极限负载测试' }
  ];
  
  for (const stage of stages) {
    console.log(`🎯 ${stage.name} (${stage.concurrency}并发, ${stage.requests}请求)`);
    
    const tester = new PerformanceTester();
    
    try {
      await tester.concurrentTest(testUrl, stage.concurrency, stage.requests);
      
      // 等待一段时间再进行下一阶段测试
      console.log('⏳ 等待5秒后进行下一阶段测试...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ ${stage.name}失败:`, error.message);
      break;
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0] || 'test';

switch (command) {
  case 'test':
    runPerformanceTest();
    break;
  case 'stress':
    runStressTest();
    break;
  default:
    console.log('使用方法:');
    console.log('  node performance-test.js test    # 基础性能测试');
    console.log('  node performance-test.js stress  # 压力测试');
    console.log('');
    console.log('环境变量:');
    console.log('  TEST_URL=http://localhost:3000   # 测试URL');
    console.log('  CONCURRENCY=20                   # 并发数');
    console.log('  TOTAL_REQUESTS=200               # 总请求数');
    break;
}

module.exports = PerformanceTester;