import type { Metadata } from "next";
import { CatalogPage } from "@/components/shop/catalog-page";

export const metadata: Metadata = { title: "Bike Batteries | Project Battery", alternates: { canonical: "/bike-batteries" } };
export default function Bikes({ searchParams }: PageProps<"/bike-batteries">) {
  return <CatalogPage searchParams={searchParams} fixedCategory="Bike" />;
}
