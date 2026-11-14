
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ManufacturerPage } from "@/components/manufacturers/manufacturer-page";

import {
    getVehicleManufacturer,
    vehicleManufacturers,
} from "@/lib/vehicle-manufacturers";

type Props = {
    params: Promise<{ manufacturer: string }>;
};

export function generateStaticParams() {
    return vehicleManufacturers.bike.map(({ slug }) => ({
        manufacturer: slug,
    }));
}

export async function generateMetadata({
    params,
}: Props): Promise<Metadata> {
    const { manufacturer: slug } = await params;
    const manufacturer = getVehicleManufacturer("bike", slug);

    if (!manufacturer) {
        return { title: "Manufacturer not found" };
    }

    return {
        title: `${manufacturer.name} Bike Batteries | Project Battery`,
        robots: { index: false, follow: true },
    };
}

export default async function BikeManufacturerPage({
    params,
}: Props) {
    const { manufacturer: slug } = await params;

    const manufacturer = getVehicleManufacturer("bike", slug);

    if (!manufacturer) notFound();

    return (
        <ManufacturerPage
            kind="bike"
            manufacturer={manufacturer}
        />
    );
}