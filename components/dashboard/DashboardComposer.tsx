"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions/activities";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tag } from "@/types";

const PRESET_TAGS: Tag[] = ["#工作", "#学习", "#生活", "#运动", "#创作", "#社交", "#休息"];

const TAG_COLORS: Record<string, string> = {
  "#工作": "#c96442",
  "#学习": "#0ea5e9",
  "#生活": "#f59e0b",
  "#运动": "#22c55e",
  "#创作": "#ec4899",
  "#社交": "#f97316",
  "#休息": "#d97757",
};

export default function DashboardComposer() {
  const router = useRouter();
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [duration, setDuration] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleTag(t: Tag) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function submit() {
    const text = desc.trim();
    if (!text) {
      toast.error("写点什么再保存吧");
      return;
    }
    startTransition(async () => {
      try {
        await createActivity({
          date: format(new Date(), "yyyy-MM-dd"),
          description: text,
          tags,
          duration_minutes: duration ? Number(duration) : null,
        });
        toast.success("已记录");
        setDesc("");
        setTags([]);
        setDuration("");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "保存失败");
      }
    });
  }

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--surface-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="现在的想法是…"
        rows={5}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:opacity-70"
        style={{ color: "var(--text-primary)" }}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const on = tags.includes(tag);
          const color = TAG_COLORS[tag] ?? "var(--brand)";
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
              style={{
                background: on ? `${color}22` : "var(--surface)",
                color: on ? color : "var(--text-muted)",
                border: `1px solid ${on ? color : "var(--border)"}`,
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>时长（分钟，可选）</span>
          <input
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="—"
            className="w-20 rounded-lg border px-2 py-1 text-xs outline-none"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {pending ? "保存中…" : "保存记录"}
        </button>
      </div>
    </div>
  );
}
