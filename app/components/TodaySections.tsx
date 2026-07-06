"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { Card } from "./ui/card";

interface Workout {
  id: string | number;
  name: string;
  duration: number;
  type: string;
}

interface Meal {
  id: string | number;
  name: string;
  time: string;
  cal: number;
}

interface TodaySectionsProps {
  todayWorkouts: Workout[];
  todayMeals: Meal[];
  recentWorkouts: Workout[];
  recentMeals: Meal[];
  mealIcons: Record<
    string,
    React.ComponentType<{ size?: number; className?: string }>
  >;
}

function useStackedInteraction(hoverDelay = 20) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFast, setIsFast] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsFast(false);
      setIsExpanded(true);
    }, hoverDelay);
  };

  const onMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isFast) setIsExpanded(false);
  };

  const onClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsFast(true);
    setIsExpanded((prev) => !prev);
  };

  return {
    isExpanded,
    isFast,
    handlers: { onMouseEnter, onMouseLeave, onClick },
  };
}

function stackedStyle(
  i: number,
  isExpanded: boolean,
  cardHeight: number,
  gap: number,
  maxVisible: number,
  peekOffset = 14,
) {
  return {
    zIndex: maxVisible - i,
    transform: isExpanded
      ? `translateY(${i * (cardHeight + gap)}px) scale(1)`
      : `translateY(${i * peekOffset}px) scale(${1 - i * 0.04})`,
    opacity: isExpanded ? 1 : 1 - i * 0.15,
  };
}

export function TodaySections({
  todayWorkouts,
  todayMeals,
  recentWorkouts,
  recentMeals,
  mealIcons,
}: TodaySectionsProps) {
  const cardHeight = 72;
  const gap = 15;
  const maxVisible = 3;

  const workoutStack = useStackedInteraction(300);
  const mealStack = useStackedInteraction(300);

  const visibleWorkouts = recentWorkouts.slice(0, maxVisible);
  const visibleMeals = recentMeals.slice(0, maxVisible);

  const collapsedHeight = cardHeight + 20;
  const workoutExpandedHeight =
    visibleWorkouts.length * cardHeight + (visibleWorkouts.length - 1) * gap;
  const mealExpandedHeight =
    visibleMeals.length * cardHeight + (visibleMeals.length - 1) * gap;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Today's Workout */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[17px] font-bold text-foreground">
            Today's Workout
          </span>
          <Link
            href="/workouts"
            className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors dark:hover:text-foreground">
            See all →
          </Link>
        </div>

        {todayWorkouts.length === 0 ? (
          <Link href="/workouts" className="block">
            <Card className="flex flex-col items-center justify-center py-12 text-center gap-1 min-h-[200px] hover:bg-gray-50 transition-colors ">
              <div className="text-3xl mb-1" aria-hidden="true">
                🏋️
              </div>
              <div className="font-bold text-[14px] text-foreground">
                No workout yet
              </div>
              <div className="text-[12px] text-muted-foreground">
                Tap to go to Workouts page to log a session
              </div>
            </Card>
          </Link>
        ) : (
          <div
            className={`relative ${
              workoutStack.isFast
                ? "transition-[height] duration-150 ease-out"
                : "transition-[height] duration-300 ease-out"
            }`}
            style={{
              height: workoutStack.isExpanded
                ? workoutExpandedHeight
                : collapsedHeight,
            }}
            {...workoutStack.handlers}>
            {visibleWorkouts.map((w, i) => (
              <Card
                key={w.id}
                className={`absolute inset-x-0 top-0 flex items-center gap-4 p-4 origin-top ${
                  workoutStack.isFast
                    ? "transition-all duration-150 ease-out"
                    : "transition-all duration-300 ease-out"
                }`}
                style={stackedStyle(
                  i,
                  workoutStack.isExpanded,
                  cardHeight,
                  gap,
                  maxVisible,
                )}>
                <div
                  className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-xl flex-shrink-0"
                  aria-hidden="true">
                  💪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] text-foreground truncate">
                    {w.name}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {w.duration} min • {w.type}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Today's Meals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[17px] font-bold text-foreground">
            Today's Meals
          </span>
          <Link
            href="/nutrition"
            className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors dark:hover:text-foreground">
            See all →
          </Link>
        </div>

        {todayMeals.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center gap-1 min-h-[200px]">
            <div className="text-3xl mb-1" aria-hidden="true">
              🍽️
            </div>
            <div className="font-bold text-[14px] text-foreground">
              No meals logged
            </div>
            <div className="text-[12px] text-muted-foreground">
              Tap + below to add a meal
            </div>
          </Card>
        ) : (
          <div
            className={`relative  ${
              mealStack.isFast
                ? "transition-[height] duration-150 ease-out"
                : "transition-[height] duration-300 ease-out"
            }`}
            style={{
              height: mealStack.isExpanded
                ? mealExpandedHeight
                : collapsedHeight,
            }}
            {...mealStack.handlers}>
            {visibleMeals.map((m, i) => {
              const Icon = mealIcons[m.time] || Utensils;
              return (
                <Card
                  key={m.id}
                  className={`absolute inset-x-0 top-0 flex items-center gap-4 p-4 origin-top ${
                    mealStack.isFast
                      ? "transition-all duration-150 ease-out"
                      : "transition-all duration-300 ease-out"
                  }`}
                  style={stackedStyle(
                    i,
                    mealStack.isExpanded,
                    cardHeight,
                    gap,
                    maxVisible,
                  )}>
                  <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-xl flex-shrink-0">
                    <Icon size={20} className="text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] text-foreground truncate">
                      {m.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {m.time}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-lg text-foreground tabular-nums">
                      {m.cal}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      kcal
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
