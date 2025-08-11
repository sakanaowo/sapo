import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/api/webhook(.*)',
  '/',
  '/api/uploadthing(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;

  // 1) Đã đăng nhập mà vào /login → chuyển hướng ngay, không render /login
  if (url.pathname.startsWith('/login') && userId) {
    const dest = url.searchParams.get('redirect') ?? '/dashboard';
    return NextResponse.redirect(new URL(dest, url));
  }

  // 2) Cho qua các route public
  if (isPublicRoute(req)) return NextResponse.next();

  // 3) Bảo vệ các route còn lại
  if (!userId) {
    const loginUrl = new URL('/login', url);
    loginUrl.searchParams.set('redirect', url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};