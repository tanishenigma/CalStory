'use client';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useApp } from '@/app/context/AppContext';
import type { MouseEvent } from 'react';

interface DatePickerProps {
  onClose: () => void;
}

export default function DatePicker({ onClose }: DatePickerProps) {
  const { state, setDate } = useApp();
  const [selected, setSelected] = useState<Date>(new Date(state.selDate + 'T00:00:00'));

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date = String(day.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${date}`;
    
    setDate(key);
    setSelected(day);
    onClose();
  }

  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-[#1A1916] dark:bg-[#f7f6f3]/40 backdrop-blur-sm flex items-center justify-center z-[500]"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-[20px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-[fadeUp_0.2s_ease]">
        <div className="font-bold text-base mb-4 text-[#1A1916] dark:text-[#f7f6f3]">Pick a Date</div>
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={{ after: new Date() }}
        />
        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-lg text-sm font-semibold text-[#9B9895] hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
