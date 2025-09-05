# 在线人数计数器组件问题总结

## 问题描述
用户要求在主页添加一个模拟在线人数计数器组件，显示"xxx人正在云栖大会创作"，并要求作为占据整行页面的大横幅显示在顶栏位置。

## 解决方案

### 1. 创建 OnlineCounter 组件
- 位置：`src/components/OnlineCounter.tsx`
- 功能：从基数1024开始，每10秒随机增加1-5人
- 样式：橙红色渐变背景，包含火箭emoji和动画效果

### 2. 组件集成
- 初始位置：在 `page.tsx` 中的 Header 下方
- 最终位置：集成到 `Header.tsx` 组件中，作为紧接着顶栏的大横幅
- 修复：解决了页面出现两个横幅的问题（移除了 page.tsx 中的重复引用）

### 3. 技术实现
```typescript
// 核心逻辑
const [onlineCount, setOnlineCount] = useState(1024);

useEffect(() => {
  const interval = setInterval(() => {
    setOnlineCount(prev => prev + Math.floor(Math.random() * 5) + 1);
  }, 10000);
  return () => clearInterval(interval);
}, []);
```

## 状态
✅ 已完成