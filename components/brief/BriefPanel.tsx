"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { PeriodType, SavedBrief } from "@/types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { zhCN } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { listSavedBriefs, saveBriefMarkdown, deleteSavedBrief } from "@/lib/actions/saved-briefs";
import { PERIOD_LABEL_CN } from "@/lib/brief-period";
import { parseBriefMarkdown, shouldUseBriefLayout, stripOuterMarkdownFence } from "@/lib/brief-markdown-parse";
import { BriefLayout } from "@/components/brief/BriefLayout";

const PERIOD_OPTIONS: { value: PeriodType; label: string; emoji: string }[] = [
  { value: "day", label: "今日简报", emoji: "☀️" },
  { value: "week", label: "本周回顾", emoji: "📅" },
  { value: "month", label: "本月回顾", emoji: "🗓️" },
  { value: "year", label: "本年回顾", emoji: "✨" },
];

function formatBriefApiErrorMessage(err: Error): string {
  const m = err.message.trim();
  if (m.startsWith("{") && m.includes("error")) {
    try {
      const j = JSON.parse(m) as { error?: string };
      if (typeof j.error === "string" && j.error) return j.error;
    } catch {
      /* 使用原文 */
    }
  }
  return m;
}

function getPeriodDates(period: PeriodType): { start: string; end: string } {
  const today = new Date();
  switch (period) {
    case "week":
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "month":
      return { start: format(startOfMonth(today), "yyyy-MM-dd"), end: format(endOfMonth(today), "yyyy-MM-dd") };
    case "year":
      return { start: format(startOfYear(today), "yyyy-MM-dd"), end: format(endOfYear(today), "yyyy-MM-dd") };
    default:
      return { start: format(today, "yyyy-MM-dd"), end: format(today, "yyyy-MM-dd") };
  }
}

function BriefMarkdownBody({ text }: { text: string }) {
  const src = stripOuterMarkdownFence(text);
  return (
    <article
      className="[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3:first-child]:mt-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_strong]:font-medium [&_a]:underline [&_a]:opacity-90"
      style={{ color: "var(--text-primary)" }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{src}</ReactMarkdown>
    </article>
  );
}

export default function BriefPanel() {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [saved, setSaved] = useState<SavedBrief[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  /** 当前「本次生成」是否已成功手动保存（新生成或重新生成会清零） */
  const [draftSaved, setDraftSaved] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const genContextRef = useRef({
    period: "day" as PeriodType,
    refDate: format(new Date(), "yyyy-MM-dd"),
  });

  const refreshSaved = useCallback(async () => {
    const rows = await listSavedBriefs();
    setSaved(rows);
  }, []);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/brief",
    credentials: "same-origin",
  });

  async function handleSaveDraft() {
    const trimmed = completion?.trim();
    if (!trimmed) return;
    setSavingDraft(true);
    const { period: p, refDate } = genContextRef.current;
    const result = await saveBriefMarkdown({
      markdown: trimmed,
      period: p,
      referenceDate: refDate,
    });
    if (result.ok) {
      setDraftSaved(true);
      toast.success("已保存到下方「已保存的简报」");
      await refreshSaved();
    } else {
      toast.error(result.error ?? "保存失败", {
        description: "若尚未在 Supabase 创建表，请在 SQL 编辑器执行 supabase/migrations 中的 saved_briefs 脚本。",
      });
    }
    setSavingDraft(false);
  }

  async function generateBrief(p: PeriodType) {
    setDraftSaved(false);
    const refDate = format(new Date(), "yyyy-MM-dd");
    genContextRef.current = { period: p, refDate };
    setPeriod(p);
    await complete("", {
      body: { period: p, referenceDate: refDate },
    });
  }

  async function handleSendEmail(id: string) {
    setSendingId(id);
    try {
      const res = await fetch("/api/brief/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "发送失败");
        return;
      }
      toast.success("已发送到你的登录邮箱");
    } catch {
      toast.error("网络异常，发送失败");
    } finally {
      setSendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteSavedBrief(id);
    if (result.ok) {
      toast.success("已删除");
      setSaved((prev) => prev.filter((x) => x.id !== id));
    } else {
      toast.error(result.error ?? "删除失败");
    }
    setDeletingId(null);
  }

  const hasOutput = !!completion?.trim();
  const activeStyle = (value: PeriodType) => period === value && (isLoading || !!completion?.trim());

  const { start, end } = getPeriodDates(period);
  const periodLabel = {
    day: format(new Date(), "M月d日 EEEE", { locale: zhCN }),
    week: `${format(new Date(start + "T00:00:00"), "M月d日", { locale: zhCN })} — ${format(new Date(end + "T00:00:00"), "M月d日", { locale: zhCN })}`,
    month: format(new Date(), "yyyy年M月", { locale: zhCN }),
    year: format(new Date(), "yyyy年", { locale: zhCN }),
  }[period];

  const showBigEmpty = !isLoading && !hasOutput && !error && saved.length === 0;

  const parsedCompletion = completion ? parseBriefMarkdown(completion) : null;
  const showParsedLayout =
    Boolean(completion?.trim()) && !isLoading && parsedCompletion && shouldUseBriefLayout(parsedCompletion);

  return (
    <div
      className="brief-skin-v21 brief-card-elevated space-y-8 rounded-[28px] border px-5 py-7 sm:px-9 sm:py-10"
      style={{
        background: "#f5f4ed",
        borderColor: "var(--border)",
      }}
    >
      <div>
        <h1 className="brief-serif-heading text-xl leading-[1.15] sm:text-[1.35rem]">AI 简报</h1>
        <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          基于你的记录生成回顾；需要保留时在「本次生成」里点保存，再在下方列表中删除或发邮件
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {PERIOD_OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            type="button"
            onClick={() => generateBrief(value)}
            disabled={isLoading}
            className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] text-[15px] font-medium leading-snug transition-all hover:opacity-95 disabled:opacity-50 text-left"
            style={{
              background: activeStyle(value) ? "var(--brand)" : "var(--surface-warm-sand)",
              color: activeStyle(value) ? "#faf9f5" : "var(--text-primary)",
              border: `1px solid ${activeStyle(value) ? "var(--brand)" : "var(--border-strong)"}`,
              boxShadow: activeStyle(value) ? "none" : "0 0 0 1px rgba(209, 207, 197, 0.45)",
            }}
          >
            <span className="text-base">{emoji}</span>
            <span>{label}</span>
            {isLoading && period === value && (
              <span className="ml-auto">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(250,249,245,0.35)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#faf9f5" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {(isLoading || hasOutput || error) && (
        <div className="space-y-3">
          <p className="brief-section-overline">本次生成</p>
          {isLoading && !hasOutput && (
            <div
              className="brief-card-elevated flex items-center gap-3 rounded-2xl border p-6"
              style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
            >
              <svg className="animate-spin shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--brand)" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                正在连接 AI 并生成简报…
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-[12px] border p-4" style={{ background: "var(--brief-error-bg)", borderColor: "var(--brief-error-border)" }}>
              <p className="text-sm" style={{ color: "var(--brief-error)" }}>
                生成失败：{formatBriefApiErrorMessage(error)}
              </p>
            </div>
          )}

          {hasOutput && completion && (
            <div className="space-y-2 fade-up">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {periodLabel}
                </p>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <span className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--brand)" }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--brand)" }} />
                      生成中…
                    </span>
                  )}
                  {!isLoading && (
                    <button
                      type="button"
                      disabled={draftSaved || savingDraft}
                      onClick={handleSaveDraft}
                      className="rounded-[10px] px-3.5 py-2 text-[13px] font-medium transition-opacity disabled:opacity-60 hover:opacity-90"
                      style={{
                        background: draftSaved ? "var(--surface-warm-sand)" : "var(--brand)",
                        color: draftSaved ? "var(--text-muted)" : "#faf9f5",
                        border: draftSaved ? "1px solid var(--border-strong)" : "none",
                        boxShadow: draftSaved ? "inset 0 0 0 1px rgba(209,207,197,0.5)" : "0 0 0 1px rgba(201,100,66,0.35)",
                      }}
                    >
                      {savingDraft ? "保存中…" : draftSaved ? "已保存" : "保存到列表"}
                    </button>
                  )}
                </div>
              </div>
              {isLoading ? (
                <div
                  className="brief-card-elevated rounded-2xl border p-5 md:p-6"
                  style={{ background: "#ffffff", borderColor: "var(--border)" }}
                >
                  <BriefMarkdownBody text={completion} />
                </div>
              ) : showParsedLayout && parsedCompletion ? (
                <BriefLayout parsed={parsedCompletion} />
              ) : (
                <div
                  className="brief-card-elevated rounded-2xl border p-5 md:p-6"
                  style={{ background: "#ffffff", borderColor: "var(--border)" }}
                >
                  <BriefMarkdownBody text={completion} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <section className="space-y-3" aria-label="已保存的简报">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="brief-serif-heading text-base leading-snug">已保存的简报</h2>
          {saved.length > 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              最近 {saved.length} 条
            </span>
          )}
        </div>

        {saved.length === 0 ? (
          <div
            className="rounded-2xl border-2 border-dashed py-10 px-4 text-center text-[15px] leading-relaxed"
            style={{
              background: "var(--surface-elevated)",
              borderColor: "var(--border-strong)",
              color: "var(--text-muted)",
            }}
          >
            还没有存档。在「本次生成」里点击「保存到列表」后，简报会出现在这里；可删除或发到登录邮箱。
          </div>
        ) : (
          <ul className="space-y-3">
            {saved.map((b) => {
              const savedParsed = parseBriefMarkdown(b.body_markdown);
              const useSavedLayout = Boolean(savedParsed && shouldUseBriefLayout(savedParsed));
              return (
                <li key={b.id}>
                  <div
                    className="brief-card-elevated flex flex-col overflow-hidden rounded-2xl border"
                    style={{ background: "#ffffff", borderColor: "var(--border)" }}
                  >
                    <div
                      className="flex flex-wrap items-center gap-2 justify-between px-4 py-3 gap-y-2"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <div className="min-w-0">
                        <p className="brief-serif-heading truncate text-[15px]" style={{ color: "var(--text-primary)" }}>
                          {PERIOD_LABEL_CN[b.period_type]}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {format(new Date(b.created_at), "yyyy年M月d日 HH:mm", { locale: zhCN })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={sendingId === b.id}
                          onClick={() => handleSendEmail(b.id)}
                          className="rounded-[10px] px-3 py-2 text-[12px] font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
                          style={{
                            background: "var(--brand-subtle)",
                            color: "var(--brand)",
                            boxShadow: "inset 0 0 0 1px rgba(201, 100, 66, 0.2)",
                          }}
                        >
                          {sendingId === b.id ? "发送中…" : "发邮件"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === b.id}
                          onClick={() => handleDelete(b.id)}
                          className="rounded-[10px] px-3 py-2 text-[12px] font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
                          style={{
                            background: "var(--brief-error-bg)",
                            color: "var(--brief-error)",
                            border: "1px solid var(--brief-error-border)",
                          }}
                        >
                          {deletingId === b.id ? "…" : "删除"}
                        </button>
                      </div>
                    </div>
                    <details className="group">
                      <summary
                        className="px-4 py-2.5 cursor-pointer text-xs list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                        展开 / 收起全文
                      </summary>
                      <div className="px-4 pb-4 pt-0 max-h-[min(70vh,480px)] overflow-y-auto">
                        {useSavedLayout && savedParsed ? (
                          <BriefLayout parsed={savedParsed} />
                        ) : (
                          <BriefMarkdownBody text={b.body_markdown} />
                        )}
                      </div>
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {showBigEmpty && (
        <div className="text-center py-8 -mt-2">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-3"
            style={{ background: "var(--brand-subtle)", boxShadow: "inset 0 0 0 1px rgba(201, 100, 66, 0.15)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            点击上方卡片开始
          </p>
        </div>
      )}
    </div>
  );
}
