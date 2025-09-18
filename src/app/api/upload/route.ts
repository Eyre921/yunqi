import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToOSS } from '@/lib/oss';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证用户登录
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 获取上传配置
    const uploadConfig = await prisma.uploadConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!uploadConfig) {
      return NextResponse.json({
        success: false,
        error: '上传配置未找到',
        code: 'CONFIG_NOT_FOUND'
      }, { status: 500 });
    }

    // 检查上传功能是否开启
    if (!uploadConfig.isEnabled) {
      return NextResponse.json({
        success: false,
        error: '管理员已关闭上传功能',
        code: 'UPLOAD_DISABLED'
      }, { status: 403 });
    }

    // 检查时间窗口
    const now = new Date();
    if (uploadConfig.startTime && now < new Date(uploadConfig.startTime)) {
      return NextResponse.json({
        success: false,
        error: `上传将于 ${new Date(uploadConfig.startTime).toLocaleString()} 开始`,
        code: 'UPLOAD_NOT_STARTED'
      }, { status: 403 });
    }

    if (uploadConfig.endTime && now > new Date(uploadConfig.endTime)) {
      return NextResponse.json({
        success: false,
        error: `上传已于 ${new Date(uploadConfig.endTime).toLocaleString()} 结束`,
        code: 'UPLOAD_ENDED'
      }, { status: 403 });
    }

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择文件' },
        { status: 400 }
      );
    }

    // 文件类型验证
    const allowedTypes = uploadConfig.allowedFormats.map(format => `image/${format === 'jpg' ? 'jpeg' : format}`);
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `不支持的文件类型，仅支持：${uploadConfig.allowedFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // 文件大小验证
    if (file.size > uploadConfig.maxFileSize) {
      const maxSizeMB = Math.floor(uploadConfig.maxFileSize / (1024 * 1024));
      return NextResponse.json(
        { success: false, error: `文件大小不能超过${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // 检查用户上传数量限制
    const userUploadCount = await prisma.work.count({
      where: { userId: session.user.id }
    });

    if (userUploadCount >= uploadConfig.maxUploadsPerUser) {
      return NextResponse.json({
        success: false,
        error: `每个用户最多只能上传${uploadConfig.maxUploadsPerUser}个作品`,
        code: 'UPLOAD_LIMIT_EXCEEDED'
      }, { status: 403 });
    }

    // 上传到OSS（使用增强功能）
    const uploadResult = await uploadToOSS(file, file.name, {
      headers: {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'public-read', // 确保文件可公开读取
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000', // 添加缓存控制
        'x-oss-tagging': `userId=${session.user.id}&uploadTime=${Date.now()}`
      },
      folder: 'works'
    });

    // 保存到数据库
    const work = await prisma.work.create({
      data: {
        name: title || '未命名作品',
        title: title || '未命名作品',
        description: description || '',
        author: session.user.name || session.user.email || '匿名用户',
        imageUrl: uploadResult.url,
        imagePath: uploadResult.name,
        ossKey: uploadResult.name,
        ossUrl: uploadResult.url,
        fileSize: BigInt(uploadResult.size || file.size),
        mimeType: file.type,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: work.id,
        title: work.title,
        imageUrl: work.imageUrl,
        ossKey: work.ossKey,
        message: '上传成功'
      }
    });

  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { success: false, error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}