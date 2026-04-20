"use client";

import { useState, useTransition } from "react";
import { createActivity, updateActivity } from "@/lib/actions/activities";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Activity, Tag } from "@/types";

const PRESET_TAGS: Tag[] = ["#工作", "#学习", "#生活", "#运动", "#创作", "#社交", "#休息"];

const TAG_COLORS: Record<string, string> = {
  "#工作": "#7132f5",
  "#学习": "#0ea5e9",
  "#生活": "#f59e0b",
  "#运动": "#22c55e",
  "#创作": "#ec4899",
  "#社交": "#f97316",
  "#休息": "#8b5cf6",
};

interface Props {
  activity?: Activity;
  onSuccess?: () => void;
}

export default function ActivityForm({ activity, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<Tag[]>(activity?.tags ?? []);
  const [customTag, setCustomTag] = useState("");

  function toggleTag(tag: Tag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const t = customTag.trim();
    if (!t) return;
    const formatted = t.startsWith("#") ? t : `#${t}`;
    if (!tags.includes(formatted)) setTags((prev) => [...prev, formatted]);
    setCustomTag("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      date: fd.get("date") as string,
      description: fd.get("description") as string,
      tags,
      duration_minutes: fd.get("duration_minutes")
        ? Number(fd.get("duration_minutes"))
        : null,
    };

    startTransition(async () => {
      try {
        if (activity) {
          await updateActivity(activity.id, data);
          toast.success("记录已更新");
        } else {
          await createActivity(data);
          toast.success("记录成功！");
        }
        onSuccess?.();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "操作失败");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          日期
        </label>
        <input
          name="date"
          type="date"
          required
          defaultValue={activity?.date ?? format(new Date(), "yyyy-MM-dd")}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          在做什么？
        </label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={activity?.description ?? ""}
          placeholder="例：完成了产品需求文档，整理了本周会议笔记..."
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          标签
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_TAGS.map((tag) => {
            const active = tags.includes(tag);
            const color = TAG_COLORS[tag] ?? "var(--brand)";
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="tag-chip px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? `${color}20` : "var(--surface-elevated)",
                  color: active ? color : "var(--text-muted)",
                  border: `1px solid ${active ? color : "var(--border)"}`,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {/* Custom tag input */}
        <div className="flex gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
            placeholder="自定义标签"
            className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="px-3 py-2 rounded-xl text-xs font-medium"
            style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
          >
            添加
          </button>
        </div>
        {/* Selected custom tags */}
        {tags.filter((t) => !PRESET_TAGS.includes(t as Tag)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.filter((t) => !PRESET_TAGS.includes(t as Tag)).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1"
                style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
              >
                {tag}
                <button type="button" onClick={() => setTags((p) => p.filter((t2) => t2 !== tag))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          时长（分钟，可选）
        </label>
        <input
          name="duration_minutes"
          type="number"
          min="1"
          max="1440"
          defaultValue={activity?.duration_minutes ?? ""}
          placeholder="如 90"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--brand)" }}
      >
        {isPending ? "保存中…" : activity ? "更新记录" : "保存记录"}
      </button>
    </form>
  );
}
