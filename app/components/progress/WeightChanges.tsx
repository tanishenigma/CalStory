import { ChevronRight } from "lucide-react";

const WeightChanges = () => {
  const weightChanges = [
    { label: "3 day", value: "--", isPositive: true },
    { label: "7 day", value: "--", isPositive: true },
    { label: "14 day", value: "--", isPositive: true },
    { label: "30 day", value: "--", isPositive: true },
    { label: "90 day", value: "--", isPositive: true },
    { label: "All Time", value: "--", isPositive: true },
  ];

  return (
    <div>
      <div className="bg-white dark:bg-[#1a1916] border border-[#E8E7E4] dark:border-[#3a3a3a] rounded-2xl overflow-hidden ">
        <div className="p-4 border-b border-[#E8E7E4] dark:border-[#3a3a3a]">
          <h3 className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
            Weight Changes
          </h3>
        </div>
        <div className="divide-y divide-[#E8E7E4] dark:divide-[#3a3a3a]">
          {weightChanges.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 m-1">
              <span className="text-md font-medium text-[#1A1916] dark:text-[#f7f6f3]">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-mono font-semibold ${item.isPositive ? "text-[#9B9895]" : "text-[#22C55E]"}`}>
                  {item.value}
                </span>
                <ChevronRight size={16} className="text-[#9B9895]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeightChanges;
