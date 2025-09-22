import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToOSS } from '@/lib/oss';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证用户登录（允许游客，无需强制校验）
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

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

    // 上传数量限制检查移至 /api/works 中进行

    // 上传到OSS（开启唯一命名，避免同名覆盖）
    const uploadResult = await uploadToOSS(file, file.name, {
      headers: {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'public-read', // 确保文件可公开读取
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=31536000',
        'x-oss-tagging': `userId=${userId ?? 'guest'}&uploadTime=${Date.now()}`
      },
      folder: 'works',
      generateUniqueName: true
    });

    // 只返回上传结果，不创建作品记录
    return NextResponse.json({
      success: true,
      data: {
        imageUrl: uploadResult.url,
        ossKey: uploadResult.name,
        fileSize: uploadResult.size || file.size,
        mimeType: file.type
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