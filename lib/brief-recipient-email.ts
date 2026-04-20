import type { User } from "@supabase/supabase-js";

/**
 * 简报「发邮件」的收件人：只发到你本 App 的登录身份能对应到的邮箱。
 * 决策：不另建「通知邮箱」表、不开放用户自填地址，避免被误发/滥用；以 Supabase Auth 为准。
 */
export function resolveBriefRecipientEmail(user: User | null): string | null {
  if (!user) return null;

  const direct = user.email?.trim();
  if (direct) return direct;

  const m = user.user_metadata;
  if (m && typeof m.email === "string" && m.email.includes("@")) {
    return m.email.trim();
  }

  const ids = user.identities;
  if (Array.isArray(ids)) {
    for (const id of ids) {
      const d = id?.identity_data as Record<string, unknown> | undefined;
      const e = d?.email;
      if (typeof e === "string" && e.includes("@")) return e.trim();
    }
  }

  return null;
}
