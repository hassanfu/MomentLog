/**
 * AI 简报系统提示：输出固定 Markdown 结构，语气温暖专业、基于事实、不过度解读。
 */

export type BriefPeriod = "day" | "week" | "month" | "year";

/** 数据统计里的周期文案（如「本周」），不再用作小节标题 */
export function periodOverviewTitle(period: BriefPeriod): string {
  switch (period) {
    case "day":
      return "今日";
    case "week":
      return "本周";
    case "month":
      return "本月";
    case "year":
      return "本年";
    default:
      return "本期";
  }
}

export type BriefActivityRow = {
  title: string;
  note?: string | null;
  tags?: string[];
  durationMinutes?: number | null;
};

export type BriefPromptStats = {
  activityCount: number;
  totalMinutes: number;
  busiestDayLabel?: string | null;
  busiestDomainLabel?: string | null;
};

export type BuildBriefPromptInput = {
  period: BriefPeriod;
  dateRangeLabel: string;
  stats: BriefPromptStats;
  activities: BriefActivityRow[];
};

function formatDurationChinese(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "约 0 小时";
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  if (hours >= 1) return `约 ${hours} 小时`;
  const m = Math.round(totalMinutes);
  return `约 ${m} 分钟`;
}

/**
 * 构建简报生成用的用户消息全文（交给模型执行：直接输出 Markdown 正文）。
 */
export function buildBriefPrompt(input: BuildBriefPromptInput): string {
  const { period, dateRangeLabel, stats, activities } = input;
  const periodWord = periodOverviewTitle(period);
  const totalTimeStr = formatDurationChinese(stats.totalMinutes);

  const lines: string[] = [];

  lines.push(`# 角色与原则`);
  lines.push(
    `你是用户的私人生活教练兼生产力助手：温暖、专业、有洞察力。只根据下方「数据统计」与「活动明细」写作，不得编造记录里不存在的事实、标签或时长。`,
  );
  lines.push(`语气像一位懂你的朋友：自然、口语化，多用「你这段时间……」「感觉你……」。重点是「发生了什么」和「感觉怎么样」。`);
  lines.push(`观察与见解要适量：只写从记录里明显能看出的点；没有就别硬凑。优先写积极或有趣的一面；若明显有连续熬夜、压力过大等，可温和提一句，不要说教。`);
  lines.push("");

  lines.push(`# 输出要求`);
  lines.push(`1. 使用 Markdown。**不要**加任何前言、后记、寒暄或总结套话（不要写「以上是简报」「希望对你有帮助」等）。`);
  lines.push(`2. **正文必须以三级标题开头**，标题必须一字不差：`);
  lines.push(`### 概述`);
  lines.push(`3. 在「概述」标题下，先写无序列表 **三行**（数字须与下方统计一致）：`);
  lines.push(`   - 总记录条数：**${stats.activityCount}** 条`);
  lines.push(`   - 总花费时间：**${totalTimeStr}**（若很多活动未填时长，可在这一句里轻轻提一句，但条数与已汇总时长不得虚构）`);
  lines.push(`   - 最活跃的一天/领域：结合记录概括；若没有明显集中，可写「比较分散」或「差别不大」。`);
  if (stats.busiestDayLabel) lines.push(`     （参考：按条数/时长较突出的一天：${stats.busiestDayLabel}）`);
  if (stats.busiestDomainLabel) lines.push(`     （参考：标签侧较突出：${stats.busiestDomainLabel}）`);
  lines.push(`4. **紧接列表之后**（仍在「概述」一节内，不要再加小标题），用 **一段话、只写一句** 轻松的观察（相当于以前的「随便说两句」里挑一句），语气口语、点到为止，不要编号列表。`);
  lines.push(`5. 然后依次新增小节，三级标题必须一字不差：`);
  lines.push(`### 核心`);
  lines.push(`### 建议`);
  lines.push("");
  lines.push(`# 各节说明`);
  lines.push(`### 核心`);
  lines.push(
    `- **今日 / 本周**：尽量覆盖记录里的事，结合描述与标签，挑有特点的写，避免流水账；可穿插很轻的评论（如「看起来挺有挑战」「连续几天在做这个，挺拼的」）。`,
  );
  lines.push(`- **本月 / 本年**：不必写全，适当归纳主题与节奏即可。`);
  lines.push("");
  lines.push(`### 建议`);
  lines.push(`- 若自然能想到，写 **1～2** 条很轻、很具体的小建议；`);
  lines.push(`- 若没有，该小节可只写一行「继续保持就好～」，或**整节省略**（不出现 \`### 建议\` 标题也可以）。`);
  lines.push("");
  lines.push(`# 篇幅`);
  lines.push(`- **今日、本周**：全文约 **300～600 字**（中文）。`);
  lines.push(`- **本月、本年**：可略长，仍要简洁好读。`);
  lines.push(`- 若活动很少，诚实说「这次记录不多」，但仍从现有内容里找积极或有趣的点。`);
  lines.push("");
  lines.push(`---`);
  lines.push(`## 数据统计（权威；概述中的条数与总时长须与此一致）`);
  lines.push(`- 周期：**${periodWord}**`);
  lines.push(`- 日期范围：**${dateRangeLabel}**`);
  lines.push(`- 记录条数：**${stats.activityCount}**`);
  lines.push(`- 总时长（分钟，已加总）：**${Math.round(stats.totalMinutes)}** → 概述中写 **${totalTimeStr}**`);
  lines.push("");
  lines.push(`## 活动明细（写「核心」时请引用，勿臆造）`);

  if (activities.length === 0) {
    lines.push("（本期无活动记录）");
  } else {
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      const tags = a.tags?.length ? a.tags.join("、") : "无";
      const dur =
        a.durationMinutes != null && a.durationMinutes > 0 ? `${Math.round(a.durationMinutes)} 分钟` : "未填";
      const note = a.note?.trim() ? `；备注：${a.note.trim()}` : "";
      lines.push(`${i + 1}. **${a.title}**｜标签：${tags}｜时长：${dur}${note}`);
    }
  }

  lines.push("");
  lines.push(`请现在**直接输出**符合以上结构的 Markdown 正文（从 \`### 概述\` 那一行开始，不要复述本说明）。`);

  return lines.join("\n");
}
