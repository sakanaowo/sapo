import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

const publicRoutes = ["/login", "/api/auth", "/api/user/login"];


const apiRoutes = ["/api/products", "/api/orders", "/api/pos"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // console.log(`🔄 Middleware processing: ${pathname}`);

  // Bỏ qua các file tĩnh và Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/.well-known") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Cho phép truy cập route công khai
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // console.log(`✅ Public route allowed: ${pathname}`);
    return NextResponse.next();
  }

  try {
    // Lấy token trực tiếp từ cookies trong middleware
    const token = request.cookies.get("notsapo-auth-token")?.value;

    console.log("🔍 Middleware token check:", {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    });

    if (!token) {
      console.log("❌ No token found, redirecting to login");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify JWT token
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      throw new Error("JWT_SECRET not configured");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    console.log("✅ Token verified for user:", payload.adminId);

    // Kiểm tra quyền truy cập cho API routes
    if (apiRoutes.some((route) => pathname.startsWith(route))) {
      // Thêm user info vào headers để sử dụng trong API
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-adminId", payload.adminId as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    console.error("❌ Middleware authentication error:", error);

    // Clear invalid token
    const response = NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
    response.cookies.delete("notsapo-auth-token");

    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};