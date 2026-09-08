"use client";

import { cn } from "@/app/lib/utils";

export default function BrandLogo({
  className,
  alt = "CalStory",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-full bg-foreground flex items-center justify-center overflow-hidden",
        "h-[38px] w-[38px]",
        className,
      )}>
      <img
        src="/light.png"
        alt={alt}
        width={28}
        height={28}
        className="h-[70%] w-[70%] object-contain"
      />
    </div>
  );
}
