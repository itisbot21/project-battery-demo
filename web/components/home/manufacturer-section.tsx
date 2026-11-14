
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, CarFront } from "lucide-react";

import {
    vehicleManufacturers,
    type VehicleKind,
} from "@/lib/vehicle-manufacturers";

// Verified Simple Icons slugs where available.
const brandIcons: Record<
    VehicleKind,
    Record<string, string>
> = {
    car: {
        "maruti-suzuki": "suzuki",
        hyundai: "hyundai",
        tata: "tata",
        honda: "honda",
        toyota: "toyota",
        kia: "kia",
        mahindra: "mahindra",
        volkswagen: "volkswagen",
        skoda: "skoda",
        nissan: "nissan",
        renault: "renault",
    },
    bike: {
        honda: "honda",
        yamaha: "yamahamotorcorporation",
        suzuki: "suzuki",
        ktm: "ktm",
    },
};

// Website icons for manufacturers without
// a matching logo in Simple Icons.
const brandDomains: Record<
    VehicleKind,
    Record<string, string>
> = {
    car: {
        "maruti-suzuki": "marutisuzuki.com",
        hyundai: "hyundai.com",
        tata: "tatamotors.com",
        honda: "hondacarindia.com",
        toyota: "toyotabharat.com",
        kia: "kia.com",
        mahindra: "mahindra.com",
        mg: "mgmotor.co.in",
        volkswagen: "volkswagen.co.in",
        skoda: "skoda-auto.co.in",
        nissan: "nissan.in",
        renault: "renault.co.in",
    },
    bike: {
        honda: "honda2wheelersindia.com",
        hero: "heromotocorp.com",
        bajaj: "bajajauto.com",
        tvs: "tvsmotor.com",
        "royal-enfield": "royalenfield.com",
        yamaha: "yamaha-motor-india.com",
        suzuki: "suzukimotorcycle.co.in",
        ktm: "ktmindia.com",
        jawa: "jawamotorcycles.com",
    },
};

function ManufacturerLogo({
    kind,
    slug,
    name,
}: {
    kind: VehicleKind;
    slug: string;
    name: string;
}) {
    const iconSlug = brandIcons[kind][slug];
    const domain = brandDomains[kind][slug];

    const sources = [
        ...(iconSlug
            ? [`https://cdn.simpleicons.org/${iconSlug}`]
            : []),
        ...(domain
            ? [
                `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
            ]
            : []),
    ];

    const [sourceIndex, setSourceIndex] = useState(0);
    const src = sources[sourceIndex];

    return (
        <div className="flex h-[52px] w-full items-center justify-center">
            {src ? (
                <Image
                    src={src}
                    alt={`${name} logo`}
                    width={120}
                    height={52}
                    unoptimized
                    onError={() =>
                        setSourceIndex((index) => index + 1)
                    }
                    className="h-[48px] w-[110px] object-contain transition-transform duration-200 group-hover:scale-105"
                />
            ) : (
                <span className="text-xl font-extrabold tracking-tight text-[#357EA5]">
                    {name.slice(0, 2).toUpperCase()}
                </span>
            )}
        </div>
    );
}

const SHOW_FIRST = 10;

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
            {/* HEADER */}
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
                            {
                                value: "car",
                                label: "Car",
                                Icon: CarFront,
                            },
                            {
                                value: "bike",
                                label: "Bike",
                                Icon: Bike,
                            },
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

            {/* MANUFACTURER GRID — 5 PER ROW ON DESKTOP */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {visible.map((manufacturer) => (
                    <Link
                        key={`${kind}-${manufacturer.slug}`}
                        href={`/${kind}-batteries/${manufacturer.slug}`}
                        className="group flex min-h-[132px] flex-col items-center justify-center rounded-[16px] border border-[#DAE8F0] bg-white/65 px-3 py-4 text-center shadow-[0_4px_14px_rgba(32,72,102,0.04)] transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#89CFF0] hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9]"
                    >
                        <ManufacturerLogo
                            kind={kind}
                            slug={manufacturer.slug}
                            name={manufacturer.name}
                        />

                        <span className="mt-3 text-[13px] font-bold text-[#25485F] sm:text-[14px]">
                            {manufacturer.name}
                        </span>

                        {/* <span className="mt-1 text-[11px] font-medium text-[#7790A1] group-hover:text-[#398DB9]">
                            Explore models
                        </span> */}
                    </Link>
                ))}
            </div>

            {/* VIEW ALL */}
            {manufacturers.length > SHOW_FIRST && (
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setShowAll((value) => !value)}
                        aria-expanded={showAll}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#B8DDEC] bg-white/60 px-5 text-[13px] font-bold text-[#2E7195] transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-[#398DB9]"
                    >
                        {showAll
                            ? "Show fewer"
                            : `View all ${kind} manufacturers`}

                        <ArrowRight
                            size={16}
                            aria-hidden="true"
                            className={showAll ? "-rotate-90" : ""}
                        />
                    </button>
                </div>
            )}
        </section>
    );
}