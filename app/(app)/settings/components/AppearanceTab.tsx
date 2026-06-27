"use client";

import { motion } from "framer-motion";
import {
  LayoutPanelLeft,
  PanelLeft,
  ChevronRight,
  Monitor,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import BlurFade from "@/app/components/animations/BlurFade";
import { animateThemeTransition } from "@/app/components/ThemeToggle";
import {
  usePrefsStore,
  resolveTheme,
  type NavbarStyle,
  type Theme,
} from "@/app/store/prefsStore";

export function AppearanceTab() {
  const theme = usePrefsStore((s) => s.theme);
  const setTheme = usePrefsStore((s) => s.setTheme);
  const navbarStyle = usePrefsStore((s) => s.navbarStyle);
  const setNavbarStyle = usePrefsStore((s) => s.setNavbarStyle);
  const dynamicBackground = usePrefsStore((s) => s.dynamicBackground);
  const setDynamicBackground = usePrefsStore((s) => s.setDynamicBackground);

  return (
    <BlurFade>
      <Card className="p-6 flex flex-col gap-8">
        <div>
          <div className="text-sm font-bold mb-1">Theme</div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-5">
            Choose between light mode, dark mode, or follow your system
            preference.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "light" as const, title: "Light", Icon: Sun },
              { key: "dark" as const, title: "Dark", Icon: Moon },
              { key: "system" as const, title: "System", Icon: Monitor },
            ].map((opt) => {
              const active = theme === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={(e) => {
                    const rect = (
                      e.currentTarget as HTMLButtonElement
                    ).getBoundingClientRect();
                    const ox = rect.left + rect.width / 2;
                    const oy = rect.top + rect.height / 2;
                    animateThemeTransition(
                      () => {
                        setTheme(opt.key);
                        const next = resolveTheme(opt.key);
                        if (next === "dark") {
                          document.documentElement.classList.add("dark");
                        } else {
                          document.documentElement.classList.remove("dark");
                        }
                      },
                      ox,
                      oy,
                      450,
                    );
                  }}
                  className={[
                    "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors",
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-foreground/10 hover:border-foreground dark:hover:border-foreground dark:border-white/10",
                  ].join(" ")}>
                  {active && (
                    <motion.div
                      layoutId="active-theme"
                      className="absolute inset-0 rounded-2xl bg-foreground text-background"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                      }}
                    />
                  )}
                  <opt.Icon
                    size={20}
                    className={[
                      "relative z-10",
                      active ? "text-background" : "text-foreground",
                    ].join(" ")}
                  />
                  <span className="relative z-10 font-bold text-sm">
                    {opt.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Background toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold mb-1 flex items-center gap-1.5">
              Dynamic Background
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Animates a full-screen colour gradient that slowly cycles through
              hues — based on your current theme.
            </p>
          </div>
          <Switch
            id="dynamic-bg-toggle"
            checked={dynamicBackground}
            onCheckedChange={setDynamicBackground}
            className="mt-0.5 shrink-0"
          />
        </div>

        <div className="hidden lg:block">
          <div className="text-sm font-bold mb-1">Navigation</div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-5">
            Pick how the side navigation looks on desktop. The mobile bottom bar
            is always shown.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                key: "floating" as const,
                title: "Floating sidebar",
                sub: "Wider panel with labels",
                Icon: LayoutPanelLeft,
              },
              {
                key: "pill" as const,
                title: "Compact pill",
                sub: "Narrow vertical pill, icons only",
                Icon: PanelLeft,
              },
            ].map((opt) => {
              const active = navbarStyle === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setNavbarStyle(opt.key as NavbarStyle)}
                  className={[
                    "relative flex flex-col gap-3 text-left p-4 rounded-2xl border transition-colors",
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-foreground/10 hover:border-foreground dark:hover:border-foreground dark:border-white/10",
                  ].join(" ")}>
                  {active && (
                    <motion.div
                      layoutId="active-nav-style"
                      className="absolute inset-0 rounded-2xl  bg-foreground text-background"
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 28,
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    <opt.Icon
                      size={16}
                      className={active ? "text-background" : "text-foreground"}
                    />
                    <span className="font-bold text-sm">{opt.title}</span>
                    {active && (
                      <ChevronRight
                        size={13}
                        className="ml-auto text-background/60"
                      />
                    )}
                  </div>
                  <p
                    className={[
                      "relative z-10 text-[11px] leading-relaxed",
                      active
                        ? "text-white/70 dark:text-foreground/60"
                        : "text-muted-foreground",
                    ].join(" ")}>
                    {opt.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic">
          Saves instantly. Your choice is remembered on this device.
        </p>
      </Card>
    </BlurFade>
  );
}
