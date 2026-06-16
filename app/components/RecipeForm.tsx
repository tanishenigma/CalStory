"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, uid } from "@/app/context/AppContext";
import { toast } from "sonner";
import type { MealTime, Meal } from "@/app/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

interface RecipeFormProps {
  onClose: () => void;
}

export default function RecipeForm({ onClose }: RecipeFormProps) {
  const { state, addMeal } = useApp();


  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [time, setTime] = useState<MealTime>("lunch");

  const [lastEdited, setLastEdited] = useState<"macros" | "cals" | null>(null);

  useEffect(() => {
    if (lastEdited === "macros") {
      const pVal = parseInt(p) || 0;
      const cVal = parseInt(c) || 0;
      const fVal = parseInt(f) || 0;
      if (pVal > 0 || cVal > 0 || fVal > 0) {
        const totalCals = Math.round((pVal * 4) + (cVal * 4) + (fVal * 9));
        setCal(totalCals.toString());
      }
    }
  }, [p, c, f, lastEdited]);

  useEffect(() => {
    if (lastEdited === "cals") {
      const calVal = parseInt(cal) || 0;
      if (calVal > 0) {
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

  const isValid = name.trim().length > 0 && (parseInt(cal) || 0) > 0;

  return (
    <div className="w-[360px] bg-white dark:bg-[#1a1916] rounded-[24px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#F0EFEC] dark:border-[#2a2a2a] origin-bottom-right animate-in zoom-in-95 duration-200">
      <h2 className="text-[18px] font-bold mb-6 text-[#1A1916] dark:text-[#f7f6f3]">Log Food</h2>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3]"
            placeholder="e.g. White Rice"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Category</label>
            <Select value={time} onValueChange={(val) => setTime(val as MealTime)}>
              <SelectTrigger className="w-full border-b border-t-0 border-x-0 border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 px-0 rounded-none shadow-none focus:ring-0 focus:border-[#1A1916] dark:focus:border-[#f7f6f3] font-semibold text-[15px] h-auto">
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
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Calories</label>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={cal}
              onChange={(e) => {
                setLastEdited("cals");
                setCal(e.target.value);
              }}
              className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3]"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Carbs (g)</label>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={c}
              onChange={(e) => {
                setLastEdited("macros");
                setC(e.target.value);
              }}
              className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] text-emerald-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Protein (g)</label>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={p}
              onChange={(e) => {
                setLastEdited("macros");
                setP(e.target.value);
              }}
              className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] text-red-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Fat (g)</label>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={f}
              onChange={(e) => {
                setLastEdited("macros");
                setF(e.target.value);
              }}
              className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] text-yellow-500"
              placeholder="0"
            />
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="w-full py-3 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            Save Meal
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] active:scale-[0.99] transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
