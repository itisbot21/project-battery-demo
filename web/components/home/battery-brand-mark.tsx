"use client";

import Image from "next/image";
import { useState } from "react";

export function BatteryBrandMark({ brand, logo }: { brand: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = brand.split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("");

  return <span className="battery-brand-mark" aria-hidden="true">
    {logo && !failed ? <Image src={logo} alt="" fill sizes="136px" onError={() => setFailed(true)} />
      : <span>{initials}</span>}
  </span>;
}
