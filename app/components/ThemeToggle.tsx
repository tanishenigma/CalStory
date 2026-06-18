"use client";

/**
 * Exported animation helper — use this anywhere to trigger a View Transitions
 * circle-wipe from a given screen position when switching theme.
 *
 * @param originX  X coordinate (px) for the clip-path origin
 * @param originY  Y coordinate (px) for the clip-path origin
 * @param duration Animation duration in ms (default 450)
 */
export async function animateThemeTransition(
  applyTheme: () => void,
  originX: number,
  originY: number,
  duration = 450,
): Promise<void> {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!document.startViewTransition || prefersReduced) {
    applyTheme();
    return;
  }

  const r = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY),
  );
  const clipStart = `circle(0px at ${originX}px ${originY}px)`;
  const clipEnd = `circle(${r}px at ${originX}px ${originY}px)`;

  const transition = document.startViewTransition(applyTheme);
  await transition.ready;

  document.documentElement.animate(
    { clipPath: [clipStart, clipEnd] },
    {
      duration,
      easing: "cubic-bezier(0.25, 0, 0, 1)",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}
