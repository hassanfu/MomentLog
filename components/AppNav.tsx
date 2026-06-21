"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DASHBOARD_NAV,
  DASHBOARD_TAB_NAV_EVENT,
  navigateDashboardTab,
  tabFromSearchParams,
  type DashboardTabKey,
} from "@/lib/dashboard-nav";

/**
 * 纯本地演示：不再有登录/退出。底部导航只剩三个 tab。
 */
export default function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <>
      <header
        className="sticky top-0 z-40 hidden md:block"
        style={{ background: "var(--nav-glass)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5" scroll={false}>
            <Image
              src="/logo.png"
              alt="MomentLog"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-md object-cover"
              priority
            />
            <span className="text-sm font-bold tracking-[0.14em]" style={{ color: "var(--text-primary)" }}>
              MOMENTLOG
            </span>
          </Link>

          <div className="flex flex-1 justify-end shrink-0 items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {pathname !== "/" && (
        <div
          className="fixed right-4 z-50 md:hidden"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
        >
          <ThemeToggle />
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 md:hidden"
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
      </nav>
    </>
  );
}
