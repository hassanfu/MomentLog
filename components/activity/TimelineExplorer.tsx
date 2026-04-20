"use client";

import { useState, useEffect, useTransition } from "react";
import { getActivities } from "@/lib/actions/activities";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import TimelineListSkeleton from "@/components/activity/TimelineListSkeleton";
import type { Activity, PeriodType } from "@/types";
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "year", label: "年" },
];

export default function TimelineExplorer() {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [referenceDate, setReferenceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      const data = await getActivities(period, referenceDate);
      setActivities(data);
      setIsLoading(false);
    });
  }, [period, referenceDate]);

  function navigate(direction: "prev" | "next") {
    const ref = new Date(referenceDate + "T00:00:00");
    let next: Date;
    switch (period) {
      case "day":
        next = direction === "prev" ? subDays(ref, 1) : addDays(ref, 1);
        break;
      case "week":
        next = direction === "prev" ? subWeeks(ref, 1) : addWeeks(ref, 1);
        break;
      case "month":
        next = direction === "prev" ? subMonths(ref, 1) : addMonths(ref, 1);
        break;
      default:
        next = direction === "prev" ? subMonths(ref, 12) : addMonths(ref, 12);
    }
    setReferenceDate(format(next, "yyyy-MM-dd"));
  }

  function getPeriodLabel() {
    const ref = new Date(referenceDate + "T00:00:00");
    switch (period) {
      case "day":
        return format(ref, "yyyy年M月d日 EEEE", { locale: zhCN });
      case "week": {
        const ws = startOfWeek(ref, { weekStartsOn: 1 });
        const we = endOfWeek(ref, { weekStartsOn: 1 });
        return `${format(ws, "M月d日", { locale: zhCN })} — ${format(we, "M月d日", { locale: zhCN })}`;
      }
      case "month":
        return format(ref, "yyyy年M月", { locale: zhCN });
      case "year":
        return format(ref, "yyyy年", { locale: zhCN });
    }
  }

  const isToday = referenceDate === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-5">
      <h2 className="text-lg tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
        时间线
      </h2>

      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
      >
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setPeriod(value);
              setReferenceDate(format(new Date(), "yyyy-MM-dd"));
            }}
            className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all"
            style={{
              background: period === value ? "var(--brand)" : "transparent",
              color: period === value ? "white" : "var(--text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("prev")}
          className="rounded-lg p-2 transition-all hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
          aria-label="上一段"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {getPeriodLabel()}
        </span>
        <button
          type="button"
          onClick={() => navigate("next")}
          disabled={isToday && period === "day"}
          className="rounded-lg p-2 transition-all hover:opacity-70 disabled:opacity-30"
          style={{ color: "var(--text-secondary)" }}
          aria-label="下一段"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {isLoading ? (
        <TimelineListSkeleton cards={4} />
      ) : (
        <ActivityTimeline activities={activities} />
      )}
    </div>
  );
}
