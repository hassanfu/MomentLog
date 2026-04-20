import type { Activity } from "@/types";
import type { BriefPromptStats } from "@/lib/prompts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 从活动列表聚合简报提示所需统计（条数、总时长、较活跃日与标签）。
 */
export function computeBriefPromptStats(activities: Activity[]): BriefPromptStats {
  const activityCount = activities.length;
  let totalMinutes = 0;
  for (const a of activities) {
    if (a.duration_minutes != null && a.duration_minutes > 0) {
      totalMinutes += a.duration_minutes;
    }
  }

  const byDay = new Map<string, { count: number; minutes: number }>();
  for (const a of activities) {
    const cur = byDay.get(a.date) ?? { count: 0, minutes: 0 };
    cur.count += 1;
    if (a.duration_minutes != null && a.duration_minutes > 0) cur.minutes += a.duration_minutes;
    byDay.set(a.date, cur);
  }

  let busiestDayLabel: string | undefined;
  if (byDay.size > 0) {
    let bestDay = "";
    let bestScore = -1;
    for (const [day, v] of byDay) {
      const score = v.count * 10000 + v.minutes;
      if (score > bestScore) {
        bestScore = score;
        bestDay = day;
      }
    }
    const dt = new Date(bestDay + "T12:00:00");
    busiestDayLabel = `${format(dt, "M月d日", { locale: zhCN })}（约 ${byDay.get(bestDay)!.count} 条）`;
  }

  const tagCount = new Map<string, number>();
  const tagMinutes = new Map<string, number>();
  for (const a of activities) {
    for (const raw of a.tags ?? []) {
      const t = String(raw).replace(/^#/, "").trim();
      if (!t) continue;
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
      const m = a.duration_minutes != null && a.duration_minutes > 0 ? a.duration_minutes : 0;
      tagMinutes.set(t, (tagMinutes.get(t) ?? 0) + m);
    }
  }

  let busiestDomainLabel: string | undefined;
  if (tagCount.size > 0) {
    let bestTag = "";
    let bestScore = -1;
    for (const [tag, c] of tagCount) {
      const score = c * 5000 + (tagMinutes.get(tag) ?? 0);
      if (score > bestScore) {
        bestScore = score;
        bestTag = tag;
      }
    }
    busiestDomainLabel = `#${bestTag}（约 ${tagCount.get(bestTag)} 条带此标签）`;
  }

  return {
    activityCount,
    totalMinutes,
    busiestDayLabel,
    busiestDomainLabel,
  };
}
