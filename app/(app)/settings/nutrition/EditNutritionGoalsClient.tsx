"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";

// Reusable Circular Progress Icon
function CircularProgress({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / total) * circumference;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="var(--color-border)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function EditNutritionGoalsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center px-4 pt-6 pb-4 mb-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-border transition-colors">
          <ChevronLeft
            size={24}
            className="text-foreground"
          />
        </button>
        <h1 className="text-xl font-bold text-foreground ml-2">
          Edit nutrition goals
        </h1>
      </div>

      <div className="px-4">
        {/* Goals List */}
        <div className="bg-foreground rounded-2xl border border-border overflow-hidden mb-6">
          <div className="divide-y divide-border">
            {/* Calorie Goal */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <CircularProgress value={2500} total={2500} color="var(--color-ink)" />
                <div>
                  <div className="text-[13px] font-bold text-muted-foreground">
                    Calorie goal
                  </div>
                  <div className="text-lg font-mono font-bold text-foreground">
                    2,500
                  </div>
                </div>
              </div>
            </div>

            {/* Protein Goal */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <CircularProgress value={175} total={200} color="var(--color-red)" />
                <div>
                  <div className="text-[13px] font-bold text-muted-foreground">
                    Protein goal
                  </div>
                  <div className="text-lg font-mono font-bold text-foreground">
                    175 g
                  </div>
                </div>
              </div>
            </div>

            {/* Carb Goal */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <CircularProgress value={200} total={300} color="var(--color-primary)" />
                <div>
                  <div className="text-[13px] font-bold text-muted-foreground">
                    Carb goal
                  </div>
                  <div className="text-lg font-mono font-bold text-foreground">
                    200 g
                  </div>
                </div>
              </div>
            </div>

            {/* Fat Goal */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <CircularProgress value={70} total={100} color="var(--color-primary)" />
                <div>
                  <div className="text-[13px] font-bold text-muted-foreground">
                    Fat goal
                  </div>
                  <div className="text-lg font-mono font-bold text-foreground">
                    70 g
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Micronutrients */}
        <button className="w-full flex items-center justify-between bg-foreground rounded-2xl border border-border p-4 mb-6">
          <span className="font-bold text-foreground">
            View micronutrients
          </span>
          <ChevronDown size={20} className="text-muted-foreground" />
        </button>

        {/* Auto Generate Button */}
        <button className="w-full bg-foreground text-background font-semibold py-4 rounded-xl transition-transform active:scale-[0.98]">
          Auto Generate Goals
        </button>
      </div>
    </div>
  );
}
