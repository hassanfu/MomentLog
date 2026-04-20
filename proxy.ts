import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireSupabasePublicEnv } from "@/lib/env-public";

export async function proxy(request: NextRequest) {
  let url: string;
  let anonKey: string;
  try {
    ({ url, anonKey } = requireSupabasePublicEnv());
  } catch {
    return new NextResponse(
      "MomentLog：未配置 Supabase 环境变量。请在 Vercel Project → Settings → Environment Variables 中添加 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY，并重新部署。",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Next 15+：不能对 request.cookies 写，只通过 response 设置；并透传防 CDN 缓存的 headers
        setAll(cookiesToSet, responseHeaders) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          if (responseHeaders && typeof responseHeaders === "object") {
            for (const [k, v] of Object.entries(responseHeaders)) {
              if (v != null) supabaseResponse.headers.set(k, String(v));
            }
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isCallbackRoute = request.nextUrl.pathname.startsWith("/callback");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  if (!user && !isAuthRoute && !isCallbackRoute && !isApiRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
