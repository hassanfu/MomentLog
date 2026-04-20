"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import type { User } from "@supabase/supabase-js";
import { useTransition } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Layers, User as UserIcon } from "lucide-react";

export default function AppNav({ user }: { user: User }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSignOut() {
    startTransition(async () => {
      const r = await signOut();
      if (r.ok) {
        router.push("/login");
        router.refresh();
      }
    });
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 hidden md:block"
        style={{ background: "var(--nav-glass)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2" scroll={false}>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "var(--brand)" }}
            >
              <Layers className="h-3.5 w-3.5 text-white" strokeWidth={2} aria-hidden />
            </div>
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              MomentLog
            </span>
          </Link>

          <div className="flex flex-1 justify-end shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{ color: "var(--text-muted)", background: "var(--brand-subtle)" }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "var(--brand)" }}
              >
                {(user.email?.[0] ?? "U").toUpperCase()}
              </span>
              {pending ? "…" : "退出"}
            </button>
          </div>
        </div>
      </header>

      <div className="fixed right-3 top-3 z-50 md:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <ThemeToggle />
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
        style={{
          background: "var(--nav-glass-mobile)",
          backdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="flex w-full flex-col items-center gap-0.5 py-3 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ color: "var(--text-muted)" }}
        >
          <UserIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
          <span className="text-[10px] font-medium">{pending ? "…" : "退出"}</span>
        </button>
      </nav>
    </>
  );
}

