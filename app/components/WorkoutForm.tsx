"use client";

import React, { useState } from "react";
import { useApp, uid } from "@/app/context/AppContext";
import { toast } from "sonner";
import type { Workout, Exercise } from "@/app/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Copy, Trash2, X, Plus, CopyPlus } from "lucide-react";

export const WORKOUT_TYPES = [
  "Resistance", "Cardio", "Yoga", "HIIT", "Pilates", "CrossFit", "Powerlifting", "Flexibility", "Sports", "Other"
];

interface Props {
  onClose: () => void;
  initialWorkout?: Workout | null;
  mode?: "new" | "edit" | "duplicate";
}

interface ExSetState {
  id: string;
  reps: string;
  kg: string;
}

interface ExState {
  id: string;
  name: string;
  sets: ExSetState[];
}

export default function WorkoutForm({ onClose, initialWorkout, mode = "new" }: Props) {
  const { addWorkout, saveTemplate } = useApp();


  const [name, setName] = useState(initialWorkout?.name || "");
  const [type, setType] = useState(initialWorkout?.type || "Resistance");
  const [duration, setDuration] = useState(initialWorkout?.duration?.toString() || "");

  const [exercises, setExercises] = useState<ExState[]>(
    initialWorkout?.exercises?.map((e) => {
      let mappedSets: ExSetState[] = [];
      if (e.sets && e.sets.length > 0) {
        mappedSets = e.sets.map(s => ({ id: uid(), reps: s.reps.toString(), kg: s.kg.toString() }));
      } else if (e.reps && e.reps.length > 0) {
        mappedSets = e.reps.map(r => ({ id: uid(), reps: r.toString(), kg: (e.kg || 0).toString() }));
      } else {
        mappedSets = [{ id: uid(), reps: "", kg: "" }];
      }
      return {
        id: uid(),
        name: e.name,
        sets: mappedSets
      };
    }) || []
  );

  const [notes, setNotes] = useState(initialWorkout?.notes || "");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  function addEx() {
    setExercises([...exercises, { id: uid(), name: "", sets: [{ id: uid(), reps: "", kg: "" }] }]);
  }

  function updateExName(exId: string, val: string) {
    setExercises(prev => prev.map(e => e.id === exId ? { ...e, name: val } : e));
  }

  function deleteEx(exId: string) {
    setExercises(exercises.filter(e => e.id !== exId));
  }

  function addSet(exId: string) {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      // Copy weight from last set if exists
      const lastSet = e.sets[e.sets.length - 1];
      return {
        ...e,
        sets: [...e.sets, { id: uid(), reps: "", kg: lastSet ? lastSet.kg : "" }]
      };
    }));
  }

  function updateSet(exId: string, setId: string, field: "reps" | "kg", val: string) {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      return {
        ...e,
        sets: e.sets.map(s => s.id === setId ? { ...s, [field]: val } : s)
      };
    }));
  }

  function deleteSet(exId: string, setId: string) {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      return {
        ...e,
        sets: e.sets.filter(s => s.id !== setId)
      };
    }));
  }

  function handleSave() {
    if (!name.trim()) {
      toast.warning("Please enter a workout name");
      return;
    }
    const dur = parseInt(duration) || 0;
    if (dur <= 0) {
      toast.warning("Please enter a valid duration");
      return;
    }

    const exList: Exercise[] = exercises
      .filter((e) => e.name.trim())
      .map((e) => {
        const validSets = e.sets
          .map(s => ({ reps: parseInt(s.reps) || 0, kg: parseInt(s.kg) || 0 }))
          .filter(s => s.reps > 0);

        const legacyReps = validSets.map(s => s.reps);
        const legacyKg = validSets.length > 0 ? validSets[0].kg : 0;

        return {
          name: e.name.trim(),
          reps: legacyReps.length > 0 ? legacyReps : [0],
          kg: legacyKg,
          sets: validSets.length > 0 ? validSets : [{ reps: 0, kg: 0 }],
        };
      });

    const w: Workout = {
      id: mode === "edit" && initialWorkout ? initialWorkout.id : uid(),
      name: name.trim(),
      type,
      duration: dur,
      exercises: exList,
      notes: notes.trim(),
    };

    if (saveAsTemplate) {
      saveTemplate({
        id: uid(),
        name: w.name,
        type: w.type,
        exercises: w.exercises,
      });
    }

    addWorkout(w);
    setName("");
    setDuration("");
    setExercises([]);
    setNotes("");
    toast.success(mode === "edit" ? "Workout updated!" : "Workout saved!");
    onClose();
  }

  const isValid = 
    name.trim().length > 0 && 
    (parseInt(duration) || 0) > 0 && 
    exercises.some(e => e.name.trim().length > 0 && e.sets.some(s => (parseInt(s.reps) || 0) > 0));

  return (
    <div className="w-full bg-white dark:bg-[#1a1916] rounded-[24px] p-6 shadow-sm border border-[#F0EFEC] dark:border-[#2a2a2a] animate-in slide-in-from-top-4 duration-300">
      <h2 className="text-[18px] font-bold mb-6 text-[#1A1916] dark:text-[#f7f6f3]">
        {mode === "edit" ? "Edit Workout" : mode === "duplicate" ? "Duplicate Workout" : "Log Workout"}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3]"
            placeholder="e.g. Upper Body"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full border-b border-t-0 border-x-0 border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 px-0 rounded-none shadow-none focus:ring-0 focus:border-[#1A1916] dark:focus:border-[#f7f6f3] font-semibold text-[15px] h-auto">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border-b border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 outline-none font-semibold text-[15px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3]"
              placeholder="0"
            />
          </div>
        </div>

        <div className="pt-4">
          <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-3">Exercises</label>
          <div className="space-y-4">
            {exercises.map((ex) => (
              <div key={ex.id} className="bg-[#FAFAF8] border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-3">
                {/* Exercise Header */}
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Exercise Name"
                    value={ex.name}
                    onChange={(e) => updateExName(ex.id, e.target.value)}
                    className="flex-1 bg-transparent border-b border-transparent py-1 outline-none text-[15px] font-bold focus:border-[#1A1916] dark:focus:border-[#f7f6f3] transition-colors"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => deleteEx(ex.id)}
                      className="p-1.5 text-[#9B9895] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sets List */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[#9B9895]">
                    <div className="w-12">Set</div>
                    <div className="flex-1">Reps</div>
                    <div className="flex-1">Kg</div>
                    <div className="w-6"></div>
                  </div>

                  {ex.sets.map((set, idx) => (
                    <div key={set.id} className="flex items-center gap-2 group">
                      <div className="w-12 text-xs font-semibold text-[#9B9895] text-center bg-white dark:bg-[#1a1916] border border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 rounded-lg">
                        {idx + 1}
                      </div>
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) => updateSet(ex.id, set.id, "reps", e.target.value)}
                        className="flex-1 bg-white dark:bg-[#1a1916] border border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 px-3 rounded-lg outline-none text-sm font-mono focus:border-[#1A1916] dark:focus:border-[#f7f6f3] transition-colors"
                      />
                      <input
                        type="number"
                        placeholder="0"
                        value={set.kg}
                        onChange={(e) => updateSet(ex.id, set.id, "kg", e.target.value)}
                        className="flex-1 bg-white dark:bg-[#1a1916] border border-[#E8E7E4] dark:border-[#3a3a3a] py-1.5 px-3 rounded-lg outline-none text-sm font-mono focus:border-[#1A1916] dark:focus:border-[#f7f6f3] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => deleteSet(ex.id, set.id)}
                        className="w-6 h-6 flex items-center justify-center text-[#9B9895] hover:text-[#EF4444] hover:bg-white dark:hover:bg-[#1a1916] rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(ex.id)}
                  className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9B9895] mt-1 hover:text-[#1A1916] transition-colors py-2 bg-[#E8E7E4]/50 hover:bg-[#E8E7E4] rounded-lg"
                >
                  <Plus className="w-3 h-3" /> Add Set
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addEx}
            className="w-full mt-4 py-3 border border-dashed border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#FAFAF8] dark:hover:bg-[#1a1916] hover:text-[#1A1916] hover:border-[#1A1916] dark:hover:border-[#f7f6f3] dark:border-[#f7f6f3]/30 transition-all"
          >
            + Add Exercise
          </button>
        </div>

        <div className="pt-4 space-y-4">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-xl p-3 outline-none text-[13px] focus:border-[#1A1916] dark:focus:border-[#f7f6f3] bg-[#FAFAF8] resize-none"
              rows={2}
              placeholder="How did it feel?"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={saveAsTemplate}
              onCheckedChange={(checked) => setSaveAsTemplate(checked as boolean)}
              className="w-4 h-4 rounded border-[#E8E7E4] dark:border-[#3a3a3a] data-[state=checked]:bg-[#1A1916] data-[state=checked]:text-white"
            />
            <span className="text-xs font-semibold text-[#1A1916] dark:text-[#f7f6f3]">
              Save as reusable template
            </span>
          </label>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={!isValid}
            type="button"
            className="w-full py-3 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {mode === "edit" ? "Save Changes" : mode === "duplicate" ? "Save Duplicate" : "Save Workout"}
          </button>
          <button
            onClick={onClose}
            type="button"
            className="w-full py-3 border border-[#E8E7E4] dark:border-[#3a3a3a] text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] active:scale-[0.99] transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
