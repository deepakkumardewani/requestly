import type { ReactNode } from "react";

export function SectionHeading({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-3" id={id}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
        {children}
      </span>
    </div>
  );
}
