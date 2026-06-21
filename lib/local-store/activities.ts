/**
 * 浏览器 localStorage 版「活动记录」存储。
 * 用于纯本地演示：所有 CRUD 都在当前浏览器，不会上传到 Supabase。
 * 同一标签页里通过 CustomEvent 通知更新；跨标签依赖 'storage' 事件。
 */

import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subWeeks,
} from "date-fns";
import type {
  Activity,
  ActivityFormData,
  HeatmapCell,
  PeriodType,
} from "@/types";

export const LOCAL_ACTIVITIES_KEY = "momentlog:activities:v1";
export const LOCAL_ACTIVITIES_EVENT = "momentlog:activities:changed";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function genId(): string {
  if (isBrowser() && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function loadAll(): Activity[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Activity[]) : [];
  } catch {
    return [];
  }
}

function saveAll(rows: Activity[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(LOCAL_ACTIVITIES_EVENT));
}

/** 订阅本地存储变化（同标签 + 跨标签） */
export function subscribeLocalActivities(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onChange = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_ACTIVITIES_KEY) cb();
  };
  window.addEventListener(LOCAL_ACTIVITIES_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LOCAL_ACTIVITIES_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getAllLocalActivities(): Activity[] {
  return loadAll();
}

export function createLocalActivity(data: ActivityFormData): Activity {
  const created: Activity = {
    id: genId(),
    user_id: "local",
    date: data.date,
    description: data.description,
    tags: data.tags,
    duration_minutes: data.duration_minutes,
    created_at: new Date().toISOString(),
  };
  const all = loadAll();
  all.unshift(created);
  saveAll(all);
  return created;
}

export function updateLocalActivity(id: string, data: ActivityFormData): Activity | null {
  const all = loadAll();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const merged: Activity = {
    ...all[idx],
    date: data.date,
    description: data.description,
    tags: data.tags,
    duration_minutes: data.duration_minutes,
  };
  all[idx] = merged;
  saveAll(all);
  return merged;
}

export function deleteLocalActivity(id: string): void {
  const all = loadAll();
  const next = all.filter((a) => a.id !== id);
  if (next.length !== all.length) saveAll(next);
}

/** 信息流：按 created_at desc */
export function getRecentLocalActivities(limit = 40): Activity[] {
  return loadAll()
    .slice()
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, limit);
}

/** 时间线：按 period + reference 过滤，按日期/创建时间倒序 */
export function getLocalActivitiesByPeriod(period: PeriodType, referenceDate?: string): Activity[] {
  const ref = referenceDate ? new Date(referenceDate + "T00:00:00") : new Date();
  let from: Date;
  let to: Date;
  switch (period) {
    case "week":
      from = startOfWeek(ref, { weekStartsOn: 1 });
      to = endOfWeek(ref, { weekStartsOn: 1 });
      break;
    case "month":
      from = startOfMonth(ref);
      to = endOfMonth(ref);
      break;
    case "year":
      from = startOfYear(ref);
      to = endOfYear(ref);
      break;
    default:
      from = startOfDay(ref);
      to = endOfDay(ref);
  }
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");
  return loadAll()
    .filter((a) => a.date >= fromStr && a.date <= toStr)
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
}

function countToLevel(n: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

export function getLocalHeatmap(numWeeks = 12): { cells: HeatmapCell[]; numWeeks: number; gridStart: string } {
  const all = loadAll();
  const today = startOfDay(new Date());
  const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
  const gridStartMonday = subWeeks(currentMonday, numWeeks - 1);

  const counts = new Map<string, number>();
  for (const a of all) counts.set(a.date, (counts.get(a.date) ?? 0) + 1);

  const cells: HeatmapCell[] = [];
  for (let i = 0; i < numWeeks * 7; i++) {
    const d = addDays(gridStartMonday, i);
    const key = format(d, "yyyy-MM-dd");
    const isFuture = d > today;
    const count = isFuture ? 0 : counts.get(key) ?? 0;
    cells.push({ date: key, count, level: countToLevel(count) });
  }
  return { cells, numWeeks, gridStart: format(gridStartMonday, "yyyy-MM-dd") };
}

export function getLocalSidebarMetrics(): { totalRecords: number; tagCount: number; activeDays: number } {
  const all = loadAll();
  const tagSet = new Set<string>();
  const dateSet = new Set<string>();
  for (const a of all) {
    dateSet.add(a.date);
    for (const t of a.tags ?? []) tagSet.add(t);
  }
  return { totalRecords: all.length, tagCount: tagSet.size, activeDays: dateSet.size };
}
