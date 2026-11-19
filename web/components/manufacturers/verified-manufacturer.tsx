import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VerifiedFinder } from "@/components/battery-finder/verified-finder";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { listBrands, listVehicles } from "@/lib/catalog";
import { manufacturerSlug, normalize, type BatteryCategory } from "@/lib/store-policy";
import { getVehicleManufacturer } from "@/lib/vehicle-manufacturers";

async function ManufacturerContent({ params, type }: { params: Promise<{ manufacturer: string }>; type: BatteryCategory }) {
  await connection();
  const { manufacturer } = await params;
  const [vehicles, brands] = await Promise.all([listVehicles(type), listBrands()]);
  const selected = vehicles.find((vehicle) => manufacturerSlug(vehicle.brand) === manufacturerSlug(manufacturer));
  const legacy = getVehicleManufacturer(type === "Car" ? "car" : "bike", manufacturer);
  const name = selected?.brand ?? legacy?.name;
  if (!name) notFound();
  const matching = vehicles.filter((vehicle) => normalize(vehicle.brand) === normalize(name));
  return <>
    <div className="page-intro">
      <Link className="text-link" href={"/" + type.toLowerCase() + "-batteries"}>{type} batteries</Link>
      <h1>{name} {type.toLowerCase()} batteries</h1>
      <p>Choose your model and variant to check fitment.</p>
    </div>
    <VerifiedFinder vehicles={matching} brands={brands} initialType={type} manufacturer={name} />
  </>;
}

export function VerifiedManufacturer({ params, type }: { params: Promise<{ manufacturer: string }>; type: BatteryCategory }) {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <Suspense fallback={<p role="status">Loading vehicle models…</p>}><ManufacturerContent params={params} type={type} /></Suspense>
  </main><StorefrontFooter /></>;
}
