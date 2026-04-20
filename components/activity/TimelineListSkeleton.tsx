/** 与 ActivityTimeline 卡片网格对齐的占位：md+ 两列 */

interface Props {
  /** 骨架卡片数量 */
  cards?: number;
}

export default function TimelineListSkeleton({ cards = 4 }: Props) {
  return (
    <div
      className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
      aria-busy
      aria-label="加载中"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="fade-up rounded-2xl border p-4 md:p-4"
          style={{
            background: "var(--surface-elevated)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* 与 ActivityCard：正文在上、时间+标签在下同一行 */}
          <div
            className="h-[1.125rem] w-full max-w-[min(100%,18rem)] animate-pulse rounded"
            style={{ background: "var(--border)" }}
          />
          <div
            className="mt-1.5 h-[1.125rem] w-[72%] max-w-[14rem] animate-pulse rounded"
            style={{ background: "var(--border)" }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="h-3 w-10 animate-pulse rounded" style={{ background: "var(--border)" }} />
            <div className="h-5 w-14 animate-pulse rounded-md" style={{ background: "var(--border)" }} />
            <div className="h-5 w-12 animate-pulse rounded-md" style={{ background: "var(--border)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
