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

export default function ActivityCard({ activity }: { activity: Activity }) {
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
      <div
        className="fade-up group relative flex h-full min-h-0 flex-col rounded-2xl border p-4 md:p-4"
        style={{
          background: "var(--surface-elevated)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="absolute right-2 top-2 z-[1] flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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

        {/* 与「已保存的简报」卡片标题一致：衬线 + 15px */}
        <p className="brief-serif-heading mt-0 min-w-0 flex-1 pr-12 text-[15px] leading-snug md:pr-11">
          {activity.description}
        </p>

        {/* 简报卡片时间样式 text-xs muted；时间与标签同一行 */}
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
            {timeStr}
          </span>
          {activity.duration_minutes ? (
            <>
              <span className="select-none text-xs" style={{ color: "var(--text-muted)" }} aria-hidden>
                ·
              </span>
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {activity.duration_minutes >= 60
                  ? `${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ""}`
                  : `${activity.duration_minutes} 分钟`}
              </span>
            </>
          ) : null}
          {activity.tags.map((tag) => {
            const color = TAG_COLORS[tag] ?? "var(--brand)";
            return (
              <span
                key={tag}
                className="rounded-md px-2 py-0.5 text-xs font-medium leading-none"
                style={{ background: `${color}18`, color }}
              >
                {tag}
              </span>
            );
          })}
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
