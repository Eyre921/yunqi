'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 添加调试日志
  console.log('Admin page - Session status:', status);
  console.log('Admin page - Session data:', session);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      console.log('No session found, redirecting to signin');
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }
    
    if (session.user?.role !== 'ADMIN') {
      console.log('User is not admin, role:', session.user?.role);
      router.push('/');
      return;
    }
    
    console.log('Admin access granted');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  return <AdminDashboard />;
}