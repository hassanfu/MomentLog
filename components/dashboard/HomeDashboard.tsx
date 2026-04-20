"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { HeatmapCell } from "@/types";
import type { Activity } from "@/types";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import DashboardComposer from "@/components/dashboard/DashboardComposer";
import TimelineExplorer from "@/components/activity/TimelineExplorer";
import BriefPanel from "@/components/brief/BriefPanel";

interface Props {
  heatmap: { cells: HeatmapCell[]; numWeeks: number; gridStart: string } | null;
  metrics: { totalRecords: number; tagCount: number; activeDays: number } | null;
  recent: Activity[];
  userLabel: string;
  todayLabel: string;
  greeting: string;
}

type TabKey = "home" | "timeline" | "briefs";

const SIDEBAR_NAV: { tab: TabKey; label: string }[] = [
  { tab: "home", label: "全部记录" },
  { tab: "timeline", label: "时间线" },
  { tab: "briefs", label: "AI 简报" },
];

function tabFromSearchParams(sp: URLSearchParams | null): TabKey {
  const raw = sp?.get("tab");
  if (raw === "timeline" || raw === "briefs") return raw;
  return "home";
}

function hrefForTab(t: TabKey) {
  return t === "home" ? "/" : `/?tab=${t}`;
}

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
    const href = hrefForTab(t);
    window.history.replaceState(window.history.state, "", href);
  }, []);

  useEffect(() => {
    const onPop = () => setTab(tabFromSearchParams(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div
      className={
        tab === "briefs"
          ? "brief-layout-v21 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10"
          : "flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10"
      }
    >
      {/* 左侧：无边框分割线 */}
      <aside className="w-full shrink-0 space-y-5 pb-6 lg:w-[240px] lg:pb-0 lg:pr-4">
        <div>
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

        {heatmap && (
          <ActivityHeatmap
            cells={heatmap.cells}
            numWeeks={heatmap.numWeeks}
            gridStart={heatmap.gridStart}
          />
        )}

        <nav className="space-y-0.5">
          {SIDEBAR_NAV.map(({ tab: t, label }) => {
            const active = tab === t;
            return (
              <a
                key={t}
                href={hrefForTab(t)}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-[background,color] duration-150 ease-out hover:bg-[var(--brand-subtle-hover)] ${
                  active
                    ? "bg-[var(--brand-subtle)] text-[var(--brand)] hover:bg-[var(--brand-subtle-hover)]"
                    : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--brand)]"
                }`}
                onClick={(e) => {
                  if (e.button !== 0) return;
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  selectTab(t);
                }}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* 右侧：按 tab 切换，无竖线 */}
      <div className="min-w-0 flex-1 space-y-5">
        {tab === "home" && (
          <>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {todayLabel}
              </p>
              <h1
                className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}
              >
                {greeting}，{userLabel} 👋
              </h1>
            </div>

            <DashboardComposer />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
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
