"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useApp } from "@/app/context/AppContext";
import type { MouseEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

// ease-out-quart — fast start, gentle settle; correct for elements entering the screen.
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

interface DatePickerProps {
  onClose: () => void;
}

export default function DatePicker({ onClose }: DatePickerProps) {
  const { state, setDate } = useApp();
  const [selected, setSelected] = useState<Date>(
    new Date(state.selDate + "T00:00:00"),
  );

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
    <AnimatePresence>
      <motion.div
        key="datepicker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-picker-title"
        className="fixed inset-0 z-[500] flex min-h-[100dvh] items-center justify-center bg-black/30 p-3 backdrop-blur-sm sm:p-4"
        onClick={handleOverlayClick}>
        <motion.div
          key="datepicker-card"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
          className="max-h-[calc(100dvh-1.5rem)] w-full max-w-[22rem] overflow-y-auto rounded-3xl border border-border/70 bg-background p-4 shadow-[0_20px_60px_oklch(0_0_0/_0.15)] sm:max-h-[calc(100dvh-2rem)] sm:p-6">
          <div id="date-picker-title" className="mb-4 text-base font-bold text-foreground">
            Pick a Date
          </div>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={{ after: new Date() }}
            fixedWeeks
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date()}
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              month_caption: "flex h-10 items-center justify-between",
              caption_label: "flex items-center gap-1",
              nav: "flex items-center gap-1",
              button_previous: "h-8 w-8 rounded-full text-primary transition-colors hover:bg-primary/10",
              button_next: "h-8 w-8 rounded-full text-primary transition-colors hover:bg-primary/10",
              month_grid: "w-full border-collapse",
              weekdays: "grid grid-cols-7",
              weekday: "w-auto text-center text-[10px] font-semibold uppercase text-muted-foreground",
              week: "grid w-full grid-cols-7",
              day: "flex items-center justify-center p-0 text-center",
              day_button: "h-9 w-9 rounded-full text-sm transition-colors hover:bg-primary/10 sm:h-10 sm:w-10",
              selected: "bg-primary font-bold text-white hover:bg-primary",
              today: "font-bold text-primary",
              outside: "text-muted-foreground/50",
              disabled: "cursor-not-allowed text-muted-foreground/50",
              chevron: "fill-current",
            }}
            components={{
              Dropdown: ({ value, onChange, options }) => {
                return (
                  <Select
                    value={String(value)}
                    onValueChange={(val) =>
                      onChange?.({
                        target: { value: val },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }>
                    <SelectTrigger
                      className="
                        h-8
                        w-fit
                        border-none
                        bg-transparent
                        px-1
                        font-semibold
                        shadow-none
                        focus:ring-0
                        text-[#1A1916]
                        text-foreground
                      ">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent
                      className="z-[510] max-h-[min(16rem,50dvh)] max-w-[calc(100vw-2rem)] p-2 backdrop-blur-md bg-background/95"
                      position="popper"
                      sideOffset={4}>
                      {options?.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                          disabled={option.disabled}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              },
            }}
          />
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]">
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
