/**
 * 浏览器 localStorage 版「已保存简报」存储。纯本地演示。
 */

import type { PeriodType, SavedBrief } from "@/types";
import { getPeriodBounds } from "@/lib/brief-period";

export const LOCAL_BRIEFS_KEY = "momentlog:saved-briefs:v1";
export const LOCAL_BRIEFS_EVENT = "momentlog:saved-briefs:changed";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function genId(): string {
  if (isBrowser() && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function load(): SavedBrief[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_BRIEFS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SavedBrief[]) : [];
  } catch {
    return [];
  }
}

function save(rows: SavedBrief[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCAL_BRIEFS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(LOCAL_BRIEFS_EVENT));
}

export function subscribeLocalSavedBriefs(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onChange = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_BRIEFS_KEY) cb();
  };
  window.addEventListener(LOCAL_BRIEFS_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LOCAL_BRIEFS_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function listLocalSavedBriefs(limit = 50): SavedBrief[] {
  return load()
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function saveLocalBriefMarkdown(input: {
  markdown: string;
  period: PeriodType;
  referenceDate: string;
}): { ok: boolean; error?: string; id?: string } {
  const raw = input.markdown.trim();
  if (!raw) return { ok: false, error: "内容为空" };
  const { periodStart, periodEnd } = getPeriodBounds(input.referenceDate, input.period);
  const row: SavedBrief = {
    id: genId(),
    user_id: "local",
    period_type: input.period,
    reference_date: input.referenceDate,
    period_start: periodStart,
    period_end: periodEnd,
    body_markdown: raw,
    created_at: new Date().toISOString(),
  };
  const all = load();
  all.unshift(row);
  save(all);
  return { ok: true, id: row.id };
}

export function deleteLocalSavedBrief(id: string): { ok: boolean; error?: string } {
  const all = load();
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return { ok: false, error: "未找到该简报" };
  save(next);
  return { ok: true };
}
