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
  const padLeft = navStyle === "floating" ? "md:pl-[240px]" : "md:pl-20";
  return (
    <>
      <div style={{ minHeight: "100dvh" }} className="bg-[#F7F6F3] dark:bg-[#0f0f0e]">
        <PillNav />
        <main
          style={{ paddingBottom: "96px" }}
          className={`${padLeft} md:pb-0 min-h-screen transition-[padding] duration-300`}>
          <div className="mx-auto w-full max-w-6xl px-8 py-10">{children}</div>
        </main>
      </div>
      <BottomNav />
      {pathname === "/dashboard" && <FAB />}
    </>
  );
}
