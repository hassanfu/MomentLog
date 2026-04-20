"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { Activity } from "@/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const TAG_COLORS: Record<string, string> = {
  "#工作": "#c96442",
  "#学习": "#0ea5e9",
  "#生活": "#f59e0b",
  "#运动": "#22c55e",
  "#创作": "#ec4899",
  "#社交": "#f97316",
  "#休息": "#d97757",
};

interface DashboardStatsProps {
  today: Activity[];
  week: Activity[];
  month: Activity[];
}

export default function StatsCharts({ today, week, month }: DashboardStatsProps) {
  const todayMinutes = today.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
  const weekMinutes = week.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
  const monthMinutes = month.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);

  // Tag distribution for week
  const tagData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of week) {
      for (const t of a.tags) {
        map[t] = (map[t] ?? 0) + (a.duration_minutes ?? 30);
      }
    }
    return Object.entries(map)
      .map(([tag, minutes]) => ({ tag, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);
  }, [week]);

  // Daily activity count for the week
  const weekDays = useMemo(() => {
    const days: Record<string, number> = {};
    for (const a of week) {
      days[a.date] = (days[a.date] ?? 0) + 1;
    }
    return Object.entries(days)
      .map(([date, count]) => ({
        label: format(new Date(date + "T00:00:00"), "EEE", { locale: zhCN }),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [week]);

  function fmt(minutes: number) {
    if (minutes === 0) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "今日记录", count: today.length, minutes: todayMinutes, color: "#c96442" },
          { label: "本周记录", count: week.length, minutes: weekMinutes, color: "#0ea5e9" },
          { label: "本月记录", count: month.length, minutes: monthMinutes, color: "#22c55e" },
        ].map(({ label, count, minutes, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{count}</p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
              {fmt(minutes)}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      {weekDays.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            本周每日记录数
          </h3>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weekDays} barSize={24}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "var(--brand-subtle)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v} 条`, "记录"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {weekDays.map((_, i) => (
                  <Cell key={i} fill="var(--brand)" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tag breakdown */}
      {tagData.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            本周标签分布
          </h3>
          <div className="space-y-2.5">
            {tagData.map(({ tag, minutes }) => {
              const max = tagData[0].minutes;
              const pct = Math.round((minutes / max) * 100);
              const color = TAG_COLORS[tag] ?? "var(--brand)";
              return (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-xs w-14 shrink-0 font-medium" style={{ color: "var(--text-secondary)" }}>{tag}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right shrink-0" style={{ color: "var(--text-muted)" }}>
                    {fmt(minutes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
