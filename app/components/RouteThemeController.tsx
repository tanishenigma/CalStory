"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * RouteThemeController — forces certain public routes to render in
 * light mode regardless of the user's stored theme preference.
 *
 * Currently the forced-light routes are:
 *   - `/`       (Landing page)
 *   - `/auth`   (Sign-in screen)
 *
 * Every other route renders using whatever the user's preference is
 * (light, dark, or system).
 *
 * Implementation note: we toggle a dedicated `forced-landing` class
 * on `<html>` (instead of reusing the light `:root` tokens directly)
 * so we don't mutate the user's stored theme. The class only re-skins
 * CSS custom properties via the matching `.forced-landing { ... }`
 * block in `globals.css`; `prefsStore.theme` is left untouched, so
 * navigating to `/dashboard` instantly reflects the user's real
 * preference.
 *
 * The same class is also added by the FOUC-prevention inline script
 * in `app/layout.tsx` so forced-light pages don't briefly flash dark
 * on hard refresh.
 */

/** Routes that are always rendered in light mode. */
const FORCED_LIGHT_ROUTES = new Set<string>(["/", "/auth"]);

function isForcedLightPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return FORCED_LIGHT_ROUTES.has(pathname);
}

export function RouteThemeController() {
  const pathname = usePathname();
  const isForcedLight = isForcedLightPath(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (isForcedLight) {
      root.classList.add("forced-landing");
    } else {
      root.classList.remove("forced-landing");
    }
  }, [isForcedLight]);

  return null;
}