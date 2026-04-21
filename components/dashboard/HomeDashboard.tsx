"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { HeatmapCell } from "@/types";
import type { Activity } from "@/types";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import TimelineListSkeleton from "@/components/activity/TimelineListSkeleton";
import DashboardComposer from "@/components/dashboard/DashboardComposer";
import {
  DASHBOARD_NAV,
  DASHBOARD_TAB_NAV_EVENT,
  navigateDashboardTab,
  tabFromSearchParams,
  type DashboardTabKey,
} from "@/lib/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";

/** 首次切入「时间线 / AI 简报」时才加载对应 chunk，减轻首屏 JS */
function TabPanelFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="加载中">
      <div className="h-5 w-36 animate-pulse rounded-md" style={{ background: "var(--surface-elevated)" }} />
      <div className="h-52 animate-pulse rounded-2xl border" style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }} />
      <div className="h-24 animate-pulse rounded-2xl" style={{ background: "var(--surface-elevated)" }} />
    </div>
  );
}

function TimelineTabChunkFallback() {
  return (
    <div className="space-y-5" aria-busy aria-label="加载中">
      <div className="h-7 w-20 animate-pulse rounded-md" style={{ background: "var(--surface-elevated)" }} />
      <div className="h-10 animate-pulse rounded-xl" style={{ background: "var(--surface-elevated)" }} />
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg" style={{ background: "var(--surface-elevated)" }} />
        <div
          className="mx-auto h-5 max-w-[14rem] flex-1 animate-pulse rounded"
          style={{ background: "var(--surface-elevated)" }}
        />
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg" style={{ background: "var(--surface-elevated)" }} />
      </div>
      <TimelineListSkeleton cards={4} />
    </div>
  );
}

const TimelineExplorer = dynamic(() => import("@/components/activity/TimelineExplorer"), {
  loading: () => <TimelineTabChunkFallback />,
});

const BriefPanel = dynamic(() => import("@/components/brief/BriefPanel"), {
  loading: () => <TabPanelFallback />,
});

interface Props {
  heatmap: { cells: HeatmapCell[]; numWeeks: number; gridStart: string } | null;
  metrics: { totalRecords: number; tagCount: number; activeDays: number } | null;
  recent: Activity[];
  userLabel: string;
  todayLabel: string;
  greeting: string;
}

type TabKey = DashboardTabKey;

export default function HomeDashboard({
  heatmap,
  metrics,
  recent,
  userLabel,
  todayLabel,
  greeting,
}: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() => tabFromSearchParams(searchParams));
  /** 与服务端 props 同步；新建记录后立即 prepend，避免整页 refresh 后才看到列表更新 */
  const [recentList, setRecentList] = useState<Activity[]>(recent);

  useEffect(() => {
    setRecentList(recent);
  }, [recent]);

  const handleActivitySaved = useCallback((created: Activity) => {
    setRecentList((prev) => {
      const deduped = prev.filter((a) => a.id !== created.id);
      return [created, ...deduped].slice(0, 60);
    });
  }, []);

  useEffect(() => {
    setTab(tabFromSearchParams(searchParams));
  }, [searchParams]);

  /** 与其它入口（底部导航）同一套客户端切换，无 Next Link 导航延迟 */
  useEffect(() => {
    const onNav = (e: Event) => {
      const t = (e as CustomEvent<TabKey>).detail;
      if (t === "home" || t === "timeline" || t === "briefs") setTab(t);
    };
    window.addEventListener(DASHBOARD_TAB_NAV_EVENT, onNav as EventListener);
    return () => window.removeEventListener(DASHBOARD_TAB_NAV_EVENT, onNav as EventListener);
  }, []);

  const selectTab = useCallback((t: TabKey) => {
    navigateDashboardTab(t);
  }, []);

  useEffect(() => {
    const onPop = () => setTab(tabFromSearchParams(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      {/* 左侧：移动端与主区间距仅由外层 gap-6（24px）承担，避免再给 aside 加 pb 与 gap 叠加 */}
      <aside className="w-full shrink-0 space-y-5 lg:w-[240px] lg:pb-0 lg:pr-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {userLabel}
            </p>
            {metrics && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>
                  <strong className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {metrics.totalRecords}
                  </strong>{" "}
                  记录
                </span>
                <span>
                  <strong className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {metrics.tagCount}
                  </strong>{" "}
                  标签
                </span>
                <span>
                  <strong className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {metrics.activeDays}
                  </strong>{" "}
                  天
                </span>
              </div>
            )}
          </div>
          <ThemeToggle className="lg:hidden" />
        </div>

        {heatmap && (
          <div className={cn(tab !== "home" && "hidden lg:block")}>
            <ActivityHeatmap
              cells={heatmap.cells}
              numWeeks={heatmap.numWeeks}
              gridStart={heatmap.gridStart}
            />
          </div>
        )}

        <nav className="hidden space-y-0.5 lg:block">
          {DASHBOARD_NAV.map(({ tab: t, label, Icon }) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => navigateDashboardTab(t)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-[background,color] duration-150 ease-out hover:bg-[var(--brand-subtle-hover)] ${
                  active
                    ? "bg-[var(--brand-subtle)] text-[var(--brand)] hover:bg-[var(--brand-subtle-hover)]"
                    : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--brand)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 右侧：按 tab 切换，无竖线 */}
      <div className="min-w-0 flex-1 space-y-5">
        {tab === "home" && (
          <>
            <div>
              <p className="text-sm md:text-xs" style={{ color: "var(--text-muted)" }}>
                {todayLabel}
              </p>
              <h1
                className="mt-1 flex flex-wrap items-center gap-2 text-xl tracking-tight lg:text-[1.35rem]"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}
              >
                <span>{greeting}，</span>
                <Hand className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: "var(--brand)" }} aria-hidden />
              </h1>
            </div>

            <DashboardComposer onActivitySaved={handleActivitySaved} />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base md:text-sm" style={{ color: "var(--text-secondary)" }}>
                  最近动态
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium underline-offset-2 hover:underline"
                  style={{ color: "var(--brand)" }}
                  onClick={() => selectTab("timeline")}
                >
                  全部时间线
                </button>
              </div>
              <ActivityTimeline activities={recentList} />
            </div>
          </>
        )}

        {tab === "timeline" && <TimelineExplorer />}

        {tab === "briefs" && <BriefPanel />}
      </div>
    </div>
  );
}
