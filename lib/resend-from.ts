/**
 * Resend 要求 from 为 `email@domain` 或 `Display Name <email@domain>`。
 * 规范化 Vercel / .env 里常见的写法错误，避免 Invalid 'from' field。
 */

const DEFAULT_FROM = "MomentLog <onboarding@resend.dev>";

/** 不含尖括号的裸邮箱 */
const BARE_EMAIL = /^[^\s<>]+@[^\s<>]+$/;

function validateBareEmail(s: string): boolean {
  return BARE_EMAIL.test(s.trim());
}

/**
 * @param raw - 例如 `noreply@yourdomain.com`、`MomentLog <noreply@yourdomain.com>`、`MomentLog<noreply@x.com>`
 */
export function normalizeResendFrom(raw: string | undefined | null): string {
  let t = String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .trim();

  if (!t) return DEFAULT_FROM;

  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }

  if (validateBareEmail(t)) {
    return `MomentLog <${t.trim()}>`;
  }

  // Name <email@domain>（允许名称中含空格）
  const bracket = /^([\s\S]*?)<\s*([^\s<>]+@[^\s<>]+)\s*>$/.exec(t);
  if (bracket) {
    const name = bracket[1].trim().replace(/^["']|["']$/g, "");
    const addr = bracket[2].trim();
    if (validateBareEmail(addr) && name.length > 0) {
      return `${name} <${addr}>`;
    }
  }

  console.warn(
    "[normalizeResendFrom] RESEND_FROM_EMAIL 无法解析为合法 from，已使用默认发件人。请使用「仅邮箱」或「名称 <邮箱>」格式。",
  );
  return DEFAULT_FROM;
}
