import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getErrorMessage } from "@ai-sdk/provider";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { buildBriefPrompt } from "@/lib/prompts";
import { getActivities } from "@/lib/actions/activities";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns";
import type { PeriodType } from "@/types";

/** Vercel / 长耗时流式响应 */
export const maxDuration = 120;

function briefStreamUserMessage(error: unknown): string {
  const base = getErrorMessage(error);
  console.error("[api/brief]", error);
  return base;
}

/**
 * 若从仓库父目录启动 Next，`process.cwd()` 可能指向父级，导致读不到 `momentlog/.env.local`。
 * 部署环境（Vercel 等）无本地文件时，此行不会生效，应使用平台环境变量。
 */
function hydrateDeepSeekApiKeyFromDisk() {
  if (process.env.DEEPSEEK_API_KEY?.trim()) return;

  const roots = [process.cwd(), path.join(process.cwd(), "momentlog")];
  for (const root of roots) {
    for (const name of [".env.local", ".env"] as const) {
      const file = path.join(root, name);
      if (!fs.existsSync(file)) continue;
      let raw: string;
      try {
        raw = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        const key = t.slice(0, eq).trim();
        if (key !== "DEEPSEEK_API_KEY") continue;
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
}

export async function POST(req: Request) {
  hydrateDeepSeekApiKeyFromDisk();

  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    return Response.json(
      { error: "未配置 DEEPSEEK_API_KEY，无法调用 DeepSeek。请在 platform.deepseek.com 创建 API Key。" },
      { status: 503 },
    );
  }

  const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { period, referenceDate } = await req.json() as { period: PeriodType; referenceDate: string };

  const ref = new Date(referenceDate + "T00:00:00");
  let periodStart: string, periodEnd: string;

  switch (period) {
    case "week":
      periodStart = format(startOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd");
      periodEnd = format(endOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd");
      break;
    case "month":
      periodStart = format(startOfMonth(ref), "yyyy-MM-dd");
      periodEnd = format(endOfMonth(ref), "yyyy-MM-dd");
      break;
    case "year":
      periodStart = format(startOfYear(ref), "yyyy-MM-dd");
      periodEnd = format(endOfYear(ref), "yyyy-MM-dd");
      break;
    default:
      periodStart = format(startOfDay(ref), "yyyy-MM-dd");
      periodEnd = format(endOfDay(ref), "yyyy-MM-dd");
  }

  const activities = await getActivities(period, referenceDate);

  const prompt = buildBriefPrompt(activities, period, periodStart, periodEnd);

  try {
    const result = streamText({
      model: deepseek("deepseek-chat"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxOutputTokens: 2000,
    });

    // 与 @ai-sdk/react useCompletion 默认 streamProtocol: "data"（SSE UI chunks）对齐
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
