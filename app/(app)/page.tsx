import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getHeatmapData,
  getSidebarMetrics,
  getRecentActivities,
} from "@/lib/actions/activities";
import HomeDashboard from "@/components/dashboard/HomeDashboard";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [heatmap, metrics, recent] = await Promise.all([
    getHeatmapData(12),
    getSidebarMetrics(),
    getRecentActivities(40),
  ]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "深夜好";
    if (h < 12) return "早上好";
    if (h < 14) return "中午好";
    if (h < 18) return "下午好";
    return "晚上好";
  })();

  const todayLabel = format(new Date(), "M月d日 EEEE", { locale: zhCN });
  const userLabel = user?.email?.split("@")[0] ?? "用户";

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 py-8">
          <div className="h-40 rounded-2xl" style={{ background: "var(--surface-elevated)" }} />
          <div className="h-64 rounded-2xl" style={{ background: "var(--surface-elevated)" }} />
        </div>
      }
    >
      <HomeDashboard
        heatmap={heatmap}
        metrics={metrics}
        recent={recent}
        userLabel={userLabel}
        todayLabel={todayLabel}
        greeting={greeting}
      />
    </Suspense>
  );
}
