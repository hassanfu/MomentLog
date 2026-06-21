import { NextResponse, type NextRequest } from "next/server";

/**
 * 纯本地演示：不再校验 Supabase 会话；
 * /login 与 /callback 路径直接重定向回首页，避免遗留链接误打开旧登录页。
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/login") || path.startsWith("/callback")) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  if (path === "/activities" || path === "/activities/") {
    const next = request.nextUrl.clone();
    next.pathname = "/";
    next.search = "?tab=timeline";
    return NextResponse.redirect(next);
  }

  if (path === "/briefs" || path === "/briefs/") {
    const next = request.nextUrl.clone();
    next.pathname = "/";
    next.search = "?tab=briefs";
    return NextResponse.redirect(next);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
