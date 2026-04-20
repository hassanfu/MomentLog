"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { useEffect, useState, useTransition } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DASHBOARD_NAV,
  DASHBOARD_TAB_NAV_EVENT,
  navigateDashboardTab,
  tabFromSearchParams,
  type DashboardTabKey,
} from "@/lib/dashboard-nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  /** 与 HomeDashboard 同步：客户端 tab 事件 + URL，避免 Link 触发的软导航滞后 */
  const [dashboardTab, setDashboardTab] = useState<DashboardTabKey | null>(() =>
    pathname === "/" ? tabFromSearchParams(searchParams) : null,
  );

  useEffect(() => {
    if (pathname === "/") setDashboardTab(tabFromSearchParams(searchParams));
    else setDashboardTab(null);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onTab = (e: Event) => {
      const t = (e as CustomEvent<DashboardTabKey>).detail;
      if (t === "home" || t === "timeline" || t === "briefs") setDashboardTab(t);
    };
    window.addEventListener(DASHBOARD_TAB_NAV_EVENT, onTab as EventListener);
    return () => window.removeEventListener(DASHBOARD_TAB_NAV_EVENT, onTab as EventListener);
  }, []);

  function executeSignOut() {
    startTransition(async () => {
      const r = await signOut();
      if (r.ok) {
        setLogoutConfirmOpen(false);
        router.push("/login");
        router.refresh();
      }
    });
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 hidden md:block"
        style={{ background: "var(--nav-glass)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center" scroll={false}>
            <span className="text-sm font-bold tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
              MOMENTLOG
            </span>
          </Link>

          <div className="flex flex-1 justify-end shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              disabled={pending}
              aria-label="退出登录"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--brand-subtle)",
                color: "var(--brand)",
              }}
            >
              <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* 首页主题切换在 HomeDashboard 用户信息行顶对齐；其它路径保留右上角 */}
      {pathname !== "/" && (
        <div
          className="fixed right-4 z-50 md:hidden"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
        >
          <ThemeToggle />
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 md:hidden"
        style={{
          background: "var(--nav-glass-mobile)",
          backdropFilter: "blur(16px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        {DASHBOARD_NAV.map(({ tab, label, Icon }) => {
          const active = pathname === "/" && dashboardTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => navigateDashboardTab(tab)}
              className="flex flex-col items-center justify-center gap-0.5 py-3 transition-opacity hover:opacity-90"
              style={{
                color: active ? "var(--brand)" : "var(--text-muted)",
              }}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          disabled={pending}
          aria-label="退出登录"
          className="flex flex-col items-center justify-center gap-0.5 py-3 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="text-[10px] font-medium">{pending ? "…" : "退出"}</span>
        </button>
      </nav>

      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent
          className="sm:max-w-sm"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>退出登录</DialogTitle>
            <DialogDescription style={{ color: "var(--text-muted)" }}>
              确定要退出当前账户吗？退出后需要重新登录才能继续使用。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 border-0 bg-transparent px-4 pb-4 pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setLogoutConfirmOpen(false)}
              className="touch-manipulation"
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={executeSignOut}
              className="touch-manipulation text-white"
              style={{ background: "var(--brand)" }}
            >
              {pending ? "退出中…" : "退出"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

