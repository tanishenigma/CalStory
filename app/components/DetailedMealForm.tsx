"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, uid } from "@/app/context/AppContext";
import { toast } from "sonner";
import type { MealTime, Meal, RecentMeal } from "@/app/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Barcode, X } from "lucide-react";

interface DetailedMealFormProps {
  onClose: () => void;
}

export default function DetailedMealForm({ onClose }: DetailedMealFormProps) {
  const { state, addMeal } = useApp();

  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [time, setTime] = useState<MealTime>("lunch");

  const [lastEdited, setLastEdited] = useState<"macros" | "cals" | null>(null);

  // Auto-calculation logic
  useEffect(() => {
    if (lastEdited === "macros") {
      const pVal = parseInt(p) || 0;
      const cVal = parseInt(c) || 0;
      const fVal = parseInt(f) || 0;
      if (pVal > 0 || cVal > 0 || fVal > 0) {
        const totalCals = Math.round(pVal * 4 + cVal * 4 + fVal * 9);
        setCal(totalCals.toString());
      }
    }
  }, [p, c, f, lastEdited]);

  useEffect(() => {
    if (lastEdited === "cals") {
      const calVal = parseInt(cal) || 0;
      if (calVal > 0) {
        // Reverse calculate based on typical split if user only enters calories
        setP(Math.round((calVal * 0.3) / 4).toString());
        setC(Math.round((calVal * 0.4) / 4).toString());
        setF(Math.round((calVal * 0.3) / 9).toString());
      } else {
        setP("");
        setC("");
        setF("");
      }
    }
  }, [cal, lastEdited]);

  async function handleSave() {
    if (!name.trim()) {
      toast.warning("Please enter a name");
      return;
    }

    const meal: Meal = {
      id: uid(),
      name: name.trim(),
      time,
      cal: parseInt(cal) || 0,
      p: parseInt(p) || 0,
      c: parseInt(c) || 0,
      f: parseInt(f) || 0,
    };

    addMeal(meal);
    setName("");
    setCal("");
    setP("");
    setC("");
    setF("");
    setTime("lunch");
    toast.success("Meal logged!");
    onClose();
  }

  function handleQuickAdd(r: RecentMeal) {
    setName(r.name);
    setCal(r.cal.toString());
    setP(r.p.toString());
    setC(r.c.toString());
    setF(r.f.toString());
    setTime(r.time);
  }

  const isValid = name.trim().length > 0 && (parseInt(cal) || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm mx-4 sm:mx-auto bg-card rounded-[24px] p-4 sm:p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[18px] font-bold text-[#1A1916] dark:text-[#f7f6f3]">
            Log Food
          </h2>
          <button
            onClick={onClose}
            className="text-[#9B9895] hover:text-[#1A1916] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-border py-1.5 outline-none font-semibold text-[15px] focus:border-border pr-8"
              placeholder="e.g. White Rice"
            />
            <button
              type="button"
              className="absolute right-0 bottom-1.5 text-[#9B9895] hover:text-[#1A1916] transition-colors">
              <Barcode className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">
                Category
              </label>
              <Select
                value={time}
                onValueChange={(val) => setTime(val as MealTime)}>
                <SelectTrigger className="w-full border-b border-t-0 border-x-0 border-border py-1.5 px-0 rounded-none shadow-none focus:ring-0 focus:border-border font-semibold text-[15px] h-auto">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">
                Calories
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cal}
                  onChange={(e) => {
                    setLastEdited("cals");
                    setCal(e.target.value);
                  }}
                  className="w-full border-b border-border py-1.5 outline-none font-semibold text-[15px] focus:border-border pr-8"
                  placeholder="0"
                />
                <span className="absolute right-0 bottom-2 text-[10px] font-bold text-[#9B9895] select-none">
                  kcal
                </span>
              </div>
            </div>
          </div>

          <div className="bg-subtle border border-border rounded-2xl p-4 mt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] mb-3">
              Macros
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="relative">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">
                  Carbs
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={c}
                  onChange={(e) => {
                    setLastEdited("macros");
                    setC(e.target.value);
                  }}
                  className="w-full bg-transparent border-b border-border py-1.5 outline-none font-semibold text-[15px] focus:border-border text-emerald-500 pr-3"
                  placeholder="0"
                />
                <span className="absolute right-0 bottom-2 text-[10px] font-bold text-[#9B9895] select-none">
                  g
                </span>
              </div>
              <div className="relative">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">
                  Protein
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={p}
                  onChange={(e) => {
                    setLastEdited("macros");
                    setP(e.target.value);
                  }}
                  className="w-full bg-transparent border-b border-border py-1.5 outline-none font-semibold text-[15px] focus:border-border text-red-500 pr-3"
                  placeholder="0"
                />
                <span className="absolute right-0 bottom-2 text-[10px] font-bold text-[#9B9895] select-none">
                  g
                </span>
              </div>
              <div className="relative">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">
                  Fat
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={f}
                  onChange={(e) => {
                    setLastEdited("macros");
                    setF(e.target.value);
                  }}
                  className="w-full bg-transparent border-b border-border py-1.5 outline-none font-semibold text-[15px] focus:border-border text-yellow-500 pr-3"
                  placeholder="0"
                />
                <span className="absolute right-0 bottom-2 text-[10px] font-bold text-[#9B9895] select-none">
                  g
                </span>
              </div>
            </div>
          </div>

          {state.recents && state.recents.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] mb-2">
                Quick Add
              </div>
              <div className="flex flex-wrap gap-2">
                {state.recents.slice(0, 4).map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => handleQuickAdd(r)}
                    className="px-3 py-1.5 bg-background hover:bg-[#E8E7E4] rounded-lg text-[11px] font-bold text-[#1A1916] dark:text-[#f7f6f3] transition-colors">
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className="w-full py-3 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
              Save Meal
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 border border-border text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-background active:scale-[0.99] transition-transform">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
