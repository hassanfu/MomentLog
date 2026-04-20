import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getErrorMessage } from "@ai-sdk/provider";
import { createClient } from "@/lib/supabase/server";
import { getActivities } from "@/lib/actions/activities";
import { getPeriodBounds } from "@/lib/brief-period";
import { computeBriefPromptStats } from "@/lib/brief-stats";
import type { BriefActivityRow, BriefPeriod } from "@/lib/prompts";
import { buildBriefPrompt } from "@/lib/prompts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Activity, PeriodType } from "@/types";

/** Vercel / 长耗时流式响应 */
export const maxDuration = 120;

/** 确保走 Node Runtime，避免 Edge 与部分依赖不兼容 */
export const runtime = "nodejs";

function briefStreamUserMessage(error: unknown): string {
  const base = getErrorMessage(error);
  console.error("[api/brief]", error);
  return base;
}

/**
 * DeepSeek 文档示例与 curl 一致：POST https://api.deepseek.com/chat/completions
 * AI SDK 会拼接 baseURL + `/chat/completions`，故此处使用无尾斜杠的根地址。
 */
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/**
 * @ai-sdk/openai 流式请求会带 `stream_options`，部分兼容服务不接受，可能导致异常响应。
 */
function deepseekCompatibleFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (init?.method === "POST" && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      if ("stream_options" in body) {
        delete body.stream_options;
        return fetch(input, { ...init, body: JSON.stringify(body) });
      }
    } catch {
      /* 保持原样 */
    }
  }
  return fetch(input, init);
}

/** 本地若从仓库父目录启动 Next，尝试从 momentlog/.env.local 读取（部署环境无文件则跳过） */
function hydrateDeepSeekApiKeyFromDisk() {
  if (process.env.DEEPSEEK_API_KEY?.trim()) return;
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const roots = [process.cwd(), path.join(process.cwd(), "momentlog")];
    for (const root of roots) {
      for (const name of [".env.local", ".env"] as const) {
        const file = path.join(root, name);
        if (!fs.existsSync(file)) continue;
        const raw = fs.readFileSync(file, "utf8");
        for (const line of raw.split(/\r?\n/)) {
          const t = line.trim();
          if (!t || t.startsWith("#")) continue;
          const eq = t.indexOf("=");
          if (eq === -1) continue;
          if (t.slice(0, eq).trim() !== "DEEPSEEK_API_KEY") continue;
          let val = t.slice(eq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (val) {
            process.env.DEEPSEEK_API_KEY = val;
            return;
          }
        }
      }
    }
  } catch {
    /* 无 fs（极少）或非 Node */
  }
}

function formatBriefDateRangeLabel(periodStart: string, periodEnd: string): string {
  const s = new Date(periodStart + "T12:00:00");
  const e = new Date(periodEnd + "T12:00:00");
  if (periodStart === periodEnd) {
    return format(s, "yyyy年M月d日", { locale: zhCN });
  }
  return `${format(s, "yyyy年M月d日", { locale: zhCN })} — ${format(e, "yyyy年M月d日", { locale: zhCN })}`;
}

export async function POST(req: Request) {
  hydrateDeepSeekApiKeyFromDisk();

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "未配置 DEEPSEEK_API_KEY，无法调用 DeepSeek。请在 Vercel Environment Variables 中配置并重新部署。" },
      { status: 503 },
    );
  }

  const deepseek = createOpenAI({
    name: "deepseek",
    apiKey,
    baseURL: DEEPSEEK_BASE_URL,
    fetch: deepseekCompatibleFetch,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { period, referenceDate } = (await req.json()) as { period: PeriodType; referenceDate: string };

  const { periodStart, periodEnd } = getPeriodBounds(referenceDate, period);

  const activities = (await getActivities(period, referenceDate)) as Activity[];

  const stats = computeBriefPromptStats(activities);
  const rows: BriefActivityRow[] = activities.map((a) => ({
    title: (a.description ?? "").trim() || "（无描述）",
    tags: a.tags as string[],
    durationMinutes: a.duration_minutes,
  }));

  const prompt = buildBriefPrompt({
    period: period as BriefPeriod,
    dateRangeLabel: formatBriefDateRangeLabel(periodStart, periodEnd),
    stats,
    activities: rows,
  });

  try {
    const result = streamText({
      // 必须用 .chat：默认 deepseek(...) 走 OpenAI Responses API（/v1/responses），DeepSeek 仅支持 Chat Completions
      model: deepseek.chat("deepseek-chat"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxOutputTokens: 3500,
    });

    return result.toUIMessageStreamResponse({
      onError: briefStreamUserMessage,
    });
  } catch (e) {
    console.error("[api/brief]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "简报接口异常" },
      { status: 500 },
    );
  }
}
