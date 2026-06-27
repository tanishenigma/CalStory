"use client";

import { usePathname } from "next/navigation";

/**
 * BackgroundGrid — landing-page-only hairline grid backdrop.
 *
 * Renders a subtle 32px-square grid via two stacked CSS linear gradients on
 * a fixed-position element. The grid is ONLY mounted on the landing route
 * (`/`); on every other page the component renders nothing, so the dashboard,
 * auth, settings, and other solid-background routes are unaffected.
 *
 * Light mode: 4% black hairline. Dark mode: 5% white hairline. Honors
 * `prefers-color-scheme` via the same `.dark` class as the rest of the app.
 */
export function BackgroundGrid({
  scopedToHero = false,
}: {
  /**
   * When true, the grid renders `absolute inset-0` instead of
   * `fixed inset-0`, so it stays bounded by its parent (the hero
   * section) and never bleeds into later sections.
   */
  scopedToHero?: boolean;
}) {
  const pathname = usePathname();

  const GRID_SIZE = 96;

  // The page-wide mode gates on the route so the grid never renders
  // on dashboard/auth/settings. When the grid is scoped to the hero,
  // the caller controls placement and we don't gate by route — the
  // LandingClient already only mounts us on `/`.
  if (!scopedToHero && pathname !== "/") return null;

  const positionClass = scopedToHero
    ? "absolute inset-0"
    : "fixed inset-0 landing-grid-fade";

  return (
    <div
      aria-hidden
      className={`pointer-events-none ${positionClass}`}
      style={{
        zIndex: 0,
        // Light-mode grid color (4% ink hairlines)
        backgroundImage:
          "linear-gradient(to right, oklch(0.2272 0.0049 173.9454 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.2272 0.0049 173.9454 / 0.04) 1px, transparent 1px)",
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        backgroundPosition: "-1px -1px",
      }}>
      {/* Dark-mode override via a nested div so we can key on the .dark
          class without forking the parent. */}
      <div
        className="absolute inset-0 dark:block hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 0.03) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          backgroundPosition: "-1px -1px",
        }}
      />
    </div>
  );
}
