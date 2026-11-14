"use client";

import BatteryFinder, { type FinderSelection } from "@/components/battery-finder/battery-finder";
import { HeroVisual } from "@/components/home/hero-visual";
import { ServicesStrip } from "@/components/home/services-strip";

type Props = { finderKey: number; availableBrands: string[]; onSearch: (selection: FinderSelection) => void };

export function HeroSection({ finderKey, availableBrands, onSearch }: Props) {
  return (
    <section className="relative w-full pb-8 sm:pb-12">
      <div className="relative h-[82svh] min-h-[min(470px,85svh)] max-h-[780px] w-full overflow-hidden">
        <HeroVisual />
      </div>

      <ServicesStrip />

      <div className="mx-auto mt-6 w-[calc(100%-24px)] max-w-[1140px] sm:mt-8 sm:w-[calc(100%-48px)]">
        <BatteryFinder
          key={finderKey}
          availableBrands={availableBrands}
          onSearch={onSearch}
        />
      </div>
    </section>
  );
}
