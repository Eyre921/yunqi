// 仅包含前端可用的纯字符串处理逻辑，不引入 ali-oss

export function getImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return '/images/placeholder.jpg';
  }

  // 1. 完整的HTTP/HTTPS URL（包括Cloudinary、OSS等）
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 2. 本地绝对路径（以/开头）
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // 3. 兼容旧的uploads路径格式
  if (imageUrl.startsWith('uploads/')) {
    return `/${imageUrl}`;
  }

  // 4. 兼容public/images路径格式
  if (imageUrl.startsWith('images/')) {
    return `/${imageUrl}`;
  }

  // 5. 兼容Cloudinary格式（res.cloudinary.com）
  if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary')) {
    return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
  }

  // 6. OSS格式处理
  const ossEndpoint = process.env.NEXT_PUBLIC_ALI_OSS_ENDPOINT || process.env.ALI_OSS_ENDPOINT;
  const ossBucket = process.env.NEXT_PUBLIC_ALI_OSS_BUCKET || process.env.ALI_OSS_BUCKET;

  if (ossEndpoint && ossBucket) {
    // 如果已经是OSS URL格式，直接返回
    if (imageUrl.includes(ossBucket) && imageUrl.includes(ossEndpoint)) {
      return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
    }
    
    // 构造OSS URL
    return `https://${ossBucket}.${ossEndpoint}/${imageUrl}`;
  }

  // 7. 兜底处理：如果都不匹配，尝试作为相对路径处理
  console.warn('未识别的图片URL格式，使用相对路径处理:', imageUrl);
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
}

export function extractOSSKey(fullUrl: string): string {
  if (!fullUrl) return '';

  // 本地路径直接返回
  if (fullUrl.startsWith('/')) return fullUrl;

  // 提取OSS key
  const ossBucket = process.env.NEXT_PUBLIC_ALI_OSS_BUCKET || process.env.ALI_OSS_BUCKET;
  if (ossBucket && fullUrl.includes(`${ossBucket}.`)) {
    const urlParts = fullUrl.split('/');
    return urlParts.slice(3).join('/');
  }

  // Cloudinary URL处理
  if (fullUrl.includes('cloudinary.com')) {
    const match = fullUrl.match(/\/v\d+\/(.+)$/);
    return match ? match[1] : fullUrl;
  }

  return fullUrl;
}

export function isOSSUrl(imageUrl: string): boolean {
  if (!imageUrl) return false;
  const ossBucket = process.env.NEXT_PUBLIC_ALI_OSS_BUCKET || process.env.ALI_OSS_BUCKET;
  return ossBucket ? imageUrl.includes(`${ossBucket}.`) : false;
}

export function isCloudinaryUrl(imageUrl: string): boolean {
  if (!imageUrl) return false;
  return imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary');
}

export function isLocalUrl(imageUrl: string): boolean {
  if (!imageUrl) return false;
  return imageUrl.startsWith('/') || imageUrl.startsWith('uploads/') || imageUrl.startsWith('images/');
}

// 获取图片类型
export function getImageType(imageUrl: string): 'oss' | 'cloudinary' | 'local' | 'external' {
  if (isOSSUrl(imageUrl)) return 'oss';
  if (isCloudinaryUrl(imageUrl)) return 'cloudinary';
  if (isLocalUrl(imageUrl)) return 'local';
  return 'external';
}