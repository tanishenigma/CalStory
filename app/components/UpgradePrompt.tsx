import { ArrowRight, Sparkles } from "lucide-react";

export function UpgradePrompt({
  label = "Upgrade for unlimited prompts",
}: {
  label?: string;
}) {
  return (
    <a
      href="/pricing#pricing"
      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90">
      <Sparkles size={13} />
      {label}
      <ArrowRight size={13} />
    </a>
  );
}
