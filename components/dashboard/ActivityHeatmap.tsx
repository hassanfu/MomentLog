"use client";

import { addDays, format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { HeatmapCell } from "@/types";

const CELL_PX = 11;
/** 方块之间横向、纵向统一间距（像素） */
const GAP_PX = 4;

const LEVEL_BG: Record<HeatmapCell["level"], string> = {
  0: "var(--heatmap-0)",
  1: "var(--heatmap-1)",
  2: "var(--heatmap-2)",
  3: "var(--heatmap-3)",
  4: "var(--heatmap-4)",
};

interface Props {
  cells: HeatmapCell[];
  numWeeks: number;
  gridStart: string;
}

/** GitHub / flomo 风格：列=周，行=周一→周日 */
export default function ActivityHeatmap({ cells, numWeeks, gridStart }: Props) {
  const monthLabels = buildMonthLabels(gridStart, numWeeks);

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        活跃度
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full flex-col gap-1.5">
          <div
            className="inline-grid"
            style={{
              gridTemplateColumns: `repeat(${numWeeks}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
              gridAutoFlow: "column",
              rowGap: GAP_PX,
              columnGap: GAP_PX,
            }}
          >
            {cells.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date} · ${cell.count} 条记录`}
                className="shrink-0 rounded-[2px] transition-colors"
                style={{
                  width: CELL_PX,
                  height: CELL_PX,
                  background: LEVEL_BG[cell.level],
                }}
              />
            ))}
          </div>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${numWeeks}, ${CELL_PX}px)`,
              columnGap: GAP_PX,
            }}
          >
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[9px] leading-none whitespace-nowrap overflow-visible block"
                style={{
                  color: m ? "var(--text-muted)" : "transparent",
                  width: CELL_PX,
                  minWidth: CELL_PX,
                }}
              >
                {m || "\u00a0"}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
        <span>少</span>
        <div className="flex gap-0.5">
          {([0, 1, 2, 3, 4] as const).map((lv) => (
            <div key={lv} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: LEVEL_BG[lv] }} />
          ))}
        </div>
        <span>多</span>
      </div>
    </div>
  );
}

function buildMonthLabels(gridStart: string, numWeeks: number): string[] {
  const base = parseISO(gridStart + "T12:00:00");
  const labels: string[] = [];
  let lastYm = "";
  for (let c = 0; c < numWeeks; c++) {
    const monday = addDays(base, c * 7);
    const ym = format(monday, "yyyy-MM");
    if (ym !== lastYm) {
      lastYm = ym;
      labels.push(format(monday, "M月", { locale: zhCN }));
    } else {
      labels.push("");
    }
  }
  return labels;
}
