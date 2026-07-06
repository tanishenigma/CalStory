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
        className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[500]"
        onClick={handleOverlayClick}>
        <motion.div
          key="datepicker-card"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
          className="bg-background rounded-[20px] p-6 shadow-[0_20px_60px_oklch(0_0_0/_0.15)]">
          <div className="font-bold text-base mb-4 bg-background text-foreground">
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
              selected: "text-primary ",
              today: "bg-primary text-white font-bold rounded-full",
              chevron: "fill-primary",
              day_button: "h-10 w-10 rounded-full transition-colors",
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
                      className="z-[510] max-h-[250px] p-2 backdrop-blur-md bg-transparent "
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
            className="w-full mt-2 py-2.5 border border-border rounded-full bg-white/50 bg-foreground text-sm font-semibold text-muted-foreground hover:bg-white hover:bg-foreground transition-colors cursor-pointer ">
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
