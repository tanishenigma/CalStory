"use client";

interface SaveBarProps {
  saving: boolean;
  onSave: () => void;
}

/**
 * The primary save button that anchors the bottom of the Goals tab.
 * Uses the same dark/light inverted contrast style as the rest of
 * the settings forms.
 */
export function SaveBar({ saving, onSave }: SaveBarProps) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="w-full py-3.5 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-60">
      {saving ? "Saving…" : "Save Goals"}
    </button>
  );
}
