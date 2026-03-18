import { METHOD_BADGE_CLASSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/types";

type MethodBadgeProps = {
  method: HttpMethod;
  className?: string;
};

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
        METHOD_BADGE_CLASSES[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
