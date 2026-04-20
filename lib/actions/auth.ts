"use server";

import { createClient } from "@/lib/supabase/server";

/** Server Actions must not call redirect() when invoked from Client Components — it surfaces as NEXT_REDIRECT. */

export async function signInWithGoogle(): Promise<
  | { ok: true; url: string }
  | { ok: false; message: string }
> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl.replace(/\/$/, "")}/callback`,
    },
  });
  if (error) return { ok: false, message: error.message };
  if (!data.url) return { ok: false, message: "未能获取 Google 登录地址" };
  return { ok: true, url: data.url };
}

export async function signInWithEmail(formData: FormData): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function signUpWithEmail(formData: FormData): Promise<
  { ok: true; needsEmailConfirm: boolean } | { ok: false; message: string }
> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/callback`,
    },
  });
  if (error) return { ok: false, message: error.message };

  // If email confirmation is off, user has a session immediately
  const needsEmailConfirm = !data.session;
  return { ok: true, needsEmailConfirm };
}

export async function signOut(): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
