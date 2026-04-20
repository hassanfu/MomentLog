"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions/activities";
import { toast } from "sonner";
import { format } from "date-fns";
import { Save } from "lucide-react";
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
      className="rounded-2xl border p-5 md:p-4"
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
        className="w-full resize-none bg-transparent text-base md:text-sm leading-relaxed outline-none placeholder:opacity-70"
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
              className="rounded-lg px-3 py-1.5 text-sm md:text-xs font-medium transition-all min-h-[40px] md:min-h-0"
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

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
        <label
          className="flex flex-wrap items-center gap-2 text-sm md:flex-1 md:text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <span>时长（分钟，可选）</span>
          <input
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="—"
            className="w-[5.5rem] rounded-lg border px-3 py-2 md:py-1 text-base md:text-xs outline-none min-h-[44px] md:min-h-0"
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
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition-opacity hover:opacity-90 disabled:opacity-50 min-h-[48px] touch-manipulation md:w-auto md:px-4 md:py-2 md:text-sm md:min-h-0"
          style={{
            background: "var(--brand-subtle)",
            color: "var(--brand)",
            border: "1px solid var(--brand)",
          }}
        >
          <Save className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
          {pending ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
