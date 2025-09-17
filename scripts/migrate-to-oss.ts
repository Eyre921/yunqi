import { PrismaClient } from '@prisma/client';
import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const client = new OSS({
  region: process.env.OSS_REGION!,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
});

async function migrateToOSS() {
  const works = await prisma.work.findMany({
    where: {
      ossKey: null, // 只迁移还未上传到OSS的文件
    },
  });

  for (const work of works) {
    try {
      const localPath = path.join(process.cwd(), 'public', work.imageUrl);
      if (fs.existsSync(localPath)) {
        const ossKey = `works/${Date.now()}_${path.basename(work.imageUrl)}`;
        
        // 上传到OSS
        const result = await client.put(ossKey, localPath);
        
        // 更新数据库
        await prisma.work.update({
          where: { id: work.id },
          data: {
            ossKey: ossKey,
            ossUrl: result.url,
            fileSize: fs.statSync(localPath).size,
            mimeType: 'image/jpeg', // 根据实际文件类型设置
          },
        });
        
        console.log(`迁移成功: ${work.title}`);
      }
    } catch (error) {
      console.error(`迁移失败: ${work.title}`, error);
    }
  }
}

migrateToOSS().catch(console.error);