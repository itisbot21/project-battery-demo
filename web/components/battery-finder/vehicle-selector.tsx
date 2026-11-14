import { Bike, CarFront } from "lucide-react";

export type VehicleType = "Car" | "Bike";

export function VehicleSelector({ type, onTypeChange }: { type: VehicleType; onTypeChange: (type: VehicleType) => void }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-[14px] bg-[#EEF4F7] p-1"
      role="group"
      aria-label="Vehicle type"
    >
      {(
        [
          { label: "Car", icon: CarFront },
          { label: "Bike", icon: Bike },
        ] as const
      ).map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          aria-pressed={type === label}
          onClick={() => onTypeChange(label)}
          className={`flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-[12px] px-4 text-[13px] font-semibold transition-colors ${type === label
              ? "bg-[#50C878] text-[#123E29] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              : "text-[#566C7D] hover:bg-white/80"
            }`}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
