"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ value, max, onChange, label = "Quantity" }: {
  value: number; max: number; onChange: (value: number) => void; label?: string;
}) {
  const validMax = Math.max(max, 1);
  return <div className="quantity-field">
    <span className="field-label">{label}</span>
    <div className="quantity-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1}
        onClick={() => onChange(Math.min(validMax, value - 1))}><Minus size={17} aria-hidden="true" /></button>
      <output aria-label="Current quantity">{value}</output>
      <button type="button" aria-label="Increase quantity" disabled={value >= validMax}
        onClick={() => onChange(value + 1)}><Plus size={17} aria-hidden="true" /></button>
    </div>
  </div>;
}
