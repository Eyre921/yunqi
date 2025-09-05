import { prisma } from '@/lib/prisma';

/**
 * 初始化在线人数配置
 * 如果数据库中不存在配置，则创建默认配置
 */
export async function initOnlineCounterConfig() {
  try {
    // 检查是否已存在配置
    const existingConfig = await prisma.onlineCounterConfig.findFirst();
    
    if (!existingConfig) {
      // 创建默认配置
      const defaultConfig = await prisma.onlineCounterConfig.create({
        data: {
          currentCount: 1075,
          baseCount: 1000,
          maxCount: 2000,
          growthRate: 0.5, // 每分钟增长0.5人
          isEnabled: true,
          displayText: '人正在云栖大会创作',
          lastUpdated: new Date()
        }
      });
      
      console.log('在线人数配置初始化完成:', defaultConfig);
      return defaultConfig;
    }
    
    return existingConfig;
  } catch (error) {
    console.error('初始化在线人数配置失败:', error);
    throw error;
  }
}

/**
 * 获取或创建在线人数配置
 */
export async function getOrCreateOnlineCounterConfig() {
  try {
    let config = await prisma.onlineCounterConfig.findFirst();
    
    if (!config) {
      config = await initOnlineCounterConfig();
    }
    
    return config;
  } catch (error) {
    console.error('获取在线人数配置失败:', error);
    throw error;
  }
}