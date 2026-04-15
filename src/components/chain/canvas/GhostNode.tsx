"use client";

type GhostNodeProps = {
  type: "delay" | "condition" | "display";
  cursorPos: { x: number; y: number };
};

export function GhostNode({ type, cursorPos }: GhostNodeProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 opacity-60"
      style={{ left: cursorPos.x + 12, top: cursorPos.y + 12 }}
    >
      {type === "delay" ? (
        <div className="flex min-w-[160px] items-center gap-2 rounded-lg border-2 border-amber-400 bg-card px-3 py-2 shadow-lg">
          <span className="text-xs text-muted-foreground">Wait</span>
          <span className="text-xs font-semibold text-foreground">1000</span>
          <span className="text-xs text-muted-foreground">ms</span>
        </div>
      ) : type === "condition" ? (
        <div className="min-w-[180px] rounded-lg border-2 border-violet-400 bg-card px-3 py-2 shadow-lg">
          <span className="text-xs font-semibold text-foreground">
            Condition
          </span>
        </div>
      ) : (
        <div className="min-w-[180px] rounded-lg border-2 border-violet-400 bg-card px-3 py-2 shadow-lg">
          <span className="text-xs font-semibold text-foreground">Display</span>
        </div>
      )}
    </div>
  );
}
