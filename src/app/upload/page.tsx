'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

// 上传配置类型
type UploadConfig = {
  id: string;
  isEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  maxUploadsPerUser: number;
  maxFileSize: number;
  allowedFormats: string[];
  announcement: string | null;
};

// 使用 useSearchParams 的组件
function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    author: '',
    prompt: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingWork, setIsLoadingWork] = useState(false);

  // 获取上传配置
  useEffect(() => {
    fetchUploadConfig();
  }, []);

  // 预加载作品数据（编辑模式）
  useEffect(() => {
    if (isEditMode && editId) {
      fetchWorkData(editId);
    }
  }, [isEditMode, editId]);

  const fetchWorkData = async (workId: string) => {
    setIsLoadingWork(true);
    try {
      const response = await fetch(`/api/works/${workId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const work = result.data;
          // 填充表单数据
          setFormData({
            name: work.name,
            author: work.author,
            prompt: work.prompt || ''
          });
          setImagePreview(work.imageUrl);
        } else {
          throw new Error(result.error || '获取作品数据失败');
        }
      } else {
        throw new Error('获取作品数据失败');
      }
    } catch (error) {
      console.error('加载作品数据失败:', error);
      alert(error instanceof Error ? error.message : '加载作品数据失败，请重试');
      router.push('/profile'); // 加载失败时返回个人中心
    } finally {
      setIsLoadingWork(false);
    }
  };

  const fetchUploadConfig = async () => {
    try {
      const response = await fetch('/api/admin/upload-config');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUploadConfig(result.data);
        }
      }
    } catch (err) {
      console.error('获取上传配置失败:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  // 检查上传权限
  const checkUploadPermission = () => {
    if (!uploadConfig) {
      return { allowed: false, reason: '配置加载中...' };
    }

    if (!uploadConfig.isEnabled) {
      return { allowed: false, reason: '管理员已关闭上传功能' };
    }

    const now = new Date();
    const startTime = uploadConfig.startTime ? new Date(uploadConfig.startTime) : null;
    const endTime = uploadConfig.endTime ? new Date(uploadConfig.endTime) : null;

    if (startTime && now < startTime) {
      return { 
        allowed: false, 
        reason: `上传将于 ${startTime.toLocaleString()} 开始` 
      };
    }

    if (endTime && now > endTime) {
      return { 
        allowed: false, 
        reason: `上传已于 ${endTime.toLocaleString()} 结束` 
      };
    }

    return { allowed: true, reason: null };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小
    if (uploadConfig && file.size > uploadConfig.maxFileSize * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        image: `文件大小不能超过 ${uploadConfig.maxFileSize}MB` 
      }));
      return;
    }

    // 检查文件格式
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (uploadConfig && !uploadConfig.allowedFormats.includes(fileExtension || '')) {
      setErrors(prev => ({ 
        ...prev, 
        image: `只支持以下格式：${uploadConfig.allowedFormats.join(', ')}` 
      }));
      return;
    }

    setImageFile(file);
    setErrors(prev => ({ ...prev, image: '' }));

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
  
    if (!formData.name.trim()) {
      newErrors.name = '作品名称不能为空';
    } else if (formData.name.length > 50) {
      newErrors.name = '作品名称不能超过50个字符';
    }
  
    if (!formData.author.trim()) {
      newErrors.author = '作者名不能为空';
    } else if (formData.author.length > 15) {
      newErrors.author = '作者名不能超过15个字符';
    }
  
    if (formData.prompt && formData.prompt.length > 8000) {
      newErrors.prompt = 'Prompt不能超过8000个字符';
    }
  
    // 修改图片验证逻辑：编辑模式下如果有图片预览就不需要重新选择文件
    if (!imageFile && (!isEditMode || !imagePreview)) {
      newErrors.image = '请选择作品图片';
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    
    try {
      let imageUrl = imagePreview;
      
      // 如果有新选择的图片文件，先上传图片
      if (imageFile) {
        const formDataForImage = new FormData();
        formDataForImage.append('image', imageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataForImage,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || '图片上传失败');
        }
  
        const { data: uploadResult } = await uploadResponse.json();
        imageUrl = uploadResult.imageUrl;
      }
  
      // 提交作品数据
      const url = isEditMode ? `/api/works/${editId}` : '/api/works';
      const method = isEditMode ? 'PUT' : 'POST';
      
      // 构建提交数据：编辑模式和新建模式都提交完整的表单数据
      const submitData = {
        name: formData.name.trim(),
        author: formData.author.trim(),
        prompt: formData.prompt.trim(),
        imageUrl: imageUrl
      };
      
      // 添加调试信息
      console.log('提交数据:', submitData);
      console.log('编辑模式:', isEditMode);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
  
      if (!response.ok) {
        let errorMessage = isEditMode ? '更新失败' : '提交失败';
        
        try {
          const errorData = await response.json();
          console.error('API错误响应:', errorData);
          
          // 检查不同的错误响应格式
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            // 如果错误数据为空对象或其他格式，使用HTTP状态码信息
            errorMessage = `请求失败 (${response.status}: ${response.statusText})`;
          }
        } catch (jsonError) {
          // 如果JSON解析失败，使用HTTP状态码信息
          console.error('解析错误响应失败:', jsonError);
          errorMessage = `请求失败 (${response.status}: ${response.statusText})`;
        }
        
        throw new Error(errorMessage);
      }
  
      // 成功提示
      alert(isEditMode ? '作品已更新，正在重新审核中！' : '作品已提交审核，请耐心等待！');
      router.push(isEditMode ? '/profile' : '/');
    } catch (error) {
      console.error(isEditMode ? '更新失败:' : '提交失败:', error);
      alert(error instanceof Error ? error.message : (isEditMode ? '更新失败，请重试' : '提交失败，请重试'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 加载检查
  if (configLoading || isLoadingWork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" text={isLoadingWork ? '加载作品数据中...' : '加载中...'} />
      </div>
    );
  }

  const permission = checkUploadPermission();
  if (!permission.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">暂时无法上传</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{permission.reason}</p>
          {uploadConfig?.announcement && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📢 {uploadConfig.announcement}
              </p>
            </div>
          )}
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditMode ? '编辑作品' : '上传作品'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? '修改您的作品信息' : '分享您的创意作品，让更多人看到'}
          </p>
          {uploadConfig?.announcement && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                📢 {uploadConfig.announcement}
              </p>
            </div>
          )}
        </div>

        {/* 上传限制提示 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">上传须知：</p>
              <ul className="space-y-1">
                <li>• 文件大小不超过 {uploadConfig ? Math.floor(uploadConfig.maxFileSize / (1024 * 1024)) : 10}MB</li>
                <li>• 支持格式：{uploadConfig?.allowedFormats.join(', ')}</li>
                <li>• 作品提交后即可公开展示</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 上传表单 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 作品图片 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                作品图片 *
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => {
                  if (!imagePreview) {
                    document.getElementById('image-upload')?.click();
                  }
                }}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <Image
                        src={imagePreview}
                        alt="预览"
                        width={300}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('image-upload')?.click();
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      点击重新选择图片
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">
                      点击选择图片或拖拽到此处
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      支持 {uploadConfig?.allowedFormats.join(', ')} 格式，最大 {uploadConfig ? Math.floor(uploadConfig.maxFileSize / (1024 * 1024)) : 10}MB
                    </p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept={uploadConfig?.allowedFormats.map(f => `.${f}`).join(',')}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              {errors.image && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image}</p>
              )}
            </div>

            {/* 作品名称 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                作品名称 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="请输入作品名称（最多50字符）"
              />
              <div className="flex justify-between mt-1">
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {formData.name.length}/50
                </p>
              </div>
            </div>

            {/* 作者名 */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                作者名 *
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="请输入作者名（最多15字符）"
              />
              <div className="flex justify-between mt-1">
                {errors.author && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.author}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {formData.author.length}/15
                </p>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                创作Prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                maxLength={8000}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="如果是AI生成作品，可以分享您使用的Prompt（可选，最多8000字符）"
              />
              <div className="flex justify-between mt-1">
                {errors.prompt && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.prompt}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {formData.prompt.length}/8000
                </p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.push(isEditMode ? '/profile' : '/')}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEditMode ? '更新中...' : '提交中...'}
                  </>
                ) : (
                  isEditMode ? '更新作品' : '提交作品'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 主页面组件
export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <UploadForm />
    </Suspense>
  );
}