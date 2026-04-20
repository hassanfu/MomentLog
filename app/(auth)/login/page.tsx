"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  signInWithEmailClient,
  signUpWithEmailClient,
  signInWithGoogleClient,
} from "@/lib/auth-browser";
import { Layers } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isPending, startTransition] = useTransition();

  function handleEmail(formData: FormData) {
    startTransition(async () => {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (mode === "signin") {
        const r = await signInWithEmailClient(email, password);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        // 整页跳转，保证 Supabase 写入的 Cookie 被下一请求（含 proxy）带上
        window.location.assign("/");
        return;
      }

      const r = await signUpWithEmailClient(email, password);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      if (r.needsEmailConfirm) {
        toast.success("验证邮件已发送，请查收邮箱后点击链接完成注册");
        return;
      }
      window.location.assign("/");
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      const r = await signInWithGoogleClient();
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      window.location.assign(r.url);
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4" style={{ background: "var(--surface)" }}>
      <div className="fixed top-4 right-4 z-10 md:top-6 md:right-6">
        <ThemeToggle />
      </div>
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(201,100,66,0.07)" }}
      />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "var(--brand)", boxShadow: "0 8px 24px rgba(201,100,66,0.32)" }}
          >
            <Layers className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="text-2xl tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            MomentLog
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            记录当下，洞见未来
          </p>
        </div>

        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--surface-elevated)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-base" style={{ color: "var(--text-primary)" }}>
            {mode === "signin" ? "登录账户" : "创建账户"}
          </h2>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            使用 Google 继续
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>或</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <form action={handleEmail} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                邮箱地址
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                密码
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {isPending ? "处理中…" : mode === "signin" ? "登录" : "注册"}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            {mode === "signin" ? "还没有账户？" : "已有账户？"}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="ml-1 font-medium"
              style={{ color: "var(--brand)" }}
            >
              {mode === "signin" ? "注册" : "登录"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
