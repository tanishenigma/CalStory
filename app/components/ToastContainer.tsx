'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// ─── types ────────────────────────────────────────────────
interface Toast {
  id: number;
  msg: string;
  icon: string;
  out?: boolean;
}

type ShowToast = (msg: string, icon?: string) => void;

// ─── context ─────────────────────────────────────────────
const ToastCtx = createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastContainer>');
  return ctx;
}

// ─── provider + container ─────────────────────────────────
interface ToastContainerProps {
  children: React.ReactNode;
}

export default function ToastContainer({ children }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef<number>(0);

  const show = useCallback<ShowToast>((msg, icon = '✓') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, msg, icon }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, out: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 220);
    }, 3000);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toastCt">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.out ? ' out' : ''}`}>
            <span>{t.icon}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
