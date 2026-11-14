
"use client";

import { useState } from "react";
import Image from "next/image";

type BatteryBrand = {
    name: string;
    logo: string;
    color: string;
};

const brands: BatteryBrand[] = [
    {
        name: "Amaron",
        logo: "/images/battery-brands/amaron.jpg",
        color: "#36984B",
    },
    {
        name: "PowerZone",
        logo: "/images/battery-brands/powerzone.jpg",
        color: "#E87427",
    },
    {
        name: "Exide",
        logo: "/images/battery-brands/exide.jpeg",
        color: "#D52835",
    },
    {
        name: "SF Sonic",
        logo: "/images/battery-brands/sf-sonic.jpg",
        color: "#28589C",
    },
];

function BrandLogo({ brand }: { brand: BatteryBrand }) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="flex h-[58px] w-full items-center justify-center">
            {imageError ? (
                <span
                    className="text-xl font-black tracking-[-0.04em] sm:text-2xl"
                    style={{ color: brand.color }}
                >
                    {brand.name}
                </span>
            ) : (
                <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={180}
                    height={70}
                    unoptimized
                    onError={() => setImageError(true)}
                    className="h-[55px] w-full max-w-[165px] object-contain transition-transform duration-200 group-hover:scale-[1.04]"
                />
            )}
        </div>
    );
}

type Props = {
    onSelectBrand: (brand: string) => void;
};

export function BatteryBrandSection({
    onSelectBrand,
}: Props) {
    return (
        <section
            id="battery-brands"
            aria-labelledby="battery-brand-heading"
            className="relative z-10 mx-auto w-full max-w-[1160px] px-5 pb-16 sm:px-8 sm:pb-20"
        >
            {/* SECTION HEADING */}
            <div className="mb-7 text-center">
                <h2
                    id="battery-brand-heading"
                    className="font-heading text-2xl font-extrabold tracking-[-0.035em] text-[#17364E] sm:text-3xl"
                >
                    Find Your Battery by Brand
                </h2>

                <p className="mt-2 text-sm text-[#60798C]">
                    Explore car and bike batteries from our brands.
                </p>
            </div>

            {/* BRAND GRID */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
                {brands.map((brand) => (
                    <button
                        key={brand.name}
                        type="button"
                        onClick={() => onSelectBrand(brand.name)}
                        aria-label={`Browse ${brand.name} batteries`}
                        className="group flex min-h-[122px] flex-col items-center justify-center rounded-[16px] border border-[#D7E7EF] bg-white/65 px-3 py-4 text-center shadow-[0_5px_18px_rgba(27,70,96,0.04)] backdrop-blur-[12px] transition-[transform,border-color,background-color] hover:-translate-y-0.5 hover:border-[#89CFF0] hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9]"
                    >
                        <BrandLogo brand={brand} />

                        <span className="mt-2 text-xs font-semibold text-[#4A657A]">
                            {brand.name}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}