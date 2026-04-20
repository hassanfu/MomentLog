"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface Props {
  /** 额外 class，用于桌面 / 移动端不同位置 */
  className?: string;
}

/** 单日 / 夜间切换：跟随系统默认，也可手动切 light / dark */
export function ThemeToggle({ className = "" }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "切换到浅色" : "切换到深色"}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      style={{
        background: "var(--brand-subtle)",
        color: "var(--brand)",
      }}
      disabled={!mounted}
    >
      {!mounted ? (
        <span className="h-4 w-4 rounded-full opacity-40" style={{ background: "var(--border)" }} />
      ) : isDark ? (
        <Sun className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}
