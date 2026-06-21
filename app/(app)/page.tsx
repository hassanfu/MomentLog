import { Suspense } from "react";
import HomeDashboard from "@/components/dashboard/HomeDashboard";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 纯本地演示：服务端不再读取用户数据；首屏占位空数据，
 * HomeDashboard 在客户端挂载后再从 localStorage 注入真实数据。
 */
export default function DashboardPage() {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "深夜好";
    if (h < 12) return "早上好";
    if (h < 14) return "中午好";
    if (h < 18) return "下午好";
    return "晚上好";
  })();

  const todayLabel = format(new Date(), "M月d日 EEEE", { locale: zhCN });

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 py-8">
          <div className="h-40 rounded-2xl" style={{ background: "var(--surface-elevated)" }} />
          <div className="h-64 rounded-2xl" style={{ background: "var(--surface-elevated)" }} />
        </div>
      }
    >
      <HomeDashboard userLabel="本地访客" todayLabel={todayLabel} greeting={greeting} />
    </Suspense>
  );
}
