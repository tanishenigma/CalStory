"use client";

import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import type { MotionValue } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}

export function ContainerScroll({
  titleComponent,
  children,
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    const check = () => setWindowWidth(window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isMobile = windowWidth <= 768;
  const isMd = windowWidth > 768 && windowWidth <= 1024;

  const { scrollYProgress } = useScroll({ target: containerRef });

  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, 0] : [20, 0],
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [1, 1] : isMd ? [1.02, 0.9] : [1.05, 0.8],
  );

  const translateY = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? [0, 0] : [0, 80],
  );

  // MD specific: Smaller horizontal shifts so they don't overlap or fly off screen
  const cardTranslateX = useTransform(
    scrollYProgress,
    [0, 0.5],
    isMobile ? [0, 0] : isMd ? [0, -100] : [0, -250],
  );

  const headerTranslateX = useTransform(
    scrollYProgress,
    [0, 0.5],
    isMobile ? [0, 0] : isMd ? [0, 200] : [0, 600],
  );

  // MD specific: Less extreme vertical pull so it stays aligned with the card
  const headerTranslateY = useTransform(
    scrollYProgress,
    [0, 0.5],
    isMobile ? [0, 0] : isMd ? [0, -250] : [0, -400],
  );

  return (
    <div
      ref={containerRef}
      // Fixed the extreme padding here: md:px-12 is much safer than md:px-60
      className="h-auto md:h-[65rem] lg:h-[85rem] flex items-center justify-center relative p-4 md:px-12 lg:px-40 overflow-x-hidden">
      <div
        className="md:py-40 w-full max-w-6xl relative flex flex-col items-center justify-center"
        style={{ perspective: isMobile ? "none" : "1200px" }}>
        <Card
          rotate={rotate}
          scale={scale}
          translateY={translateY}
          translateX={cardTranslateX}>
          {children}
        </Card>

        <Header
          translateY={headerTranslateY}
          translateX={headerTranslateX}
          titleComponent={titleComponent}
        />
      </div>
    </div>
  );
}

function Header({
  translateY,
  translateX,
  titleComponent,
}: {
  translateY: MotionValue<number>;
  translateX: MotionValue<number>;
  titleComponent: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        translateY,
        translateX,
      }}
      // Adjusted anchor point so it doesn't default to overlapping the left side
      className="w-full max-w-sm md:absolute left-0 lg:left-[15%] bottom-[-10%] lg:bottom-0 text-left z-10">
      {titleComponent}
    </motion.div>
  );
}

function Card({
  rotate,
  scale,
  translateY,
  translateX,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  translateX: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        translateY,
        translateX,
        transformOrigin: "top center",
      }}
      className="w-full z-0 ">
      <div className="h-full w-full overflow-hidden rounded-3xl bg-background dark:bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_-15px_rgba(0,0,0,0.5),0_0_100px_-20px_rgba(120,119,198,0.25)]">
        {children}
      </div>
    </motion.div>
  );
}
