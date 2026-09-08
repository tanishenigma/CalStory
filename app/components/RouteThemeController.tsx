"use client";

import { useEffect } from "react";

/** Removes the retired public-route theme override during client upgrades. */

export function RouteThemeController() {
  useEffect(() => {
    const root = document.documentElement;
    // Clean up the legacy route override. Public pages now honor the same
    // user-selected light/dark/system preference as the application.
    root.classList.remove("forced-landing");
  }, []);

  return null;
}
