
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    ChevronRight,
} from "lucide-react";

import { StorefrontNav } from "@/components/layout/storefront-nav";

import type {
    VehicleKind,
    VehicleManufacturer,
} from "@/lib/vehicle-manufacturers";

type Props = {
    kind: VehicleKind;
    manufacturer: VehicleManufacturer;
};

export function ManufacturerPage({
    kind,
    manufacturer,
}: Props) {
    const typeLabel = kind === "car" ? "Car" : "Bike";

    return (
        <main className="relative min-h-screen bg-[#F6FAFC] text-[#17364E]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden"
            >
                <div className="absolute -left-20 -top-28 h-80 w-80 rounded-full bg-[#89CFF0]/20 blur-[100px]" />
            </div>

            <StorefrontNav />

            <div className="relative mx-auto max-w-[1160px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14">

                {/* BREADCRUMBS */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex flex-wrap items-center gap-2 text-xs text-[#6A8193]"
                >
                    <Link href="/" className="hover:text-[#246D96]">
                        Home
                    </Link>

                    <ChevronRight size={13} aria-hidden="true" />

                    <Link
                        href="/#manufacturers"
                        className="hover:text-[#246D96]"
                    >
                        {typeLabel} manufacturers
                    </Link>

                    <ChevronRight size={13} aria-hidden="true" />

                    <span
                        aria-current="page"
                        className="font-semibold text-[#25485F]"
                    >
                        {manufacturer.name}
                    </span>
                </nav>

                {/* HEADING */}
                <header className="mt-10 border-b border-[#D8E7EF] pb-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#398DB9]">
                        {typeLabel} batteries
                    </p>

                    <h1 className="mt-2 font-heading text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-tight">
                        {manufacturer.name} {typeLabel} Batteries
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#617B8E]">
                        Explore {manufacturer.name} {kind} models.
                        Battery compatibility will be confirmed
                        before installation.
                    </p>
                </header>

                {/* MODEL LIST */}
                <section
                    aria-labelledby="models-heading"
                    className="pt-9"
                >
                    <h2
                        id="models-heading"
                        className="text-xl font-extrabold tracking-tight"
                    >
                        Vehicle models
                    </h2>

                    <p className="mt-1 text-sm text-[#6A8193]">
                        Model names are for browsing only; verified
                        battery matches are not available yet.
                    </p>

                    <ul className="mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                        {manufacturer.models.map((model) => (
                            <li
                                key={model}
                                className="border-b border-[#DDE8EF] py-4 text-sm font-semibold text-[#32536A]"
                            >
                                {model}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* ACTIONS */}
                <div className="mt-10 flex flex-wrap items-center gap-3">
                    <Link
                        href="/#battery-finder"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#50C878] px-5 text-sm font-bold text-[#123E29] transition-colors hover:bg-[#43BA6D]"
                    >
                        Open battery finder
                        <ArrowRight size={17} aria-hidden="true" />
                    </Link>

                    <Link
                        href="/#manufacturers"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C9DFEB] px-4 text-sm font-semibold text-[#315D78] hover:bg-white/60"
                    >
                        <ArrowLeft size={16} aria-hidden="true" />
                        All manufacturers
                    </Link>
                </div>
            </div>
        </main>
    );
}