import type { LucideIcon } from "lucide-react";
import { LayoutList, Sparkles, Waypoints } from "lucide-react";

export type DashboardTabKey = "home" | "timeline" | "briefs";

export const DASHBOARD_NAV: {
  tab: DashboardTabKey;
  label: string;
  Icon: LucideIcon;
}[] = [
  { tab: "home", label: "全部记录", Icon: LayoutList },
  { tab: "timeline", label: "时间线", Icon: Waypoints },
  { tab: "briefs", label: "AI 简报", Icon: Sparkles },
];

export function hrefForDashboardTab(t: DashboardTabKey): string {
  return t === "home" ? "/" : `/?tab=${t}`;
}

export function tabFromSearchParams(sp: URLSearchParams | null): DashboardTabKey {
  const raw = sp?.get("tab");
  if (raw === "timeline" || raw === "briefs") return raw;
  return "home";
}

/** 与 HomeDashboard 同步 tab，避免使用 Link 触发 Next 软导航与 RSC 请求 */
export const DASHBOARD_TAB_NAV_EVENT = "momentlog:dashboard-tab";

export function navigateDashboardTab(tab: DashboardTabKey): void {
  if (typeof window === "undefined") return;
  const href = hrefForDashboardTab(tab);
  window.history.replaceState(window.history.state, "", href);
  window.dispatchEvent(new CustomEvent(DASHBOARD_TAB_NAV_EVENT, { detail: tab }));
}
