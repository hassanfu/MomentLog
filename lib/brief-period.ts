import type { PeriodType } from "@/types";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";

/** 与 `app/api/brief` 中周期边界计算一致 */
export function getPeriodBounds(referenceDate: string, period: PeriodType): { periodStart: string; periodEnd: string } {
  const ref = new Date(referenceDate + "T00:00:00");
  switch (period) {
    case "week":
      return {
        periodStart: format(startOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        periodEnd: format(endOfWeek(ref, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "month":
      return {
        periodStart: format(startOfMonth(ref), "yyyy-MM-dd"),
        periodEnd: format(endOfMonth(ref), "yyyy-MM-dd"),
      };
    case "year":
      return {
        periodStart: format(startOfYear(ref), "yyyy-MM-dd"),
        periodEnd: format(endOfYear(ref), "yyyy-MM-dd"),
      };
    default:
      return {
        periodStart: format(startOfDay(ref), "yyyy-MM-dd"),
        periodEnd: format(endOfDay(ref), "yyyy-MM-dd"),
      };
  }
}

/** UI / 邮件主题用文案 */
export const PERIOD_LABEL_CN: Record<PeriodType, string> = {
  day: "今日简报",
  week: "本周回顾",
  month: "本月回顾",
  year: "本年回顾",
};
