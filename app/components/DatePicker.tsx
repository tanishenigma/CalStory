"use client";
import { useState } from "react";
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
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[500]"
      onClick={handleOverlayClick}>
      <div className="bg-background rounded-[20px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-[fadeUp_0.3s_ease]">
        <div className="font-bold text-base mb-4 bg-background text-[#1A1916] dark:text-[#f7f6f3]">
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
                      dark:text-[#f7f6f3]
                    ">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent
                    className="z-[510] max-h-[250px] p-2 backdrop-blur-md bg-transparent"
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
          className="w-full mt-2 py-2.5 border border-border rounded-full bg-white/50 dark:bg-[#1a1916] text-sm font-semibold text-[#9B9895] hover:bg-white dark:hover:bg-[#0f0f0e] transition-colors cursor-pointer ">
          Cancel
        </button>
      </div>
    </div>
  );
}
