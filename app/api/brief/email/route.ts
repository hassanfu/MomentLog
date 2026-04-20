import { createClient } from "@/lib/supabase/server";
import { resolveBriefRecipientEmail } from "@/lib/brief-recipient-email";
import { PERIOD_LABEL_CN } from "@/lib/brief-period";
import { normalizeResendFrom } from "@/lib/resend-from";
import { Resend } from "resend";
import type { PeriodType } from "@/types";

export const runtime = "nodejs";

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

/** 将 Resend 常见英文错误转写为可理解的说明 */
function formatResendErrorForUser(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("only send testing emails") || m.includes("verify a domain at resend.com")) {
    return [
      "当前为 Resend 测试环境：用默认/未验证域发信时，收件人只能是你 Resend 账号里登记的那封邮箱。",
      "解决方式二选一：",
      "1）在 MomentLog 用与 Resend 相同的那封邮箱登录，再发邮件；",
      "2）在 resend.com/domains 添加并验证自己的域名，把发件人 RESEND_FROM_EMAIL 改为该域名下地址，即可发到你在 App 里的登录邮箱。",
    ].join("");
  }
  return message;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const to = resolveBriefRecipientEmail(user);
  if (!to) {
    return Response.json(
      {
        error:
          "当前账号没有可用于收件的邮箱（例如仅手机号登录）。请改用邮箱或 Google 登录 MomentLog，或在 Supabase 里为该用户补充邮箱后再试。",
      },
      { status: 400 },
    );
  }

  let body: { id?: string };
  try {
    body = (await req.json()) as { id?: string };
  } catch {
    return Response.json({ error: "请求格式无效" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) return Response.json({ error: "缺少简报 id" }, { status: 400 });

  const { data: row, error } = await supabase
    .from("saved_briefs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !row) {
    return Response.json({ error: "找不到该简报或无权限" }, { status: 404 });
  }

  const resend = getResend();
  if (!resend) {
    return Response.json({ error: "服务端未配置 RESEND_API_KEY，暂时无法发邮件" }, { status: 503 });
  }

  const periodType = row.period_type as PeriodType;
  const label = PERIOD_LABEL_CN[periodType] ?? "AI 简报";
  const subject = `[MomentLog] ${label}`;

  const from = normalizeResendFrom(process.env.RESEND_FROM_EMAIL);

  try {
    const { error: sendErr } = await resend.emails.send({
      from,
      to,
      subject,
      text: row.body_markdown as string,
    });

    if (sendErr) {
      console.error("[api/brief/email]", sendErr);
      const raw =
        sendErr && typeof sendErr === "object" && "message" in sendErr
          ? String((sendErr as { message: string }).message)
          : "发送失败";
      return Response.json({ error: formatResendErrorForUser(raw) }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[api/brief/email]", e);
    const raw = e instanceof Error ? e.message : "发送失败";
    return Response.json({ error: formatResendErrorForUser(raw) }, { status: 502 });
  }
}
