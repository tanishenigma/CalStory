"use client";

import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import type { MotionValue } from "framer-motion";
import BlurFade from "../animations/BlurFade";

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

  const isMobile = windowWidth < 640;
  const isSm = windowWidth >= 640 && windowWidth < 768;
  const isMd = windowWidth >= 768 && windowWidth < 1024;
  const isLg = windowWidth >= 1024 && windowWidth < 1280;
  const isXl = windowWidth >= 1280 && windowWidth < 1536;

  const getTransform = (
    mobile: number[],
    sm: number[],
    md: number[],
    lg: number[],
    xl: number[],
    xxl: number[],
  ) => {
    if (isMobile) return mobile;
    if (isSm) return sm;
    if (isMd) return md;
    if (isLg) return lg;
    if (isXl) return xl;
    return xxl;
  };

  const { scrollYProgress } = useScroll({ target: containerRef });

  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    getTransform([0, 0], [10, 0], [30, 0], [20, 0], [25, 0], [30, 0]),
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    getTransform(
      [1, 1],
      [1.01, 0.95],
      [0.9, 0.6],
      [1.2, 0.9],
      [1.08, 0.8],
      [1.1, 0.9],
    ),
  );

  const translateX = useTransform(
    scrollYProgress,
    [0, 1],
    getTransform([0, 0], [0, -150], [0, -150], [0, -200], [0, -200], [0, -300]),
  );

  const translateY = useTransform(
    scrollYProgress,
    [0, 1],
    getTransform(
      [0, 0],
      [0, 150],
      [-100, 100],
      [-300, 180],
      [-100, 300],
      [-100, 300],
    ),
  );

  const headerTranslateX = useTransform(
    scrollYProgress,
    [0, 0.5],
    getTransform(
      [0, 0],
      [25, 250],
      [50, 300],
      [50, 400],
      [75, 400],
      [100, 500],
    ),
  );

  const headerTranslateY = useTransform(
    scrollYProgress,
    [0, 0.5],
    getTransform(
      [0, 0],
      [50, -100],
      [-400, -300],
      [-400, -200],
      [125, -140],
      [-400, -200],
    ),
  );

  return (
    <div
      ref={containerRef}
      className="h-auto sm:h-[50rem] md:h-[65rem] lg:h-[85rem] flex items-center justify-center relative p-4 sm:px-8 md:px-12 lg:px-40 overflow-x-hidden">
      <div
        className="md:py-40 w-full max-w-5xl relative flex flex-col items-center justify-center gap-12 "
        style={{ perspective: isMobile ? "none" : "1200px" }}>
        <Header
          translateY={headerTranslateY}
          translateX={headerTranslateX}
          titleComponent={titleComponent}
        />

        <Card
          rotate={rotate}
          scale={scale}
          translateX={translateX}
          translateY={translateY}>
          {children}
        </Card>
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
      style={{ translateY, translateX }}
      className="w-full max-w-sm md:absolute bottom-0 text-left z-10 ">
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
      className="w-full z-10">
      <BlurFade delay={0.4} yOffset={2}>
        <div className="h-full w-full overflow-hidden rounded-3xl bg-background dark:bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_-15px_rgba(0,0,0,0.5),0_0_100px_-20px_rgba(120,119,198,0.25)]">
          {children}
        </div>
      </BlurFade>
    </motion.div>
  );
}
