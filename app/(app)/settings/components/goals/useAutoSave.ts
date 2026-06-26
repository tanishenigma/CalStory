"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a value is currently in-flight to Firestore.
 * Returns a tuple of:
 *   - saving: boolean — true while a save is pending or running
 *   - run: () => void — invoke to trigger a save
 *
 * The callback (passed as `effect`) fires only when the value has
 * settled for `delay` ms and there isn't already a save running.
 * Perfect for "save on blur" or "save after typing stops" UX.
 */
export function useAutoSave(
  effect: () => void | Promise<void>,
  delay = 800,
): { saving: boolean; run: () => void } {
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelled = useRef(false);

  // Cancel any pending timer on unmount so an in-flight debounce
  // can't call setSaving on a torn-down component.
  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function run() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (cancelled.current) return;
      setSaving(true);
      try {
        await effect();
      } finally {
        if (!cancelled.current) setSaving(false);
      }
    }, delay);
  }

  return { saving, run };
}
