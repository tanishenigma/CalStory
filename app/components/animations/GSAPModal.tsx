"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import type { MouseEvent } from "react";

interface GSAPModalProps {
  children: (closeModal: () => void) => React.ReactNode;
  onClose: () => void;
}

export default function GSAPModal({ children, onClose }: GSAPModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReducedMotion) return;

    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: "power2.out" },
    );
    gsap.fromTo(
      sheetRef.current,
      { y: 60, opacity: 0.4, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.4)" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    if (prefersReducedMotion) {
      onClose();
      return;
    }

    // Exit animations: ease-out feels snappy and responsive.
    // Entrances can be dramatic; exits should be quick and clean.
    gsap.to(sheetRef.current, {
      y: 48,
      opacity: 0,
      scale: 0.97,
      duration: 0.18,
      ease: "power2.out",
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.18,
      ease: "power2.out",
      onComplete: onClose,
    });
  }

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) handleClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0.2272 0.0049 173.9454 / 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 9999,
      }}>
      <div
        ref={sheetRef}
        style={{
          background: "var(--color-card)",
          borderRadius: "22px 22px 0 0",
          width: "100%",
          maxWidth: "620px",
          padding: "20px 24px 36px",
          maxHeight: "92vh",
          overflowY: "auto",
        }}>
        {children(handleClose)}
      </div>
    </div>
  );
}
