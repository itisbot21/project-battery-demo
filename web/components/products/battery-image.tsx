"use client";

import Image from "next/image";
import { BatteryMedium } from "lucide-react";
import { useState } from "react";

export function BatteryImage({ src, alt, large = false }: { src?: string; alt: string; large?: boolean }) {
  const [failed, setFailed] = useState<string>();
  const valid = src && (src.startsWith("https://") || (src.startsWith("/") && !src.startsWith("//")));
  return (
    <div className={large ? "battery-image battery-image-large" : "battery-image"}>
      {valid && src !== failed ? (
        <Image src={src} alt={alt} fill unoptimized={src.startsWith("https://")}
          sizes={large ? "(max-width: 850px) 100vw, 500px" : "(max-width: 640px) 50vw, 280px"}
          onError={() => setFailed(src)} />
      ) : <div className="battery-image-fallback"><BatteryMedium size={44} aria-hidden="true" /><span>Photo unavailable</span></div>}
    </div>
  );
}
