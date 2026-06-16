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
  Flame,
} from "lucide-react";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useApp } from "../context/AppContext";
import { useAuthStore } from "../store/authStore";

const NAV: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/nutrition", label: "Nutrition", Icon: UtensilsCrossed },
  { href: "/workouts", label: "Workouts", Icon: Dumbbell },
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
  return (
    <nav className=" fixed left-[14px] top-1/2 -translate-y-1/2 w-[60px] bg-background border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-[30px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] dark:shadow-none flex flex-col items-center gap-[2px] py-[10px] px-2 z-[200] max-md:hidden ">
      <div className="w-[38px] h-[38px] bg-foreground rounded-full flex items-center justify-center mb-[10px]">
        <Flame
          size={18}
          className="text-white dark:text-[#1a1916] fill-white dark:fill-[#1a1916]"
        />
      </div>

      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className="relative w-11 h-11 rounded-full flex items-center justify-center">
            {active && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 rounded-full bg-[#1A1916] dark:bg-[#f7f6f3]"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <Icon
              size={20}
              className={
                active
                  ? "text-white dark:text-[#1a1916] relative z-10"
                  : "text-[#1A1916] dark:text-[#f7f6f3] dark:text-[#9b9895]"
              }
            />
          </Link>
        );
      })}
    </nav>
  );
}

function FloatingSidebar({ pathname }: { pathname: string }) {
  const { profile, isLoading } = useAuthGuard();
  const { state, setProfile } = useApp();
  const { user } = useAuthStore();

  return (
    <nav className=" fixed left-[14px] inset-y-4 w-[250px] bg-white/80 dark:bg-[#1a1916]/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-none flex flex-col gap-1 py-4 px-3 z-[200] max-md:hidden ">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-1.5 mb-3 ">
        <Link
          href="/"
          className="flex items-center cursor-pointer relative z-10 shrink-0 gap-2.5 group ">
          <div className="w-8 h-8 bg-[#1A1916] dark:bg-[#f7f6f3] rounded-full flex items-center justify-center">
            <Flame
              size={18}
              className="text-white dark:text-[#1a1916] fill-white dark:fill-[#1a1916]"
            />
          </div>
          <h1 className="font-bold text-base tracking-tight text-foreground">
            CalStory
          </h1>
        </Link>
      </div>

      {/* Nav items — exclude Settings */}
      {NAV.filter((n) => n.href !== "/settings").map(
        ({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className="relative block">
              {active && (
                <motion.div
                  layoutId="active-floating"
                  className="absolute inset-0 rounded-xl bg-[#1A1916] dark:bg-[#f7f6f3]"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <div
                className={[
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                  active
                    ? "text-white dark:text-[#1a1916]"
                    : "text-[#1A1916] dark:text-[#f7f6f3] dark:text-[#9b9895] hover:bg-[#F7F6F3] dark:bg-[#0f0f0e] dark:hover:bg-[#0f0f0e]",
                ].join(" ")}>
                <Icon size={20} />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            </Link>
          );
        },
      )}

      {/* Spacer pushes profile to bottom */}
      <div className="flex-1" />

      {/* Profile card */}
      <Link
        href="/settings"
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] transition-colors group">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="avatar"
            className="w-8 h-8 rounded-full border-2 border-[#E8E7E4] dark:border-[#3a3a3a]"
          />
        ) : (
          ""
        )}
        <span className="text-sm font-semibold text-[#1A1916] dark:text-[#f7f6f3] flex-1 truncate">
          {state.profile?.name
            ? state.profile.name.charAt(0).toUpperCase() +
              state.profile.name.slice(1)
            : ""}
        </span>
        <Settings
          size={15}
          className="text-[#C8C6C3] group-hover:text-[#1A1916] transition-colors"
        />
      </Link>
    </nav>
  );
}
