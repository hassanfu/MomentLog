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
        className="fade-up group rounded-2xl p-4 transition-all hover:shadow-sm"
        style={{
          background: "var(--surface-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
              {activity.description}
            </p>

            {activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activity.tags.map((tag) => {
                  const color = TAG_COLORS[tag] ?? "var(--brand)";
                  return (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ background: `${color}18`, color }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {timeStr}
              </span>
              {activity.duration_minutes && (
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                >
                  {activity.duration_minutes >= 60
                    ? `${Math.floor(activity.duration_minutes / 60)}h${activity.duration_minutes % 60 > 0 ? ` ${activity.duration_minutes % 60}m` : ""}`
                    : `${activity.duration_minutes}m`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg transition-all hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="编辑"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1.5 rounded-lg transition-all hover:opacity-70 disabled:opacity-30"
              style={{ color: "#ef4444" }}
              aria-label="删除"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
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
