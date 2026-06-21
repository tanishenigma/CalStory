"use client";

import PillNav from "@/app/components/PillNav";
import BottomNav from "@/app/components/BottomNav";
import FAB from "@/app/components/FAB";
import { usePrefsStore } from "@/app/store/prefsStore";
import { usePathname } from "next/navigation";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navStyle = usePrefsStore((s) => s.navbarStyle);
  const pathname = usePathname();
  const padLeft = navStyle === "floating" ? "lg:pl-[240px]" : "lg:pl-20";
  return (
    <>
      <div
        style={{ minHeight: "100dvh" }}
        className="bg-background ml-0 sm:ml-5">
        <PillNav />
        <main
          style={{ paddingBottom: "96px" }}
          className={`${padLeft} pb-0 min-h-screen transition-[padding] duration-300`}>
          <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      {pathname === "/dashboard" && <FAB />}
    </>
  );
}
