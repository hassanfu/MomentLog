"use client";

import { createClient } from "@/lib/supabase/client";

/** 浏览器内登录：会话写入与 @supabase/ssr 兼容的 Cookie，middleware 可读到用户 */
export async function signInWithEmailClient(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false as const, message: error.message } : { ok: true as const };
}

export async function signUpWithEmailClient(email: string, password: string) {
  const supabase = createClient();
  const site =
    typeof window !== "undefined"
      ? `${window.location.origin}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${site.replace(/\/$/, "")}/callback` },
  });
  if (error) return { ok: false as const, message: error.message };
  const needsEmailConfirm = !data.session;
  return { ok: true as const, needsEmailConfirm };
}

export async function signInWithGoogleClient() {
  const supabase = createClient();
  const site =
    typeof window !== "undefined"
      ? `${window.location.origin}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${site.replace(/\/$/, "")}/callback` },
  });
  if (error) return { ok: false as const, message: error.message };
  if (!data.url) return { ok: false as const, message: "未能获取 Google 登录地址" };
  return { ok: true as const, url: data.url };
}
