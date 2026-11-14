"use client";

import BatteryFinder, { type FinderSelection } from "@/components/battery-finder/battery-finder";
import { HeroVisual } from "@/components/home/hero-visual";
import { useHeroScroll } from "@/hooks/use-hero-scroll";

type Props = { finderKey: number; availableBrands: string[]; onSearch: (selection: FinderSelection) => void };

export function HeroSection({ finderKey, availableBrands, onSearch }: Props) {
  const { heroSceneRef, heroPanelRef, heroVisualRef } = useHeroScroll();
  return (
    <section
      ref={heroSceneRef}
      className="relative isolate z-10 w-full"
    >
      {/* STICKY BACKGROUND PANEL */}
      <div
        ref={heroPanelRef}
        className="sticky top-0 z-0 h-[82svh] min-h-[min(470px,85svh)] max-h-[780px] w-full overflow-hidden"
      >
        <HeroVisual visualRef={heroVisualRef} />
      </div>

      {/* BATTERY FINDER SCROLLS OVER HERO */}
      <div className="relative z-20 mx-auto -mt-14 w-[calc(100%-24px)] max-w-[1140px] sm:-mt-20 sm:w-[calc(100%-48px)]">
        <BatteryFinder
          key={finderKey}
          availableBrands={availableBrands}
          onSearch={onSearch}
        />
      </div>

      {/* TRANSPARENT SCROLL RUNWAY */}
      {/* Allows the image to fully fade before unsticking */}
      <div
        aria-hidden="true"
        className="h-[clamp(110px,16svh,190px)]"
      />
    </section>
  );
}
