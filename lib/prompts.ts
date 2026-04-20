import { Activity, PeriodType } from "@/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function buildBriefPrompt(
  activities: Activity[],
  period: PeriodType,
  periodStart: string,
  periodEnd: string
): string {
  const periodLabels: Record<PeriodType, string> = {
    day: "今日",
    week: "本周",
    month: "本月",
    year: "今年",
  };

  const totalMinutes = activities.reduce((sum, a) => sum + (a.duration_minutes ?? 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const tagSummary: Record<string, { count: number; minutes: number }> = {};
  for (const activity of activities) {
    for (const tag of activity.tags) {
      if (!tagSummary[tag]) tagSummary[tag] = { count: 0, minutes: 0 };
      tagSummary[tag].count++;
      tagSummary[tag].minutes += activity.duration_minutes ?? 0;
    }
  }

  const tagBreakdown = Object.entries(tagSummary)
    .map(([tag, { count, minutes }]) => `${tag}: ${count}条记录, ${minutes}分钟`)
    .join("\n");

  const activityList = activities
    .map((a) => {
      const dateStr = format(new Date(a.date), "M月d日", { locale: zhCN });
      const tags = a.tags.join(" ");
      const dur = a.duration_minutes ? `(${a.duration_minutes}分钟)` : "";
      return `- [${dateStr}] ${a.description} ${tags} ${dur}`;
    })
    .join("\n");

  return `你是一位温暖、专业、富有洞察力的个人成长教练。请根据以下活动记录，为用户生成一份${periodLabels[period]}简报。

**时间段**: ${periodStart} 至 ${periodEnd}
**总记录条数**: ${activities.length} 条
**总时长**: ${hours > 0 ? `${hours}小时` : ""}${mins > 0 ? `${mins}分钟` : "（未记录时长）"}

**标签分布**:
${tagBreakdown || "（无标签数据）"}

**活动记录**:
${activityList || "（本时段无记录）"}

请以 JSON 格式输出，结构如下：
{
  "title": "简报标题（简洁有力，如"专注深耕的一周"）",
  "summary": "2-3段自然语言总结，温暖专业，带个人洞察，使用第二人称（"你"）",
  "keyEvents": ["关键事件1", "关键事件2", "关键事件3"（最多5条）],
  "timeAllocation": [
    { "category": "标签名", "minutes": 数字, "percentage": 百分比数字（0-100）}
  ],
  "insights": ["洞察1", "洞察2", "洞察3"（最多3条，可操作的改进建议）],
  "encouragement": "一句温暖有力的结语"
}

要求：
- 风格：温暖、专业、像一位好友兼教练
- 如有具体数字（小时数、次数），请引用
- 洞察要基于数据，具体可行，不空泛
- 只输出 JSON，不要有其他文字`;
}
