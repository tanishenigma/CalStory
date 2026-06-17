"use client";

import React, { useState } from "react";
import { useApp, uid } from "@/app/context/AppContext";
import { toast } from "sonner";
import type { Meal, MealTime } from "@/app/types";

interface Props {
  onClose: () => void;
}

export default function ManualFoodEntry({ onClose }: Props) {
  const { addMeal } = useApp();

  const [name, setName] = useState("");
  const [time, setTime] = useState<MealTime>("lunch");

  // Macros
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.warning("Please enter a name");
      return;
    }

    // Auto calculate calories if left blank but macros provided
    let finalCal = parseInt(cal) || 0;
    const finalP = parseInt(p) || 0;
    const finalC = parseInt(c) || 0;
    const finalF = parseInt(f) || 0;

    if (!cal && (finalP > 0 || finalC > 0 || finalF > 0)) {
      finalCal = finalP * 4 + finalC * 4 + finalF * 9;
    }

    const meal: Meal = {
      id: uid(),
      name: name.trim(),
      time,
      cal: finalCal,
      p: finalP,
      c: finalC,
      f: finalF,
    };

    addMeal(meal);
    toast.success("Custom meal logged!");
    onClose();
  };

  const isValid =
    name.trim().length > 0 &&
    (parseInt(cal) > 0 ||
      parseInt(p) > 0 ||
      parseInt(c) > 0 ||
      parseInt(f) > 0);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-8">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-[#1A1916] dark:text-[#f7f6f3]">
          Manual Food Entry
        </h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Food Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homemade Greek Salad"
              className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:border-border font-semibold text-[14px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Category
            </label>
            <div className="flex gap-2">
              {["breakfast", "lunch", "dinner", "snack"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t as MealTime)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-colors border ${
                    time === t
                      ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-[#1A1916] dark:border-[#f7f6f3]"
                      : "bg-card text-[#9B9895] border-border hover:border-[#9B9895]"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-subtle border border-border rounded-xl">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Calories
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={cal}
                onChange={(e) => setCal(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-8 outline-none focus:border-border font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9B9895]">
                kcal
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Protein
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-6 outline-none focus:border-border font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9B9895]">
                g
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Carbs
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={c}
                onChange={(e) => setC(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-6 outline-none focus:border-border font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9B9895]">
                g
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Fat
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={f}
                onChange={(e) => setF(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-6 outline-none focus:border-border font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#9B9895]">
                g
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#9B9895] hover:bg-background transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-6 py-2.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm">
            Save Meal
          </button>
        </div>
      </div>
    </div>
  );
}
