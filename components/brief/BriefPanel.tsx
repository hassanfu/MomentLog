"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import type { BriefContent, PeriodType } from "@/types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { zhCN } from "date-fns/locale";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const PERIOD_OPTIONS: { value: PeriodType; label: string; emoji: string }[] = [
  { value: "day", label: "今日简报", emoji: "☀️" },
  { value: "week", label: "本周回顾", emoji: "📅" },
  { value: "month", label: "本月总结", emoji: "🗓️" },
  { value: "year", label: "年度回顾", emoji: "✨" },
];

const CHART_COLORS = ["#7132f5", "#0ea5e9", "#22c55e", "#f59e0b", "#ec4899", "#f97316", "#8b5cf6"];

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

/** 从模型输出中提取 JSON（支持 ```json 围栏、首尾杂讯） */
function extractBriefJson(raw: string): BriefContent | null {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```/m;
  const fm = s.match(fence);
  if (fm) s = fm[1].trim();

  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          const obj = JSON.parse(s.slice(start, i + 1)) as unknown;
          if (
            obj &&
            typeof obj === "object" &&
            "title" in obj &&
            typeof (obj as BriefContent).title === "string" &&
            "summary" in obj &&
            typeof (obj as BriefContent).summary === "string"
          ) {
            return obj as BriefContent;
          }
        } catch {
          return null;
        }
      }
    }
  }
  return null;
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

export default function BriefPanel() {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [parsedBrief, setParsedBrief] = useState<BriefContent | null>(null);
  const [parseError, setParseError] = useState(false);

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/brief",
    credentials: "same-origin",
    onFinish: (_prompt, text) => {
      const parsed = extractBriefJson(text);
      if (parsed) {
        setParsedBrief(parsed);
        setParseError(false);
      } else {
        setParsedBrief(null);
        setParseError(text.trim().length > 0);
      }
    },
  });

  async function generateBrief(p: PeriodType) {
    setPeriod(p);
    setParsedBrief(null);
    setParseError(false);
    await complete("", {
      body: { period: p, referenceDate: format(new Date(), "yyyy-MM-dd") },
    });
  }

  const { start, end } = getPeriodDates(period);
  const periodLabel = {
    day: format(new Date(), "M月d日 EEEE", { locale: zhCN }),
    week: `${format(new Date(start + "T00:00:00"), "M月d日", { locale: zhCN })} — ${format(new Date(end + "T00:00:00"), "M月d日", { locale: zhCN })}`,
    month: format(new Date(), "yyyy年M月", { locale: zhCN }),
    year: format(new Date(), "yyyy年", { locale: zhCN }),
  }[period];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
          AI 简报
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          让 AI 为你的活动生成专业洞察
        </p>
      </div>

      {/* Period buttons */}
      <div className="grid grid-cols-2 gap-2">
        {PERIOD_OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => generateBrief(value)}
            disabled={isLoading}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 text-left"
            style={{
              background: period === value && (isLoading || parsedBrief) ? "var(--brand)" : "var(--surface-elevated)",
              color: period === value && (isLoading || parsedBrief) ? "white" : "var(--text-primary)",
              border: `1px solid ${period === value && (isLoading || parsedBrief) ? "var(--brand)" : "var(--border)"}`,
            }}
          >
            <span className="text-base">{emoji}</span>
            <span>{label}</span>
            {isLoading && period === value && (
              <span className="ml-auto">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 首字节未到时也显示加载，避免空白等待 */}
      {isLoading && !completion && (
        <div
          className="rounded-2xl p-6 flex items-center gap-3"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <svg className="animate-spin shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--brand)" strokeOpacity="0.25" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>正在连接 AI 并生成简报…</span>
        </div>
      )}

      {/* Streaming raw output while loading (after first chunk) */}
      {isLoading && completion && !parsedBrief && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--brand)" }}>AI 正在生成简报…</span>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-mono max-h-[min(40vh,320px)] overflow-y-auto" style={{ color: "var(--text-muted)" }}>
            {completion}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-sm text-red-500">生成失败：{formatBriefApiErrorMessage(error)}</p>
        </div>
      )}

      {/* Parsed brief */}
      {parsedBrief && !isLoading && (
        <BriefDisplay brief={parsedBrief} periodLabel={periodLabel} />
      )}

      {/* 解析失败或未识别为 JSON：展示原始输出 */}
      {!isLoading && completion && !parsedBrief && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm mb-2 font-medium" style={{ color: "var(--text-secondary)" }}>
            {parseError ? "未能解析为 JSON，以下为原始回复：" : "未收到有效内容"}
          </p>
          {completion ? (
            <pre className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{completion}</pre>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>请检查是否已配置 DEEPSEEK_API_KEY，或稍后重试。</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !parsedBrief && !error && !completion && (
        <div className="text-center py-12">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--brand-subtle)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            选择时间段生成 AI 简报
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            基于你的活动记录，AI 将生成温暖专业的个人洞察
          </p>
        </div>
      )}
    </div>
  );
}

function BriefDisplay({ brief, periodLabel }: { brief: BriefContent; periodLabel: string }) {
  return (
    <div className="space-y-4 fade-up">
      {/* Title card */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "var(--brand)", color: "white" }}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
          style={{ background: "white", transform: "translate(30%, -30%)" }}
        />
        <p className="text-xs font-medium opacity-70 mb-1">{periodLabel}</p>
        <h2 className="text-lg font-bold leading-snug tracking-tight">{brief.title}</h2>
        <p className="text-xs opacity-70 mt-3 italic">{brief.encouragement}</p>
      </div>

      {/* Summary */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          总结
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {brief.summary}
        </p>
      </div>

      {/* Key events */}
      {brief.keyEvents?.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            关键事件
          </h3>
          <ul className="space-y-2">
            {brief.keyEvents.map((event, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{event}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Time allocation chart */}
      {brief.timeAllocation?.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
            时间分配
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={brief.timeAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="minutes"
                >
                  {brief.timeAllocation.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}分钟`, ""]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 w-full">
              {brief.timeAllocation.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{item.category}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.minutes}分钟
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {brief.insights?.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            成长洞察
          </h3>
          <ul className="space-y-2.5">
            {brief.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                </svg>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
