"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function SubmitButton({ children, busy = "Saving…", primary = false, disabled = false }: {
  children: ReactNode; busy?: string; primary?: boolean; disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return <button type="submit" className={primary ? "shop-button primary" : "shop-button"} disabled={pending || disabled}>
    {pending ? busy : children}
  </button>;
}
