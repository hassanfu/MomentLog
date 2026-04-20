import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Activity } from "@/types";
import ActivityCard from "./ActivityCard";
import { Plus } from "lucide-react";

interface Props {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--brand-subtle)" }}
        >
          <Plus className="h-6 w-6" strokeWidth={2} style={{ color: "var(--brand)" }} aria-hidden />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          这里还没有记录
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          记录你的第一条活动吧
        </p>
      </div>
    );
  }

  const grouped = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 md:space-y-10">
      {sortedDates.map((date) => {
        const dayActivities = grouped[date];
        const totalMinutes = dayActivities.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
        const dateObj = new Date(date + "T00:00:00");
        const label = format(dateObj, "M月d日 EEEE", { locale: zhCN });
        const isToday = date === format(new Date(), "yyyy-MM-dd");

        return (
          <div key={date}>
            {/* 日期抬头 */}
            <div className="mb-4 flex items-center gap-3 md:mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm font-semibold md:text-xs"
                  style={{ color: isToday ? "var(--brand)" : "var(--text-secondary)" }}
                >
                  {isToday ? "今天" : label}
                </span>
                {isToday && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-medium md:text-[10px]"
                    style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                  >
                    TODAY
                  </span>
                )}
              </div>
              {totalMinutes > 0 && (
                <span className="text-[11px] md:text-[11px]" style={{ color: "var(--text-muted)" }}>
                  共{" "}
                  {totalMinutes >= 60
                    ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}m` : ""}`
                    : `${totalMinutes}m`}
                </span>
              )}
              <div className="h-px min-w-[2rem] flex-1" style={{ background: "var(--border)" }} />
              <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
                {dayActivities.length} 条
              </span>
            </div>

            {/* 移动端单列，md+ 两列卡片 */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {dayActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
