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
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1.5 rounded-lg transition-all hover:opacity-70 disabled:opacity-30"
              style={{ color: "#ef4444" }}
            >
              <TrashIcon />
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

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
