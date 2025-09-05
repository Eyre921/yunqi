import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 支持的文件类型
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: '请先登录'
      }, { status: 401 });
    }

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: '请选择文件'
      }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
      return NextResponse.json({
        success: false,
        error: '不支持的文件格式，请上传 JPG、PNG、GIF 或 WebP 格式的图片'
      }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: '文件大小不能超过 10MB'
      }, { status: 400 });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    const fileName = `${timestamp}_${randomStr}.${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'images');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存文件
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // 返回文件URL
    const imageUrl = `/images/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        fileName,
        fileSize: file.size,
        fileType: file.type
      },
      message: '文件上传成功'
    }, { status: 200 });

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json({
      success: false,
      error: '文件上传失败',
      code: 'UPLOAD_ERROR'
    }, { status: 500 });
  }
}