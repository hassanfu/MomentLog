/** 校验 Next 构建/运行时必需的公开环境变量（Supabase）。缺失时抛出可读错误，便于排查 Vercel 配置。 */
export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "MomentLog：缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。" +
        "请在 Vercel → Project → Settings → Environment Variables 中为 Production（及需要的 Preview）填写 Supabase URL 与 anon key，保存后重新 Deploy（勿仅用缓存）。",
    );
  }
  return { url, anonKey };
}
