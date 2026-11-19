"use client";

import { useId } from "react";
import { Select } from "@base-ui/react/select";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";

export type Choice = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  name?: string;
  options: Choice[];
  defaultValue?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ChoiceSelect({ label, name, options, defaultValue, value, onChange, placeholder, required, disabled, className }: SelectFieldProps) {
  return <div className={className ? "form-field " + className : "form-field"}>
    <Select.Root items={options} name={name} value={value} defaultValue={defaultValue} required={required} disabled={disabled}
      onValueChange={onChange ? (next) => onChange(next ?? "") : undefined}>
      <Select.Label className="field-label">{label}</Select.Label>
      <Select.Trigger className="choice-trigger">
        <Select.Value placeholder={placeholder} />
        <Select.Icon><ChevronDown size={16} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="choice-positioner" alignItemWithTrigger={false} sideOffset={6}>
          <Select.Popup className="choice-popup">
            <Select.List className="choice-list">
              {options.map((option) => <Select.Item key={option.value} value={option.value} className="choice-option">
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="choice-tick"><Check size={16} aria-hidden="true" /></Select.ItemIndicator>
              </Select.Item>)}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>;
}

export function SearchChoice({ label, options, value, onChange, placeholder, disabled }: {
  label: string; options: Choice[]; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean;
}) {
  const id = useId();
  const selected = options.find((item) => item.value === value) ?? null;

  return <Combobox.Root items={options} value={selected} disabled={disabled} openOnInputClick
    itemToStringLabel={(item) => item.label} itemToStringValue={(item) => item.value}
    isItemEqualToValue={(item, selection) => item.value === selection.value}
    onValueChange={(item) => onChange(item?.value ?? "")}>
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <Combobox.InputGroup className="combobox-control">
        <Combobox.Input id={id} placeholder={placeholder} autoComplete="off" />
        <div className="combobox-tools">
          <Combobox.Clear aria-label={"Clear " + label.toLowerCase()}><X size={15} aria-hidden="true" /></Combobox.Clear>
          <Combobox.Trigger aria-label={"Show " + label.toLowerCase() + " options"}><ChevronDown size={16} aria-hidden="true" /></Combobox.Trigger>
        </div>
      </Combobox.InputGroup>
    </div>
    <Combobox.Portal>
      <Combobox.Positioner className="choice-positioner" sideOffset={6}>
        <Combobox.Popup className="choice-popup">
          <Combobox.Empty className="choice-empty">No matching options.</Combobox.Empty>
          <Combobox.List className="choice-list">
            {(item: Choice) => <Combobox.Item key={item.value} value={item} className="choice-option">
              <span>{item.label}</span>
              <Combobox.ItemIndicator className="choice-tick"><Check size={16} aria-hidden="true" /></Combobox.ItemIndicator>
            </Combobox.Item>}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Portal>
  </Combobox.Root>;
}
