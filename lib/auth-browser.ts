"use client";

import { createClient } from "@/lib/supabase/client";

/** 登录失败文案（Supabase 对「用户不存在 / 密码错误」常返回同一类错误，统一用合并提示） */
function mapSignInError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid credentials") ||
    m === "invalid login credentials"
  ) {
    return "邮箱未注册或密码错误";
  }
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return "请先完成邮箱验证";
  }
  if (m.includes("too many requests") || m.includes("rate limit")) {
    return "请求过于频繁，请稍后再试";
  }
  return message;
}

function mapSignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("user already exists") || m.includes("already been registered")) {
    return "该邮箱已注册，请直接登录";
  }
  if (m.includes("password")) {
    if (m.includes("at least") || m.includes("length")) return "密码长度不符合要求";
  }
  return message;
}

/** 浏览器内登录：会话写入与 @supabase/ssr 兼容的 Cookie，middleware 可读到用户 */
export async function signInWithEmailClient(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false as const, message: mapSignInError(error.message) } : { ok: true as const };
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
  if (error) return { ok: false as const, message: mapSignUpError(error.message) };
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
