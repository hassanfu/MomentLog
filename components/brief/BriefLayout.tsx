"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ParsedBriefLayout } from "@/lib/brief-markdown-parse";

const mdSurface =
  "text-sm leading-relaxed [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_strong]:font-semibold [&_a]:underline";

const mdBrand =
  "text-sm leading-relaxed [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_li]:marker:text-white/85 [&_p]:my-2 [&_strong]:font-semibold [&_a]:underline [&_a]:text-white";

export function BriefLayout({ parsed }: { parsed: ParsedBriefLayout }) {
  const sug = parsed.suggestion?.trim();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 border"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            概述
          </h3>
          {parsed.overview ? (
            <article className={mdSurface} style={{ color: "var(--text-primary)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.overview}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              —
            </p>
          )}
        </div>

        <div
          className="rounded-2xl p-4 border"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            建议
          </h3>
          {sug ? (
            <article className={mdSurface} style={{ color: "var(--text-primary)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sug}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              继续保持就好～
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--brand)", color: "white" }}>
        <h3 className="text-sm font-semibold mb-3 text-white">核心</h3>
        {parsed.core ? (
          <article className={`${mdBrand} [&_*]:text-white [&_code]:text-white/90`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.core}</ReactMarkdown>
          </article>
        ) : (
          <p className="text-sm text-white/85">—</p>
        )}
      </div>
    </div>
  );
}
