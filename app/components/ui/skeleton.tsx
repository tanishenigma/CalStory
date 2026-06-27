import * as React from "react";
import { cn } from "@/app/lib/utils";

/* ------------------------------------------------------------------
 * Skeleton — shadcn-style placeholder block.
 *
 * Use the default shimmer animation when an element's eventual size
 * is unknown; pair with `animate-pulse` (Tailwind) for a softer,
 * less distracting breath. Custom shadcn-style skeleton pages are
 * composed of `<Skeleton />` primitives sized to match the real
 * layout — that gives true layout stability (no CLS jump) when the
 * real content swaps in.
 * ------------------------------------------------------------------ */

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md bg-muted/60 dark:bg-muted/40",
      "animate-pulse",
      className,
    )}
    {...props}
  />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };
