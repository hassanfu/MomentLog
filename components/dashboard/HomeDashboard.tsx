"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { HeatmapCell } from "@/types";
import type { Activity } from "@/types";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import DashboardComposer from "@/components/dashboard/DashboardComposer";
import TimelineExplorer from "@/components/activity/TimelineExplorer";
import BriefPanel from "@/components/brief/BriefPanel";
import {
  DASHBOARD_NAV,
  hrefForDashboardTab,
  tabFromSearchParams,
  type DashboardTabKey,
} from "@/lib/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Hand } from "lucide-react";

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

  useEffect(() => {
    setTab(tabFromSearchParams(searchParams));
  }, [searchParams]);

  const selectTab = useCallback((t: TabKey) => {
    setTab(t);
    const href = hrefForDashboardTab(t);
    window.history.replaceState(window.history.state, "", href);
  }, []);

  useEffect(() => {
    const onPop = () => setTab(tabFromSearchParams(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      {/* 左侧：无边框分割线 */}
      <aside className="w-full shrink-0 space-y-5 pb-6 lg:w-[240px] lg:pb-0 lg:pr-4">
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
          <ActivityHeatmap
            cells={heatmap.cells}
            numWeeks={heatmap.numWeeks}
            gridStart={heatmap.gridStart}
          />
        )}

        <nav className="hidden space-y-0.5 lg:block">
          {DASHBOARD_NAV.map(({ tab: t, label, Icon }) => {
            const active = tab === t;
            return (
              <Link
                key={t}
                href={hrefForDashboardTab(t)}
                replace
                scroll={false}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background,color] duration-150 ease-out hover:bg-[var(--brand-subtle-hover)] ${
                  active
                    ? "bg-[var(--brand-subtle)] text-[var(--brand)] hover:bg-[var(--brand-subtle-hover)]"
                    : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--brand)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                {label}
              </Link>
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

            <DashboardComposer />

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
              <ActivityTimeline activities={recent} />
            </div>
          </>
        )}

        {tab === "timeline" && <TimelineExplorer />}

        {tab === "briefs" && <BriefPanel />}
      </div>
    </div>
  );
}
