"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ParsedBriefLayout } from "@/lib/brief-markdown-parse";

const mdSurface =
  "text-[15px] leading-relaxed [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2 [&_strong]:font-medium [&_a]:underline";

const mdCore =
  "text-[15px] leading-relaxed [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_li]:marker:text-[#faf9f5]/90 [&_p]:my-2 [&_strong]:font-medium [&_a]:underline [&_a]:text-[#faf9f5]";

export function BriefLayout({ parsed }: { parsed: ParsedBriefLayout }) {
  const sug = parsed.suggestion?.trim();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <div
          className="brief-card-elevated rounded-2xl border p-5 md:p-6"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
        >
          <h3 className="brief-serif-heading mb-3 text-[1rem] leading-snug">概述</h3>
          {parsed.overview ? (
            <article className={`brief-prose-article ${mdSurface}`} style={{ color: "var(--text-primary)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.overview}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
              —
            </p>
          )}
        </div>

        <div
          className="brief-card-elevated rounded-2xl border p-5 md:p-6"
          style={{ background: "var(--surface-elevated)", borderColor: "var(--border)" }}
        >
          <h3 className="brief-serif-heading mb-3 text-[1rem] leading-snug">建议</h3>
          {sug ? (
            <article className={`brief-prose-article ${mdSurface}`} style={{ color: "var(--text-primary)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sug}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-[15px]" style={{ color: "var(--text-muted)" }}>
              继续保持就好～
            </p>
          )}
        </div>
      </div>

      <div
        className="brief-card-elevated rounded-[20px] border p-6 md:p-7"
        style={{
          background: "var(--brand)",
          borderColor: "rgba(201, 100, 66, 0.45)",
          color: "#faf9f5",
        }}
      >
        <h3 className="brief-serif-heading mb-3 text-[1rem] leading-snug" style={{ color: "#faf9f5" }}>
          核心
        </h3>
        {parsed.core ? (
          <article className={`brief-prose-article ${mdCore} [&_*]:text-[#faf9f5]`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.core}</ReactMarkdown>
          </article>
        ) : (
          <p className="text-[15px] text-[#faf9f5]/90">—</p>
        )}
      </div>
    </div>
  );
}
