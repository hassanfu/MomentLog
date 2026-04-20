/** 去掉 .env / Vercel 面板里误粘贴的前后引号 */
function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

function assertHttpUrl(raw: string, envName: string): void {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("protocol");
    }
  } catch {
    throw new Error(
      `${envName} 不是合法的 http(s) 地址。请在 Supabase → Project Settings → API 复制 **Project URL**，` +
        "完整形如 `https://xxxxxxxx.supabase.co`，不要带引号、不要与 anon key 填反、不要漏掉 `https://`。",
    );
  }
}

/** 校验 Next 构建/运行时必需的公开环境变量（Supabase）。缺失或格式错误时抛出可读错误。 */
export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const anonKey = stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");

  if (!url || !anonKey) {
    throw new Error(
      "MomentLog：缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。" +
        "请在 Vercel → Settings → Environment Variables 中填写（Production）并重新 Deploy。",
    );
  }

  assertHttpUrl(url, "NEXT_PUBLIC_SUPABASE_URL");

  return { url, anonKey };
}
