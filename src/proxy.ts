import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  // Use native fetch to check session from Better Auth
  const response = await fetch(new URL("/api/auth/get-session", request.url), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  const session = (await response.json().catch(() => null)) as any;

  const pathname = request.nextUrl.pathname;

  // Protect strictly member/admin routes
  const isProtected = pathname.startsWith("/dashboard") || 
                      pathname.startsWith("/learning") || 
                      pathname.startsWith("/bookmarks") || 
                      pathname.startsWith("/admin");

  if (isProtected) {
    // [開発用] 一時的にすべてのリダイレクトを無効化
    /*
    if (!session || !session.session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Check admin role
    if (pathname.startsWith("/admin")) {
      if (session.user?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    */
  }

  // Redirect authenticated users away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    if (session && session.session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
