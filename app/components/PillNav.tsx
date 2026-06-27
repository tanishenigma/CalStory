"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefsStore } from "@/app/store/prefsStore";
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Settings,
  Flame,
  X,
  Menu,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { useEffect, useState } from "react";

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

// function MobileDrawer({
//   pathname,
//   onClose,
// }: {
//   pathname: string;
//   onClose: () => void;
// }) {
//   const { user } = useAuthStore();
//   const { state } = useApp();

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[199] lg:hidden"
//         onClick={onClose}
//       />
//       {/* Drawer */}
//       <div className="fixed left-0 inset-y-0 w-72 max-w-[85vw] bg-foreground/95 bg-foreground/95 backdrop-blur-2xl border-r border-white/10 dark:border-white/10 z-[200] lg:hidden flex flex-col gap-1 py-4 px-3 shadow-2xl">
//         {/* Close button */}
//         <button
//           onClick={onClose}
//           className="self-end p-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-white/10 transition-colors mb-2">
//           <X size={20} />
//         </button>

//         {/* Brand */}
//         <div className="flex items-center gap-2.5 px-2 py-1.5 mb-3">
//           <Link
//             href="/"
//             className="flex items-center cursor-pointer relative z-10 shrink-0 gap-2.5 group">
//             <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
//               <Flame
//                 size={18}
//                 className="text-background fill-white fill-foreground"
//               />
//             </div>
<h1 className="font-bold text-base tracking-tight text-foreground dark:text-foreground">
  // CalStory //{" "}
</h1>;
//           </Link>
//         </div>

//         {/* Nav items */}
//         {NAV.map(({ href, label, Icon }) => {
//           const active = pathname === href || pathname.startsWith(href + "/");
//           return (
//             <Link
//               key={href}
//               href={href}
//               onClick={onClose}
//               className="relative block">
//               {active && (
//                 <motion.div
//                   layoutId="active-mobile"
//                   className="absolute inset-0 rounded-xl bg-foreground"
//                   transition={{ type: "spring", stiffness: 320, damping: 28 }}
//                 />
//               )}
//               <div
//                 className={[
//                   "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
//                   active
//                     ? "text-background"
//                     : "text-[#1A1916] dark:text-muted-foreground hover:bg-subtle hover:bg-foreground",
//                 ].join(" ")}>
//                 <Icon size={20} />
//                 <span className="text-sm font-semibold">{label}</span>
//               </div>
//             </Link>
//           );
//         })}

//         {/* Spacer */}
//         <div className="flex-1" />

//         {/* Profile card */}
//         <Link
//           href="/settings"
//           onClick={onClose}
//           className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-subtle transition-colors group">
//           {user?.photoURL ? (
//             <img
//               src={user.photoURL}
//               alt="avatar"
//               className="w-8 h-8 rounded-full border-2 border-border"
//             />
//           ) : (
//             ""
//           )}
//           <span className="text-sm font-semibold text-foreground flex-1 truncate">
//             {state.profile?.name
//               ? state.profile.name.charAt(0).toUpperCase() +
//               state.profile.name.slice(1)
//               : ""}
//           </span>
//           <Settings
//             size={15}
//             className="text-muted-foreground group-hover:text-[#1A1916] dark:group-hover:text-foreground transition-colors"
//           />
//         </Link>
//       </div>
//     </>
//   );
// }

function PillNavInner({ pathname }: { pathname: string }) {
  return (
    <>
      {/* Desktop sidebar — hidden below lg */}
      <nav className="fixed left-3 lg:left-4 top-1/2 -translate-y-1/2 w-16 bg-background border border-border rounded-[30px] shadow-[0_4px_24px_oklch(0_0_0/_0.07)] dark:shadow-none hidden lg:flex flex-col items-center gap-[2px] py-[10px] px-2 z-[200]">
        <div className="w-[38px] h-[38px] bg-foreground rounded-full flex items-center justify-center mb-[10px]">
          <Flame size={18} className="text-background fill-background" />
        </div>

        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="relative w-11 h-11 rounded-full flex items-center justify-center focus-visible:outline-none">
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
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

  return (
    <>
      {/* Desktop floating sidebar — lg and up */}
      <nav className="fixed left-3 lg:left-4 inset-y-4 w-64 bg-card/60 dark:bg-card/60 backdrop-blur-2xl border border-border/60 dark:border-border/40 rounded-3xl shadow-[0_8px_32px_oklch(0_0_0/_0.08)] dark:shadow-none hidden lg:flex flex-col gap-1 py-4 px-3 z-[200] ">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-3 ">
          <Link
            href="/"
            className="flex items-center cursor-pointer relative z-10 shrink-0 gap-2.5 group ">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Flame size={18} className="text-background fill-background" />
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
              <Link
                key={href}
                href={href}
                className="relative block focus-visible:outline-none">
                {active && (
                  <motion.div
                    layoutId="active-floating"
                    className="absolute inset-0 rounded-xl bg-foreground"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                )}
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
          },
        )}

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
