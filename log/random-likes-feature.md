# 作品审核随机点赞数功能总结

## 功能需求
在作品审核通过时，为新作品自动赋予10-50之间的随机初始点赞数。

## 实现方案
修改 `src/app/api/admin/works/[id]/route.ts` 文件中的作品审核逻辑：

```typescript
// 在作品首次被批准时添加随机点赞数
if (status === 'APPROVED' && existingWork.status !== 'APPROVED') {
  // 生成10-50之间的随机点赞数
  const randomLikes = Math.floor(Math.random() * 41) + 10;
  
  updateData.likes = randomLikes;
}

const updatedWork = await prisma.work.update({
  where: { id },
  data: updateData
});
```

## 技术细节
- 只在作品首次从其他状态变为 `APPROVED` 时添加随机点赞数
- 随机数范围：10-50
- 使用 `Math.floor(Math.random() * 41) + 10` 生成随机数
- 避免重复审核时重置点赞数

## 业务逻辑
1. 检查作品当前状态是否不是 `APPROVED`
2. 检查新状态是否为 `APPROVED`
3. 满足条件时生成随机点赞数
4. 更新作品数据

## 状态
✅ 已完成