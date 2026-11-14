import { ChevronDown } from "lucide-react";

export function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#647A8C]"
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-11 w-full appearance-none rounded-[12px] border border-[#D4E2EA] bg-white/90 px-3 pr-9 text-[13px] text-[#1D3A52] outline-none transition-colors focus:border-[#50C878] focus:ring-2 focus:ring-[#50C878]/20 disabled:cursor-not-allowed disabled:bg-[#F3F7FA] disabled:text-[#98A9B5]"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          aria-hidden="true"
          size={16}
          className="pointer-events-none absolute right-3 top-3 text-[#61788A]"
        />
      </div>
    </div>
  );
}
