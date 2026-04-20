"use client";

import { useState, useTransition } from "react";
import { deleteActivity } from "@/lib/actions/activities";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Activity } from "@/types";
import ActivityForm from "./ActivityForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

const TAG_COLORS: Record<string, string> = {
  "#工作": "#c96442",
  "#学习": "#0ea5e9",
  "#生活": "#f59e0b",
  "#运动": "#22c55e",
  "#创作": "#ec4899",
  "#社交": "#f97316",
  "#休息": "#d97757",
};

interface ActivityCardProps {
  activity: Activity;
  /** 当日最后一条：底部不分隔线 */
  isLastInDay?: boolean;
}

export default function ActivityCard({ activity, isLastInDay }: ActivityCardProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("确定删除这条记录？")) return;
    startTransition(async () => {
      try {
        await deleteActivity(activity.id);
        toast.success("已删除");
      } catch {
        toast.error("删除失败");
      }
    });
  }

  const timeStr = format(new Date(activity.created_at), "HH:mm", { locale: zhCN });

  return (
    <>
      <div className="fade-up group relative flex gap-3 md:gap-4">
        {/* 时间轴节点（竖线由 ActivityTimeline 按日绘制） */}
        <div className="relative z-[2] flex w-7 shrink-0 justify-center md:w-8">
          <span
            className="mt-2 block h-2.5 w-2.5 shrink-0 rounded-full md:h-3 md:w-3"
            style={{
              background: "var(--brand)",
              boxShadow: "0 0 0 3px var(--surface)",
            }}
            aria-hidden
          />
        </div>

        <div
          className={`relative min-w-0 flex-1 pb-6 pt-0.5 md:pb-7 ${!isLastInDay ? "border-b border-[color:var(--border)]" : ""}`}
        >
          {/* 悬停操作 */}
          <div className="absolute right-0 top-0 z-[1] flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg p-2 transition-all hover:opacity-70 md:p-1.5"
              style={{ color: "var(--text-muted)" }}
              aria-label="编辑"
            >
              <Pencil className="h-4 w-4 md:h-3.5 md:w-3.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg p-2 transition-all hover:opacity-70 disabled:opacity-30 md:p-1.5"
              style={{ color: "#ef4444" }}
              aria-label="删除"
            >
              <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" strokeWidth={2} />
            </button>
          </div>

          {/* 时间 / 时长 — 顶部弱对比一行（类似快讯 meta） */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pr-14 md:pr-12">
            <span className="text-xs tabular-nums md:text-[11px]" style={{ color: "var(--text-muted)" }}>
              {timeStr}
            </span>
            {activity.duration_minutes ? (
              <span
                className="text-[11px] font-medium tabular-nums md:text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                {activity.duration_minutes >= 60
                  ? `${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ""}`
                  : `${activity.duration_minutes} 分钟`}
              </span>
            ) : null}
          </div>

          {/* 正文 */}
          <p
            className="mt-2 text-base font-medium leading-snug md:text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {activity.description}
          </p>

          {/* 标签 */}
          {activity.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activity.tags.map((tag) => {
                const color = TAG_COLORS[tag] ?? "var(--brand)";
                return (
                  <span
                    key={tag}
                    className="rounded-md px-2 py-0.5 text-xs font-medium md:text-[11px]"
                    style={{ background: `${color}18`, color }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>编辑记录</DialogTitle>
          </DialogHeader>
          <ActivityForm activity={activity} onSuccess={() => setEditing(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
