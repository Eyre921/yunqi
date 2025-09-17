import { PrismaClient, Work } from '@prisma/client';
import 'dotenv/config';
import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const client = new OSS({
  region: process.env.ALI_OSS_REGION!,
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.ALI_OSS_BUCKET!,
  endpoint: process.env.ALI_OSS_ENDPOINT
});

// 简单的 Content-Type 推断（避免新增依赖）
function guessMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}

// 判断是否是本地路径
function isLocalUrl(u: string | null | undefined): u is string {
  if (!u) return false;
  return u.startsWith('/') || u.startsWith('uploads/') || u.startsWith('images/');
}

// 构造本地真实路径（相对 public）
function resolveLocalPath(imageUrl: string): string {
  const relative = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  return path.join(process.cwd(), 'public', relative);
}

// 生成 OSS Key（确保唯一）
function makeOssKey(work: Work, imageUrl: string): string {
  const base = path.basename(imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl);
  const stamp = Date.now();
  // 分目录有利于管理：works/{work.id}/
  return `works/${work.id}/${stamp}_${base}`;
}

async function migrateToOSS() {
  const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');
  // 可选：是否重写 imageUrl，支持：--rewrite-image-url=oss-url 或 --rewrite-image-url=oss-key
  const rewriteArg = process.argv.find(a => a.startsWith('--rewrite-image-url='));
  const rewriteMode = rewriteArg?.split('=')[1] as 'oss-url' | 'oss-key' | undefined;

  const works = await prisma.work.findMany({
    where: {
      ossKey: null
    }
  });

  let total = 0;
  let skipped = 0;
  let success = 0;
  let failed = 0;

  for (const work of works) {
    total++;

    try {
      if (!isLocalUrl(work.imageUrl)) {
        skipped++;
        console.log(`[跳过] ${work.title} - 非本地URL: ${work.imageUrl}`);
        continue;
      }

      const localPath = resolveLocalPath(work.imageUrl);
      if (!fs.existsSync(localPath)) {
        skipped++;
        console.warn(`[跳过] ${work.title} - 本地文件不存在: ${localPath}`);
        continue;
      }

      const ossKey = makeOssKey(work, work.imageUrl);
      const contentType = guessMime(localPath);
      const fileSizeNumber = fs.statSync(localPath).size;
      const fileSize = BigInt(fileSizeNumber);

      if (DRY_RUN) {
        console.log(`[预演] 将上传 -> ${localPath} 到 OSS: ${ossKey}, Content-Type=${contentType}, fileSize=${fileSize}`);
        console.log(`[预演] 将更新 DB -> id=${work.id}, ossKey/ossUrl/fileSize/mimeType${rewriteMode ? `/imageUrl(${rewriteMode})` : ''}`);
        success++;
        continue;
      }

      // 上传到OSS（直接使用 ali-oss 客户端，带 Content-Type）
      const result = await client.put(ossKey, localPath, {
        headers: { 'Content-Type': contentType }
      });

      // 组装数据库更新数据
      const updateData: Partial<Work> = {
        ossKey,
        ossUrl: result.url,
        fileSize,
        mimeType: contentType,
        imagePath: ossKey // 兼容字段
      };

      // 可选：是否覆盖 imageUrl
      if (rewriteMode === 'oss-url') {
        updateData.imageUrl = result.url;
      } else if (rewriteMode === 'oss-key') {
        // 让前端 getImageUrl(imageUrl) 根据 key 构造完整URL
        updateData.imageUrl = ossKey;
      }

      await prisma.work.update({
        where: { id: work.id },
        data: updateData
      });

      console.log(`[成功] ${work.title} -> OSS: ${ossKey}`);
      success++;
    } catch (error) {
      failed++;
      console.error(`[失败] ${work.title}:`, error);
    }
  }

  console.log(`\n迁移完成：总计=${total}, 成功=${success}, 跳过=${skipped}, 失败=${failed}`);
}

migrateToOSS()
  .catch((e) => {
    console.error('迁移过程异常:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });