'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ThemeToggle from '@/components/ThemeToggle';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import type { UserWork, WorksData } from '@/types/work';

import { getImageUrl } from '@/lib/image-url';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    works: number;
  };
}

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ApiResponse {
  success: boolean;
  data?: UserProfile;
  message?: string;
  error?: string;
  details?: any[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // 作品管理相关状态
  const [works, setWorks] = useState<UserWork[]>([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [worksError, setWorksError] = useState('');
  const [selectedWork, setSelectedWork] = useState<UserWork | null>(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'works'>('profile');
  
  const { loading, error, execute } = useApi<UserProfile>();
  const { execute: executeWorks } = useApi<WorksData>();

  // 检查认证状态
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }
  }, [session, status, router]);

  // 加载用户信息和作品
  useEffect(() => {
    if (session?.user) {
      loadProfile();
      loadUserWorks();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      const response = await execute('/api/user/profile');
      if (response?.success && response.data) {
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  };

  // 加载用户作品
  // 修复 loadUserWorks 函数
  const loadUserWorks = async () => {
    setWorksLoading(true);
    setWorksError('');
    try {
      const response = await executeWorks('/api/user/works');
      if (response?.success && response.data?.works) {
        // 确保 works 是数组，处理用户没有作品的情况
        const worksArray = Array.isArray(response.data.works) ? response.data.works : [];
        setWorks(worksArray);
      } else {
        // 用户没有作品或请求失败
        setWorks([]);
        setWorksError(response?.error || '暂无作品数据');
      }
    } catch (err) {
      console.error('加载用户作品失败:', err);
      setWorks([]); // 确保 works 始终是数组
      setWorksError('网络错误，请稍后重试');
    } finally {
      setWorksLoading(false);
    }
  };

  // 删除作品
  const handleDeleteWork = async (workId: string) => {
    if (!confirm('确定要删除这个作品吗？此操作不可撤销。')) {
      return;
    }
  
    try {
      const response = await executeWorks(`/api/user/works/${workId}`, {
        method: 'DELETE'
      });
      
      if (response?.success) {
        setWorks(prev => prev.filter(work => work.id !== workId));
        if (profile) {
          setProfile(prev => prev ? {
            ...prev,
            _count: { works: prev._count.works - 1 }
          } : null);
        }
        toast.success('作品删除成功');
      } else {
        toast.error(response?.error || '删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除作品失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  // 查看作品详情
  const handleViewWork = (work: UserWork) => {
    setSelectedWork(work);
    setShowWorkModal(true);
  };

  // 获取状态显示文本和样式
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: '待审核', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
      case 'APPROVED':
        return { text: '已通过', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
      case 'REJECTED':
        return { text: '已拒绝', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name as keyof ProfileFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setSubmitError('');
    setSubmitSuccess('');
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    } else if (formData.name.length > 50) {
      newErrors.name = '姓名不能超过50个字符';
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 如果要修改密码
    if (showPasswordFields || formData.newPassword || formData.confirmNewPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = '请输入当前密码';
      }

      if (!formData.newPassword) {
        newErrors.newPassword = '请输入新密码';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = '新密码至少6位';
      } else if (formData.newPassword.length > 100) {
        newErrors.newPassword = '新密码不能超过100个字符';
      }

      if (!formData.confirmNewPassword) {
        newErrors.confirmNewPassword = '请确认新密码';
      } else if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = '两次输入的新密码不一致';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email
      };

      // 如果要修改密码
      if (showPasswordFields && formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
        updateData.confirmNewPassword = formData.confirmNewPassword;
      }

      const response = await execute('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response?.success && response.data) {
        setSubmitSuccess('个人信息更新成功');
        setProfile(response.data);
        
        // 清空密码字段
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
        setShowPasswordFields(false);
        
        // 3秒后清除成功消息
        setTimeout(() => setSubmitSuccess(''), 3000);
      } else {
        setSubmitError(response?.error || '更新失败，请稍后重试');
        
        // 处理字段验证错误
        if (response?.details && Array.isArray(response.details)) {
          const fieldErrors: Partial<ProfileFormData> = {};
          response.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              const fieldName = detail.path[0] as keyof ProfileFormData;
              fieldErrors[fieldName] = detail.message;
            }
          });
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      setSubmitError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 使用统一的顶栏组件 */}
      <Header 
        pageTitle="个人中心"
        showBackButton={true}
        backUrl="/"
        backText="返回首页"
      />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {/* 标签页导航 */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                个人信息
              </button>
              <button
                onClick={() => setActiveTab('works')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'works'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                我的作品 {profile && `(${profile._count.works})`}
              </button>
            </nav>
          </div>

          {error && (
            <div className="p-6">
              <ErrorMessage message={error} onRetry={loadProfile} />
            </div>
          )}

          {profile && (
            <div className="p-6">
              {activeTab === 'profile' && (
                <>
                  {/* 用户统计信息 */}
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {profile._count.works}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        上传作品数
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {profile.role === 'ADMIN' ? '管理员' : '普通用户'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        账户类型
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        注册时间
                      </div>
                    </div>
                  </div>

                  {/* 个人信息表单 */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... existing form code ... */}
                  </form>
                </>
              )}

              {activeTab === 'works' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      我的作品
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      管理您上传的所有作品
                    </p>
                  </div>

                  {worksError && (
                    <div className="mb-6">
                      <ErrorMessage message={worksError} onRetry={loadUserWorks} />
                    </div>
                  )}

                  {worksLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  // 修复第442行的条件判断，添加安全检查
                  ) : (works && works.length === 0) ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 dark:text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L10 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        还没有上传作品
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        开始创作并分享您的第一个作品吧！
                      </p>
                      <button
                        onClick={() => router.push('/upload')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        上传作品
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {works.map((work) => {
                        const statusDisplay = getStatusDisplay(work.status);
                        return (
                          <div key={work.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative aspect-video">
                              <Image
                                // 示例：src={getImageUrl(work.imageUrl)}
                                src={getImageUrl(work.imageUrl)}
                                alt={work.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              {work.featured && (
                                <div className="absolute top-2 left-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                    ⭐ 精选
                                  </span>
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                                  {statusDisplay.text}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                {work.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                作者：{work.author}
                              </p>
                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                                <span>作者：{work.author}</span>
                                <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <div className="flex items-center space-x-4">
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    {work.likeCount}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    {work.viewCount}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewWork(work)}
                                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                >
                                  查看详情
                                </button>
                                <button
                                  onClick={() => router.push(`/upload?edit=${work.id}`)}
                                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDeleteWork(work.id)}
                                  className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 作品详情弹窗 */}
      {showWorkModal && selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedWork.name}
                </h2>
                <button
                  onClick={() => setShowWorkModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative aspect-video">
                  <Image
                    src={selectedWork.imageUrl}
                    alt={selectedWork.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      作品信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">作品名称：</span>
                        <span className="text-gray-900 dark:text-white">{selectedWork.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">作者：</span>
                        <span className="text-gray-900 dark:text-white">{selectedWork.author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">状态：</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusDisplay(selectedWork.status).className}`}>
                          {getStatusDisplay(selectedWork.status).text}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">创建时间：</span>
                        <span className="text-gray-900 dark:text-white">{new Date(selectedWork.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">点赞数：</span>
                        <span className="text-gray-900 dark:text-white">{selectedWork.likeCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">浏览数：</span>
                        <span className="text-gray-900 dark:text-white">{selectedWork.viewCount}</span>
                      </div>
                    </div>
                  </div>
                  

                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowWorkModal(false);
                        router.push(`/upload?edit=${selectedWork.id}`);
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      编辑作品
                    </button>
                    <button
                      onClick={() => {
                        setShowWorkModal(false);
                        handleDeleteWork(selectedWork.id);
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    >
                      删除作品
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}