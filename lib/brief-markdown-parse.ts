/**
 * 解析 AI 简报 Markdown：### 概述 / ### 核心 / ### 建议（兼容旧标题）。
 */

export type ParsedBriefLayout = {
  overview: string;
  core: string;
  suggestion: string | null;
};

export function stripOuterMarkdownFence(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)```$/);
  if (m) return m[1].trim();
  return t;
}

function splitByH3(markdown: string): { title: string; body: string }[] {
  const text = stripOuterMarkdownFence(markdown).trim();
  const re = /^###\s+(.+)$/gm;
  const titles: { index: number; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    titles.push({ index: m.index, title: m[1].trim() });
  }
  if (titles.length === 0) return [];

  const sections: { title: string; body: string }[] = [];
  for (let i = 0; i < titles.length; i++) {
    const start = titles[i].index;
    const titleLineEnd = text.indexOf("\n", start);
    const bodyStart = titleLineEnd === -1 ? text.length : titleLineEnd + 1;
    const end = i + 1 < titles.length ? titles[i + 1].index : text.length;
    const body = text.slice(bodyStart, end).trim();
    sections.push({ title: titles[i].title, body });
  }
  return sections;
}

function classifyTitle(title: string): "overview" | "core" | "suggestion" | "casual" | "unknown" {
  const t = title.replace(/（可选）\s*$/, "").trim();
  if (t === "概述" || /^(今日|本周|本月|本年)概述$/.test(t)) return "overview";
  if (t === "核心" || t === "主要干了啥") return "core";
  if (t === "建议" || /^小建议/.test(t) || /^建议/.test(t)) return "suggestion";
  if (t === "随便说两句") return "casual";
  return "unknown";
}

/**
 * 将正文拆成概述 / 核心 / 建议；「随便说两句」并入概述展示。
 * 无法识别任何小节时返回 null（由调用方回退为整段 Markdown）。
 */
export function parseBriefMarkdown(markdown: string): ParsedBriefLayout | null {
  const sections = splitByH3(markdown);
  if (sections.length === 0) return null;

  const overviewChunks: string[] = [];
  let core = "";
  let suggestion: string | null = null;
  let recognized = 0;

  for (const s of sections) {
    const kind = classifyTitle(s.title);
    if (kind === "unknown") continue;
    recognized += 1;
    if (kind === "overview") overviewChunks.push(s.body);
    else if (kind === "casual") overviewChunks.push(s.body);
    else if (kind === "core") core = s.body;
    else if (kind === "suggestion") suggestion = s.body.trim() || null;
  }

  if (recognized === 0) return null;

  const overview = overviewChunks.filter(Boolean).join("\n\n").trim();
  const coreT = core.trim();
  const sug = suggestion?.trim() ? suggestion : null;

  if (!overview && !coreT && !sug) return null;

  return {
    overview,
    core: coreT,
    suggestion: sug,
  };
}

export function shouldUseBriefLayout(parsed: ParsedBriefLayout | null): parsed is ParsedBriefLayout {
  return parsed !== null && !!(parsed.overview || parsed.core || parsed.suggestion);
}
