import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
    const isUploadPage = req.nextUrl.pathname.startsWith('/upload');
    const isProfilePage = req.nextUrl.pathname.startsWith('/profile');

    // 如果访问认证页面且已登录，重定向到首页
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 如果访问管理页面但不是管理员，重定向到首页
    if (isAdminPage && (!isAuth || token?.role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 如果访问上传页面但未登录，重定向到登录页
    if (isUploadPage && !isAuth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // 如果访问个人中心但未登录，重定向到登录页
    if (isProfilePage && !isAuth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // 让中间件处理所有路由
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/upload/:path*',
    '/auth/:path*',
    '/profile/:path*'
  ]
};