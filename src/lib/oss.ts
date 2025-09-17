// 顶部（确保没有 'use server' 指令）
import 'server-only';
import OSS from 'ali-oss';

// 扩展类型定义
interface ExtendedPutObjectResult {
  name: string;
  url: string;
  etag?: string;
  size?: number;
  headers?: Record<string, string>;
}

interface OSSHeaders {
  'x-oss-storage-class'?: 'Standard' | 'IA' | 'Archive' | 'ColdArchive';
  'x-oss-object-acl'?: 'private' | 'public-read' | 'public-read-write';
  'Content-Disposition'?: string;
  'x-oss-tagging'?: string;
  'Cache-Control'?: string;
  'Content-Type'?: string;
}

interface OSSHeadResult {
  status: number;
  meta: {
    size: number;
    lastModified: string;
    etag: string;
    contentType: string;
    storageClass?: string;
  };
  headers: Record<string, string>;
}

// OSS客户端配置
const ossClient = new OSS({
  region: process.env.ALI_OSS_REGION!,
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.ALI_OSS_BUCKET!,
  endpoint: process.env.ALI_OSS_ENDPOINT
});

/**
 * 上传文件到OSS（增强版）
 * @param file 文件对象或Buffer
 * @param fileName 文件名（包含路径）
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadToOSS(
  file: Buffer | File, 
  fileName: string,
  options?: {
    headers?: OSSHeaders;
    generateUniqueName?: boolean;
    folder?: string;
  }
): Promise<ExtendedPutObjectResult> {
  try {
    let fileBuffer: Buffer;
    let fileSize: number;
    
    // 处理不同类型的文件输入
    if (file instanceof File) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileSize = file.size;
    } else {
      fileBuffer = file;
      fileSize = file.length;
    }
    
    // 生成唯一文件名（如果需要）
    let finalFileName = fileName;
    if (options?.generateUniqueName) {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = fileName.split('.').pop();
      finalFileName = `${timestamp}_${randomStr}.${ext}`;
    }
    
    // 添加文件夹前缀
    if (options?.folder) {
      finalFileName = `${options.folder}/${finalFileName}`;
    }
    
    // 上传到OSS
    const result = await ossClient.put(finalFileName, fileBuffer, {
      headers: options?.headers || {}
    });
    
    // 从响应头提取 etag，并返回标准化的 headers（避免访问不存在的 result.etag / result.headers）
    const resHeaders = result.res?.headers as Record<string, string> | undefined;
    const etag = resHeaders?.etag ?? resHeaders?.ETag;
    
    return {
      name: result.name,
      url: result.url,
      etag,
      size: fileSize,
      headers: resHeaders
    };
  } catch (error) {
    console.error('OSS上传失败:', error);
    throw new Error(`OSS上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 从OSS删除文件
 * @param fileName 文件名
 * @returns 删除结果
 */
export async function deleteFromOSS(fileName: string): Promise<{ success: boolean }> {
  try {
    await ossClient.delete(fileName);
    return { success: true };
  } catch (error) {
    console.error('OSS删除失败:', error);
    throw new Error(`OSS删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量删除OSS文件
 * @param fileNames 文件名数组
 * @returns 删除结果
 */
export async function deleteMultipleFromOSS(fileNames: string[]): Promise<{ success: boolean; deleted: string[]; errors: string[] }> {
  try {
    const result = await ossClient.deleteMulti(fileNames, {
      quiet: false
    });
    
    // 关键修复：类型里没有 errors 字段，使用差集推导失败项，避免依赖未定义的字段
    const deleted = result.deleted ?? [];
    const errors = fileNames.filter(name => !deleted.includes(name));
    
    return {
      success: true,
      deleted,
      errors
    };
  } catch (error) {
    console.error('OSS批量删除失败:', error);
    throw new Error(`OSS批量删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取OSS对象信息
 * @param fileName 文件名
 * @returns 对象信息
 */
export async function getObjectInfo(fileName: string): Promise<OSSHeadResult> {
  try {
    const result = await ossClient.head(fileName);

    // 归一化 headers，避免为 undefined
    const headers = (result.res?.headers ?? {}) as Record<string, string>;

    // 归一化 size: string | number -> number
    const rawSize = (result.meta as { size?: string | number })?.size;
    const size = typeof rawSize === 'string'
      ? Number(rawSize)
      : (typeof rawSize === 'number' ? rawSize : 0);

    // 新增：归一化 storageClass: string | number -> string | undefined
    const storageClassRaw = (result.meta as { storageClass?: string | number })?.storageClass;
    const storageClass = typeof storageClassRaw === 'undefined' ? undefined : String(storageClassRaw);

    return {
      status: result.status,
      meta: {
        size,
        lastModified: String(result.meta?.lastModified ?? ''),
        etag: String(result.meta?.etag ?? ''),
        contentType: String(result.meta?.contentType ?? ''),
        storageClass
      },
      headers
    };
  } catch (error) {
    console.error('获取OSS对象信息失败:', error);
    throw new Error(`获取OSS对象信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取OSS文件的签名URL
 * @param fileName 文件名
 * @param expires 过期时间（秒）
 * @returns 签名URL
 */
export async function getSignedUrl(fileName: string, expires: number = 3600): Promise<string> {
  try {
    const url = ossClient.signatureUrl(fileName, { expires });
    return url;
  } catch (error) {
    console.error('获取OSS签名URL失败:', error);
    throw new Error(`获取OSS签名URL失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 列出OSS对象
 * @param options 列表选项
 * @returns 对象列表
 */
export async function listObjects(options?: {
  prefix?: string;
  maxKeys?: number;
  marker?: string;
}) {
  try {
    // 关键修复：补充第二个 options 参数（即使为空对象）
    const result = await ossClient.list(
      {
        prefix: options?.prefix,
        'max-keys': options?.maxKeys ?? 100,
        marker: options?.marker
      },
      {} // 必传：RequestOptions
    );
    
    return {
      objects: result.objects ?? [],
      prefixes: result.prefixes ?? [],
      nextMarker: result.nextMarker,
      isTruncated: result.isTruncated
    };
  } catch (error) {
    console.error('列出OSS对象失败:', error);
    throw new Error(`列出OSS对象失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 复制OSS对象
 * @param sourceKey 源文件键名
 * @param targetKey 目标文件键名
 * @returns 复制结果
 */
export async function copyObject(sourceKey: string, targetKey: string) {
  try {
    const result = await ossClient.copy(targetKey, sourceKey);
    return result;
  } catch (error) {
    console.error('OSS对象复制失败:', error);
    throw new Error(`OSS对象复制失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 检查OSS对象是否存在
 * @param fileName 文件名
 * @returns 是否存在
 */
export async function objectExists(fileName: string): Promise<boolean> {
  try {
    await ossClient.head(fileName);
    return true;
  } catch (error) {
    // 关键修复：避免使用 any，使用类型收窄读取 code
    const e = error as { code?: string };
    if (e?.code === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * 获取下载URL（带文件名）
 * @param fileName OSS文件键名
 * @param downloadName 下载时的文件名
 * @param expires 过期时间（秒）
 * @returns 下载URL
 */
export async function getDownloadUrl(fileName: string, downloadName?: string, expires: number = 3600): Promise<string> {
  try {
    // 关键修复：为 signatureUrl 入参提供明确的类型结构，避免 any
    const params: { expires: number; response?: { 'content-disposition': string } } = { expires };
    
    if (downloadName) {
      params.response = {
        'content-disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`
      };
    }
    
    const url = ossClient.signatureUrl(fileName, params);
    return url;
  } catch (error) {
    console.error('获取OSS下载URL失败:', error);
    throw new Error(`获取OSS下载URL失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

export { ossClient };