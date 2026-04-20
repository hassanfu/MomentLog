import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Activity } from "@/types";
import ActivityCard from "./ActivityCard";

interface Props {
  activities: Activity[];
}

export default function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--brand-subtle)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          这里还没有记录
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          记录你的第一条活动吧
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = activities.reduce<Record<string, Activity[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const dayActivities = grouped[date];
        const totalMinutes = dayActivities.reduce((s, a) => s + (a.duration_minutes ?? 0), 0);
        const dateObj = new Date(date + "T00:00:00");
        const label = format(dateObj, "M月d日 EEEE", { locale: zhCN });
        const isToday = date === format(new Date(), "yyyy-MM-dd");

        return (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: isToday ? "var(--brand)" : "var(--text-secondary)" }}
                >
                  {isToday ? "今天" : label}
                </span>
                {isToday && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                  >
                    TODAY
                  </span>
                )}
              </div>
              {totalMinutes > 0 && (
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  共 {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}m` : ""}` : `${totalMinutes}m`}
                </span>
              )}
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {dayActivities.length} 条
              </span>
            </div>

            <div className="space-y-2">
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
