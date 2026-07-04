"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * RouteThemeController — forces certain public routes to render in
 * dark mode regardless of the user's stored theme preference.
 *
 * Currently the forced-dark routes are:
 *   - `/`       (Landing page)
 *   - `/auth`   (Sign-in screen)
 *
 * Every other route renders using whatever the user's preference is
 * (light, dark, or system).
 *
 * Implementation note: we toggle a dedicated `forced-dark` class on
 * `<html>` (instead of reusing `.dark`) so we don't mutate the
 * user's stored theme. The class only re-skins CSS custom properties
 * via the matching `.forced-dark { ... }` block in `globals.css`;
 * `prefsStore.theme` is left untouched, so navigating to
 * `/dashboard` instantly reflects the user's real preference.
 *
 * The same class is also added by the FOUC-prevention inline script
 * in `app/layout.tsx` so forced-dark pages don't briefly flash light
 * on hard refresh.
 */

/** Routes that are always rendered in dark mode. */
const FORCED_DARK_ROUTES = new Set<string>(["/", "/auth"]);

function isForcedDarkPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return FORCED_DARK_ROUTES.has(pathname);
}

export function RouteThemeController() {
  const pathname = usePathname();
  const isForcedDark = isForcedDarkPath(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (isForcedDark) {
      root.classList.add("forced-dark");
    } else {
      root.classList.remove("forced-dark");
    }
  }, [isForcedDark]);

  return null;
}
