import React from "react";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";

export function ProgressPhotos() {
  return (
    <Card className="mb-8 p-0 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
          Progress Photos
        </h3>
      </div>
      <CardContent className="p-6">
        <div className="bg-background rounded-2xl h-40 flex flex-col items-center justify-center mb-4 border border-dashed border-border">
          <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-2">
            <Camera className="text-[#9B9895]" size={24} />
          </div>
          <span className="text-sm font-semibold text-[#9B9895]">
            No photos yet
          </span>
        </div>
        <button className="w-full bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] font-semibold py-3 rounded-xl transition-transform active:scale-[0.98]">
          Upload a Photo
        </button>
      </CardContent>
    </Card>
  );
}
