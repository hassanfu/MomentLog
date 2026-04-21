"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Activity, ActivityFormData, HeatmapCell, PeriodType } from "@/types";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  addDays,
  subWeeks,
} from "date-fns";

export async function createActivity(data: ActivityFormData): Promise<Activity> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: row, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      date: data.date,
      description: data.description,
      tags: data.tags,
      duration_minutes: data.duration_minutes,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/activities");
  return row as Activity;
}

export async function updateActivity(id: string, data: ActivityFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("activities")
    .update({
      date: data.date,
      description: data.description,
      tags: data.tags,
      duration_minutes: data.duration_minutes,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/activities");
}

export async function deleteActivity(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/activities");
}

export async function getActivities(period: PeriodType = "day", referenceDate?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const ref = referenceDate ? new Date(referenceDate) : new Date();
  let from: Date, to: Date;

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

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", format(from, "yyyy-MM-dd"))
    .lte("date", format(to, "yyyy-MM-dd"))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase.from("activities").select("*").eq("user_id", user.id).eq("date", todayStr),
    supabase.from("activities").select("*").eq("user_id", user.id).gte("date", weekStart).lte("date", weekEnd),
    supabase.from("activities").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
  ]);

  return {
    today: todayRes.data ?? [],
    week: weekRes.data ?? [],
    month: monthRes.data ?? [],
  };
}

/** 活跃度等级：0 无 · 1 轻 · 2 中 · 3 高 · 4 满 */
function countToLevel(n: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n <= 3) return 2;
  if (n <= 6) return 3;
  return 4;
}

/** 最近 N 周（每列一周、每行一周中的一天）用于热力图 */
export async function getHeatmapData(numWeeks = 12): Promise<{
  cells: HeatmapCell[];
  numWeeks: number;
  gridStart: string;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = startOfDay(new Date());
  const currentWeekMonday = startOfWeek(today, { weekStartsOn: 1 });
  const gridStartMonday = subWeeks(currentWeekMonday, numWeeks - 1);

  const gridEndSunday = addDays(gridStartMonday, numWeeks * 7 - 1);
  const from = format(gridStartMonday, "yyyy-MM-dd");
  const to = format(gridEndSunday, "yyyy-MM-dd");

  const { data: rows } = await supabase
    .from("activities")
    .select("date")
    .eq("user_id", user.id)
    .gte("date", from)
    .lte("date", to);

  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const d = row.date as string;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  for (let i = 0; i < numWeeks * 7; i++) {
    const d = addDays(gridStartMonday, i);
    const key = format(d, "yyyy-MM-dd");
    const isFuture = d > today;
    const count = isFuture ? 0 : counts.get(key) ?? 0;
    cells.push({ date: key, count, level: countToLevel(count) });
  }

  return { cells, numWeeks, gridStart: from };
}

export async function getSidebarMetrics(): Promise<{
  totalRecords: number;
  tagCount: number;
  activeDays: number;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { count: totalRecords } = await supabase
    .from("activities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: rows } = await supabase
    .from("activities")
    .select("tags, date")
    .eq("user_id", user.id);

  const tagSet = new Set<string>();
  const dateSet = new Set<string>();
  for (const row of rows ?? []) {
    dateSet.add(row.date as string);
    for (const t of row.tags ?? []) tagSet.add(t);
  }

  return {
    totalRecords: totalRecords ?? 0,
    tagCount: tagSet.size,
    activeDays: dateSet.size,
  };
}

/** 首页信息流：按时间倒序 */
export async function getRecentActivities(limit = 40) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
