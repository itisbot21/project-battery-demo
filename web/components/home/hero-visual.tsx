import type { RefObject } from "react";

const roadMask =
  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.06) 8%, rgba(0,0,0,.38) 18%, rgba(0,0,0,.82) 30%, black 42%)";

export function HeroVisual({ visualRef }: { visualRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={visualRef}
      className="absolute inset-0 will-change-[opacity]"
    >
      {/* ROAD IMAGE + TRANSPARENT TOP FADE */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage: roadMask,
          maskImage: roadMask,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/hero-road.png')",
          }}
        />

        {/* DARK READABILITY GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#10283A]/90 via-[#17364E]/55 to-[#17364E]/15" />

        {/* SUBTLE BOTTOM SHADING */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#10283A]/25 to-transparent" />
      </div>

      {/* HERO TEXT */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1280px] items-center px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:pb-24">
        <div className="max-w-[660px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6EAFA] sm:text-xs">
            Car &amp; bike batteries
          </p>

          <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,4.8rem)] font-extrabold leading-[1.03] tracking-[-0.05em] text-white">
            Reliable batteries.

            <span className="mt-2 block text-[#DCF5FF]">
              Delivered &amp; installed.
            </span>
          </h1>

          <p className="mt-5 max-w-[570px] text-[14px] leading-6 text-white/90 sm:text-[16px] sm:leading-7">
            Shop genuine car and bike batteries in
            Mumbai and Navi Mumbai. Free doorstep
            delivery, installation and old battery
            exchange.
          </p>
        </div>
      </div>

      {/* BATTERY PRODUCT ARTWORK */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] right-[4%] z-10 hidden h-[52%] w-[38%] bg-contain bg-bottom bg-no-repeat lg:block"
        style={{
          backgroundImage:
            "url('/images/hero-batteries.png')",
        }}
      />
    </div>
  );
}
