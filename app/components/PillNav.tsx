"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePrefsStore } from "@/app/store/prefsStore";
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Settings,
  Activity,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const NAV: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/nutrition", label: "Nutrition", Icon: UtensilsCrossed },
  { href: "/workouts", label: "Workouts", Icon: Dumbbell },
  { href: "/fitness", label: "Fitness", Icon: Activity },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function PillNav() {
  const pathname = usePathname();
  const style = usePrefsStore((s) => s.navbarStyle);

  if (style === "floating") {
    return <FloatingSidebar pathname={pathname} />;
  }
  return <PillNavInner pathname={pathname} />;
}

function PillNavInner({ pathname }: { pathname: string }) {
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const activeHref = NAV.find(
    ({ href }) => pathname === href || pathname.startsWith(href + "/"),
  )?.href;

  const measure = () => {
    if (!activeHref) return;
    const el = itemRefs.current[activeHref];
    if (!el) return;
    setIndicator({
      top: el.offsetTop,
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  return (
    <>
      {/* Desktop sidebar — hidden below lg */}
      <nav className="fixed left-3 lg:left-4 top-1/2 -translate-y-1/2 w-16 bg-background border border-border rounded-[30px] shadow-[0_4px_24px_oklch(0_0_0/_0.07)] dark:shadow-none hidden lg:flex flex-col items-center gap-[2px] py-[10px] px-2 z-[200]">
        <div className="w-[38px] h-[38px] bg-foreground rounded-full flex items-center justify-center mb-[10px] overflow-hidden">
          <img
            src="/light.png"
            alt="CalStory"
            width={28}
            height={28}
            className="w-7 h-7 object-contain block dark:hidden"
          />
          <img
            src="/dark.png"
            alt="CalStory"
            width={28}
            height={28}
            className="w-7 h-7 object-contain hidden dark:block"
          />
        </div>

        {indicator && (
          <motion.div
            initial={false}
            animate={{
              top: indicator.top,
              left: indicator.left,
              width: indicator.width,
              height: indicator.height,
              opacity: activeHref ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute rounded-full bg-foreground pointer-events-none"
          />
        )}

        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              ref={(el) => {
                itemRefs.current[href] = el;
              }}
              className="relative w-11 h-11 rounded-full flex items-center justify-center focus-visible:outline-none">
              <Icon
                size={20}
                className={
                  active
                    ? "text-background relative z-10"
                    : "text-foreground/70 hover:text-foreground"
                }
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function FloatingSidebar({ pathname }: { pathname: string }) {
  const { user } = useAuthStore();
  const { state } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filteredNav = NAV.filter((n) => n.href !== "/settings");

  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const activeHref = filteredNav.find(
    ({ href }) => pathname === href || pathname.startsWith(href + "/"),
  )?.href;

  const measure = () => {
    if (!activeHref) return;
    const el = itemRefs.current[activeHref];
    if (!el) return;
    setIndicator({
      top: el.offsetTop,
      height: el.offsetHeight,
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  return (
    <>
      {/* Desktop floating sidebar — lg and up */}
      <nav className="fixed left-3 lg:left-4 inset-y-4 w-64 bg-card/60 dark:bg-card/60 backdrop-blur-2xl border border-border/60 dark:border-border/40 rounded-3xl shadow-[0_8px_32px_oklch(0_0_0/_0.08)] dark:shadow-none hidden lg:flex flex-col gap-1 py-4 px-3 z-[200] ">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-3 ">
          <Link
            href="/"
            className="flex items-center cursor-pointer relative z-10 shrink-0 gap-2.5 group ">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center overflow-hidden">
              <img
                src="/light.png"
                alt="CalStory"
                width={28}
                height={28}
                className="w-7 h-7 object-contain block dark:hidden"
              />
              <img
                src="/dark.png"
                alt="CalStory"
                width={28}
                height={28}
                className="w-7 h-7 object-contain hidden dark:block"
              />
            </div>
            <h1 className="font-bold text-base tracking-tight text-foreground">
              CalStory
            </h1>
          </Link>
        </div>

        {/* Shared indicator — hides itself when no nav item is active (e.g. on /settings) */}
        {indicator && (
          <motion.div
            initial={false}
            animate={{
              top: indicator.top,
              height: indicator.height,
              opacity: activeHref ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute left-3 right-3 rounded-xl bg-foreground pointer-events-none"
          />
        )}

        {/* Nav items — exclude Settings */}
        {filteredNav.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              ref={(el) => {
                itemRefs.current[href] = el;
              }}
              className="relative block focus-visible:outline-none">
              <div
                className={[
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                  active
                    ? "text-background"
                    : "text-foreground/80 hover:text-foreground hover:bg-accent",
                ].join(" ")}>
                <Icon size={20} />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            </Link>
          );
        })}

        {/* Spacer pushes profile to bottom */}
        <div className="flex-1" />

        {/* Profile card */}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-accent transition-colors group">
          {mounted && user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full border-2 border-border"
            />
          ) : null}
          <span className="text-sm font-semibold text-foreground flex-1 truncate">
            {state.profile?.name
              ? state.profile.name.charAt(0).toUpperCase() +
                state.profile.name.slice(1)
              : ""}
          </span>
          <Settings
            size={15}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
        </Link>
      </nav>
    </>
  );
}
