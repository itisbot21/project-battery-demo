
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bike, CarFront } from "lucide-react";
import {
    vehicleManufacturers,
    type VehicleKind,
} from "@/lib/vehicle-manufacturers";

const SHOW_FIRST = 8;

export function ManufacturerSection() {
    const [kind, setKind] = useState<VehicleKind>("car");
    const [showAll, setShowAll] = useState(false);

    const manufacturers = vehicleManufacturers[kind];
    const visible = showAll
        ? manufacturers
        : manufacturers.slice(0, SHOW_FIRST);

    function changeKind(next: VehicleKind) {
        setKind(next);
        setShowAll(false);
    }

    return (
        <section
            id="manufacturers"
            aria-labelledby="manufacturer-heading"
            className="relative z-10 mx-auto max-w-[1160px] px-5 pb-16 sm:px-8 sm:pb-20"
        >
            {/* SECTION HEADER */}
            <div className="mb-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <h2
                        id="manufacturer-heading"
                        className="font-heading text-2xl font-extrabold tracking-tight text-[#17364E] sm:text-3xl"
                    >
                        Shop by manufacturer
                    </h2>

                    <p className="mt-2 text-sm text-[#60798C]">
                        Choose your vehicle brand to explore models.
                    </p>
                </div>

                {/* CAR / BIKE SWITCH */}
                <div
                    role="group"
                    aria-label="Vehicle category"
                    className="inline-flex w-full rounded-[14px] border border-[#D6E8F1] bg-white/55 p-1 backdrop-blur-md sm:w-auto"
                >
                    {(
                        [
                            { value: "car", label: "Car", Icon: CarFront },
                            { value: "bike", label: "Bike", Icon: Bike },
                        ] as const
                    ).map(({ value, label, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={kind === value}
                            onClick={() => changeKind(value)}
                            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-[11px] px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9] sm:flex-none ${kind === value
                                    ? "bg-[#89CFF0] text-[#17364E] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                                    : "text-[#60798C] hover:bg-white/70"
                                }`}
                        >
                            <Icon size={18} aria-hidden="true" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* MANUFACTURER TILES */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {visible.map((manufacturer) => (
                    <Link
                        key={`${kind}-${manufacturer.slug}`}
                        href={`/${kind}-batteries/${manufacturer.slug}`}
                        className="group flex min-h-[90px] flex-col items-center justify-center rounded-[16px] border border-[#DAE8F0] bg-white/65 px-3 py-4 text-center shadow-[0_4px_14px_rgba(32,72,102,0.04)] transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#89CFF0] hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9]"
                    >
                        <span className="text-[15px] font-extrabold tracking-tight text-[#25485F] sm:text-base">
                            {manufacturer.name}
                        </span>

                        <span className="mt-1 text-[11px] font-medium text-[#7790A1] group-hover:text-[#398DB9]">
                            Explore models
                        </span>
                    </Link>
                ))}
            </div>

            {/* VIEW ALL */}
            {manufacturers.length > SHOW_FIRST && (
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setShowAll((current) => !current)}
                        aria-expanded={showAll}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#B8DDEC] bg-white/60 px-5 text-[13px] font-bold text-[#2E7195] transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-[#398DB9]"
                    >
                        {showAll
                            ? "Show fewer"
                            : `View all ${kind} manufacturers`}

                        <ArrowRight
                            size={16}
                            aria-hidden="true"
                            className={showAll ? "rotate-[-90deg]" : ""}
                        />
                    </button>
                </div>
            )}
        </section>
    );
}