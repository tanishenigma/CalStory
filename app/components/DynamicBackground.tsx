"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { usePrefsStore, resolveTheme } from "@/app/store/prefsStore";

export function DynamicBackground() {
  const dynamicBackground = usePrefsStore((s) => s.dynamicBackground);
  const theme = usePrefsStore((s) => s.theme);
  const isDark = resolveTheme(theme) === "dark";

  useEffect(() => {
    if (dynamicBackground) {
      document.documentElement.classList.add("dynamic-bg-active");
    } else {
      document.documentElement.classList.remove("dynamic-bg-active");
    }
  }, [dynamicBackground]);

  if (!dynamicBackground) return null;

  const src = isDark ? "/bg-dark.svg" : "/bg-light.svg";

  return (
    <motion.img
      key={src}
      src={src}
      alt=""
      aria-hidden
      loading="eager"
      decoding="async"
      className="fixed top-0 left-0 w-full opacity-10 dark:opacity-20 h-full pointer-events-none select-none"
      style={{ zIndex: 0, objectFit: "cover" }}
      animate={{
        filter: [
          "blur(80px) hue-rotate(0deg)",
          "blur(80px) hue-rotate(360deg)",
        ],
      }}
      transition={{
        duration: 90,
        ease: "linear",
        repeat: Infinity,
      }}
    />
  );
}
