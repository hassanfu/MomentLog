/** 与 ActivityTimeline / ActivityCard 对齐的占位：左侧竖线 + 圆点 + 分隔条，无圆角卡片块 */

interface Props {
  rows?: number;
}

export default function TimelineListSkeleton({ rows = 4 }: Props) {
  return (
    <div className="relative" aria-busy aria-label="加载中">
      <div
        className="pointer-events-none absolute left-[13px] top-3 bottom-4 z-0 w-px md:left-[15px]"
        style={{ background: "var(--border-strong)" }}
        aria-hidden
      />

      <div className="relative z-[1]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="fade-up flex gap-3 md:gap-4">
            <div className="relative z-[2] flex w-7 shrink-0 justify-center md:w-8">
              <span
                className="mt-2 block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full md:h-3 md:w-3"
                style={{
                  background: "var(--surface-elevated)",
                  boxShadow: "0 0 0 3px var(--surface)",
                }}
                aria-hidden
              />
            </div>
            <div
              className={`relative min-w-0 flex-1 pb-6 pt-0.5 md:pb-7 ${i < rows - 1 ? "border-b border-[color:var(--border)]" : ""}`}
            >
              <div
                className="h-3 w-[5.5rem] max-w-[40%] animate-pulse rounded"
                style={{ background: "var(--surface-elevated)" }}
              />
              <div
                className="mt-2 h-4 w-full max-w-lg animate-pulse rounded"
                style={{ background: "var(--surface-elevated)" }}
              />
              <div
                className="mt-3 h-5 w-28 animate-pulse rounded-md"
                style={{ background: "var(--surface-elevated)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
