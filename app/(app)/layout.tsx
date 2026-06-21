import AppNav from "@/components/AppNav";

/**
 * 纯本地演示：无需鉴权，所有人都能直接进入首页（数据存浏览器 localStorage）。
 * AppNav 与首页内部都依赖 useSearchParams 等客户端 API，整体作为动态路由，
 * 避免被 Turbopack 误判为可静态导出而触发预渲染失败。
 */
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 md:pb-24 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
