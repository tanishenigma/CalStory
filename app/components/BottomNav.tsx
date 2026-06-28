"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Settings,
} from "lucide-react";

const TABS: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: <Home size={22} />,
  },
  {
    href: "/nutrition",
    label: "Nutrition",
    icon: <UtensilsCrossed size={22} />,
  },
  {
    href: "/workouts",
    label: "Workouts",
    icon: <Dumbbell size={22} />,
  },
  {
    href: "/progress",
    label: "Progress",
    icon: <TrendingUp size={22} />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings size={22} />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/") return null;
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 lg:hidden z-[200] w-[calc(100vw-24px)] max-w-md mx-auto h-[72px] flex items-center justify-around px-2 bg-background/95 dark:bg-background backdrop-blur-xl border border-border rounded-3xl shadow-[0_10px_30px_oklch(0_0_0/_0.12)]">
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            className=" flex flex-col items-center justify-center flex-1 h-full gap-1 relative "
            style={{
              textDecoration: "none",
            }}>
            <div
              className={`transition-all duration-200 ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}>
              {icon}
            </div>

            <span
              className={`text-[11px] font-semibold transition-all duration-200 ${
                active ? "text-foreground " : "text-muted-foreground"
              }`}>
              {label}
            </span>

            {active && (
              <motion.div
                layoutId="active-bottom-tab"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-foreground"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
