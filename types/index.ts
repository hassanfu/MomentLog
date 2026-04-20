export type Tag = "#工作" | "#学习" | "#生活" | "#运动" | "#创作" | "#社交" | "#休息" | string;

export interface Activity {
  id: string;
  user_id: string;
  date: string;
  description: string;
  tags: Tag[];
  duration_minutes: number | null;
  created_at: string;
}

export interface ActivityFormData {
  date: string;
  description: string;
  tags: Tag[];
  duration_minutes: number | null;
}

export type PeriodType = "day" | "week" | "month" | "year";

export interface TimeAllocation {
  category: string;
  minutes: number;
  percentage: number;
  color?: string;
}

export interface BriefContent {
  title: string;
  summary: string;
  keyEvents: string[];
  timeAllocation: TimeAllocation[];
  insights: string[];
  encouragement: string;
}

/** 首页活跃度热力图（单日一条记录计数 → 档位） */
export type HeatmapCell = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export interface Brief {
  id: string;
  user_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  title: string | null;
  content: BriefContent | null;
  created_at: string;
}
