
import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BatteryCharging,
    Bike,
    CarFront,
    ChevronRight,
    MapPin,
    PackageCheck,
    Recycle,
    Wrench,
} from "lucide-react";

import { StorefrontNav } from "@/components/layout/storefront-nav";

export const metadata: Metadata = {
    title: "About Us | Project Battery",
    description:
        "Learn about Project Battery, a car and bike battery store serving Mumbai and Navi Mumbai with doorstep delivery, installation and old battery exchange.",
};

const services = [
    {
        icon: PackageCheck,
        title: "Doorstep delivery",
        description:
            "We deliver to supported PIN codes across Mumbai and Navi Mumbai, with no delivery charge.",
    },
    {
        icon: Wrench,
        title: "Battery installation",
        description:
            "Installation is included. Our team confirms the delivery time after you place your order.",
    },
    {
        icon: Recycle,
        title: "Old battery exchange",
        description:
            "See prices with and without exchange. Eligibility is checked when we collect the old battery.",
    },
];

const steps = [
    {
        number: "01",
        title: "Browse batteries",
        description:
            "Explore car or bike batteries and compare GST-inclusive prices. We confirm vehicle compatibility before installation.",
    },
    {
        number: "02",
        title: "Choose your price",
        description:
            "Select with or without old battery exchange. If an exchange isn't eligible, the price difference is payable on delivery.",
    },
    {
        number: "03",
        title: "Order and get it installed",
        description:
            "Place your order, and our team will contact you to arrange delivery and installation.",
    },
];

export default function AboutPage() {
    return (
        <main className="relative min-h-screen overflow-x-clip bg-[#F6FAFC] text-[#17364E]">
            {/* SUBTLE PAGE BACKGROUND */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[680px] overflow-hidden"
            >
                <div className="absolute -left-32 -top-28 h-[440px] w-[440px] rounded-full bg-[#89CFF0]/25 blur-[110px]" />
                <div className="absolute -right-40 top-20 h-[430px] w-[430px] rounded-full bg-[#89CFF0]/10 blur-[120px]" />
            </div>

            {/* EXISTING NAVBAR */}
            <StorefrontNav />

            <div className="relative z-10 mx-auto max-w-[1160px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
                {/* BREADCRUMBS */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-2 text-xs text-[#648094]"
                >
                    <Link
                        href="/"
                        className="hover:text-[#2678A4]"
                    >
                        Home
                    </Link>

                    <ChevronRight size={13} aria-hidden="true" />

                    <span
                        aria-current="page"
                        className="font-semibold text-[#244963]"
                    >
                        About us
                    </span>
                </nav>

                {/* HERO */}
                <section className="grid items-center gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20 lg:pb-28">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#388CB8]">
                            About Project Battery
                        </p>

                        <h1 className="mt-5 max-w-[720px] font-heading text-[clamp(2.65rem,5vw,4.75rem)] font-extrabold leading-[1.04] tracking-[-0.055em]">
                            Battery shopping,
                            <span className="block text-[#398DB9]">
                                without the hassle.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-[#567286] sm:text-[17px] sm:leading-8">
                            Project Battery focuses on car and bike
                            batteries in Mumbai and Navi Mumbai. We want
                            it to be easy to browse options, understand
                            exchange pricing, and arrange delivery and
                            installation without unnecessary steps.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/#battery-finder"
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#50C878] px-5 text-sm font-bold text-[#123E29] transition-colors hover:bg-[#43BA6D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#269B54]"
                            >
                                Find a battery
                                <ArrowRight size={17} aria-hidden="true" />
                            </Link>

                            <Link
                                href="/#products"
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#C9E1ED] bg-white/65 px-5 text-sm font-semibold text-[#285471] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#398DB9]"
                            >
                                Browse products
                            </Link>
                        </div>
                    </div>

                    {/* SINGLE GLASS VISUAL */}
                    <div className="relative overflow-hidden rounded-[24px] border border-white/85 bg-white/50 px-7 py-10 shadow-[0_14px_44px_rgba(33,75,107,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[#89CFF0]/15 backdrop-blur-[18px] sm:px-9 sm:py-12">
                        <BatteryCharging
                            size={62}
                            strokeWidth={1.3}
                            className="text-[#398DB9]"
                            aria-hidden="true"
                        />

                        <p className="mt-8 text-sm font-semibold text-[#5E7C90]">
                            What we focus on
                        </p>

                        <p className="mt-2 font-heading text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#17364E]">
                            Car batteries.
                            <br />
                            Bike batteries.
                            <br />
                            <span className="text-[#398DB9]">
                                Doorstep service.
                            </span>
                        </p>

                        <div className="mt-9 flex items-center gap-6 border-t border-[#D8E8F1] pt-5 text-sm font-semibold text-[#42647A]">
                            <span className="flex items-center gap-2">
                                <CarFront size={18} aria-hidden="true" />
                                Car
                            </span>

                            <span className="flex items-center gap-2">
                                <Bike size={18} aria-hidden="true" />
                                Bike
                            </span>
                        </div>
                    </div>
                </section>

                {/* OUR SERVICES */}
                <section
                    aria-labelledby="services-heading"
                    className="border-t border-[#D5E5EE] py-16 sm:py-20"
                >
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#398DB9]">
                                The essentials
                            </p>

                            <h2
                                id="services-heading"
                                className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl"
                            >
                                Straightforward service.
                            </h2>

                            <p className="mt-4 max-w-sm text-sm leading-7 text-[#627D90]">
                                The services that matter when it&apos;s
                                time to replace your vehicle battery.
                            </p>
                        </div>

                        <div>
                            {services.map(
                                ({ icon: Icon, title, description }) => (
                                    <div
                                        key={title}
                                        className="flex gap-4 border-b border-[#D8E8F0] py-6 first:pt-0 last:border-b-0 last:pb-0"
                                    >
                                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F7ED] text-[#278956]">
                                            <Icon
                                                size={20}
                                                strokeWidth={1.8}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <div>
                                            <h3 className="text-lg font-bold tracking-tight">
                                                {title}
                                            </h3>

                                            <p className="mt-1.5 max-w-[500px] text-sm leading-6 text-[#627D90]">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </section>

                {/* ORDERING PROCESS */}
                <section
                    aria-labelledby="ordering-heading"
                    className="border-t border-[#D5E5EE] py-16 sm:py-20"
                >
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#398DB9]">
                        How it works
                    </p>

                    <h2
                        id="ordering-heading"
                        className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl"
                    >
                        From browsing to installation.
                    </h2>

                    <div className="mt-9 grid gap-8 md:grid-cols-3 md:gap-10">
                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className="border-t border-[#BAD8E7] pt-5"
                            >
                                <span className="font-heading text-2xl font-extrabold text-[#4FA6D1]">
                                    {step.number}
                                </span>

                                <h3 className="mt-4 text-lg font-bold tracking-tight">
                                    {step.title}
                                </h3>

                                <p className="mt-2 text-sm leading-7 text-[#627D90]">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SERVICE AREA */}
                <section
                    aria-labelledby="coverage-heading"
                    className="flex flex-col gap-6 border-y border-[#D5E5EE] py-12 sm:flex-row sm:items-center sm:justify-between sm:gap-10"
                >
                    <div className="flex items-start gap-4">
                        <MapPin
                            size={23}
                            className="mt-1 shrink-0 text-[#398DB9]"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />

                        <div>
                            <h2
                                id="coverage-heading"
                                className="font-heading text-2xl font-extrabold tracking-tight"
                            >
                                Mumbai &amp; Navi Mumbai
                            </h2>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#627D90]">
                                Delivery depends on the six-digit PIN
                                code. Check availability before ordering.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/#battery-finder"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#BBDDEB] bg-white/70 px-5 text-sm font-semibold text-[#295C7B] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#398DB9]"
                    >
                        Explore batteries
                        <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                </section>
            </div>

            {/* FOOTER */}
            <footer className="border-t border-[#E1EDF3] bg-white/50 px-5 py-9 text-center text-xs text-[#6E8494] backdrop-blur-xl">
                <Link
                    href="/"
                    className="font-extrabold tracking-tight text-[#24455D]"
                >
                    PROJECT
                    <span className="text-[#4C9FC9]">
                        BATTERY
                    </span>
                </Link>

                <p className="mt-2">
                    Car &amp; bike batteries · Mumbai &amp; Navi Mumbai
                </p>
            </footer>
        </main>
    );
}