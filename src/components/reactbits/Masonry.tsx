"use client";

import { Children, type ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface MasonryProps {
  children: ReactNode;
  className?: string;
  /** Tailwind column classes controlling the responsive column count */
  columnClassName?: string;
  /** vertical gap between items, in rem */
  gap?: number;
}

const DEFAULT_COLUMNS = "columns-1 sm:columns-2 lg:columns-3";

/**
 * CSS multi-column masonry layout. Items keep their intrinsic aspect ratio and
 * never break across columns, so there is no layout shift. Each item fades in
 * on mount; the animation no-ops under reduced motion.
 */
export function Masonry({
  children,
  className,
  columnClassName = DEFAULT_COLUMNS,
  gap = 1,
}: MasonryProps) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <div
      className={cn(columnClassName, className)}
      style={{ columnGap: `${gap}rem` }}
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="break-inside-avoid"
          style={{ marginBottom: `${gap}rem` }}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.45, delay: (i % 3) * 0.05 }}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}
