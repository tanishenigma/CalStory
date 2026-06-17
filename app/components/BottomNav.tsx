"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 md:hidden z-[200] w-[calc(100vw-24px)] max-w-md mx-auto h-[72px] flex items-center justify-around px-2 bg-white/95 dark:bg-[#1a1916]/95 backdrop-blur-xl border border-border rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
    >
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
              className={`transition-all duration-200 ${ active ? "text-[#1A1916] dark:text-[#f7f6f3]" : "text-[#A5A19D]"
              }`}>
              {icon}
            </div>

            <span
              className={`text-[11px] font-semibold transition-colors duration-200 ${ active ? "text-[#1A1916] dark:text-[#f7f6f3]" : "text-[#A5A19D]"
              }`}>
              {label}
            </span>

            {active && (
              <div
                className=" absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#1A1916] dark:bg-[#f7f6f3] "
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
