"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPeriodBounds } from "@/lib/brief-period";
import type { PeriodType } from "@/types";
import type { SavedBrief } from "@/types";

export async function listSavedBriefs(): Promise<SavedBrief[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_briefs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[listSavedBriefs]", error.message);
    return [];
  }
  return (data ?? []) as SavedBrief[];
}

export async function saveBriefMarkdown(input: {
  markdown: string;
  period: PeriodType;
  referenceDate: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const raw = input.markdown.trim();
  if (!raw) return { ok: false, error: "内容为空" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };

  const { periodStart, periodEnd } = getPeriodBounds(input.referenceDate, input.period);

  const { data, error } = await supabase
    .from("saved_briefs")
    .insert({
      user_id: user.id,
      period_type: input.period,
      reference_date: input.referenceDate,
      period_start: periodStart,
      period_end: periodEnd,
      body_markdown: raw,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[saveBriefMarkdown]", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true, id: data?.id };
}

export async function deleteSavedBrief(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "未登录" };

  const { error } = await supabase.from("saved_briefs").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("[deleteSavedBrief]", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}
