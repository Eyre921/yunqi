import { Work, WorkStatus } from '@prisma/client';

// 扩展 Work 类型以包含用户信息
export type WorkWithUser = Work & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

// 用户作品类型（用于个人中心）
export interface UserWork {
  id: string;
  name: string;
  author: string;
  imageUrl: string;
  status: WorkStatus;
  featured: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// 作品响应数据类型
export interface WorksResponse {
  works: WorkWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// 用户作品数据类型
export interface WorksData {
  works: UserWork[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 上传配置类型
export interface UploadConfig {
  id: string;
  isEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  maxUploadsPerUser: number;
  maxFileSize: number;
  allowedFormats: string[];
  announcement: string | null;
  createdAt: string;
}

// 排序类型
export type SortBy = 'createdAt' | 'approvedAt' | 'likeCount' | 'viewCount';
export type SortOrder = 'asc' | 'desc';

// 组件 Props 类型
export interface WorkCardProps {
  work: WorkWithUser;
  onClick?: () => void;
  onLike?: () => void;
}

export interface WorkModalProps {
  work: WorkWithUser | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void;
  onWorkUpdate?: (work: WorkWithUser) => void;
}

export interface WorkMarqueeProps {
  works: WorkWithUser[];
  onWorkClick: (work: WorkWithUser) => void;
  direction?: 'left' | 'right';
  speed?: number;
}

export interface InfiniteScrollWorksProps {
  onWorkClick: (work: WorkWithUser) => void;
  worksPerRow?: number;
}