import type { Metadata } from "next";
import { CatalogPage } from "@/components/shop/catalog-page";

export const metadata: Metadata = { title: "Car Batteries | Project Battery", alternates: { canonical: "/car-batteries" } };
export default function Cars({ searchParams }: PageProps<"/car-batteries">) {
  return <CatalogPage searchParams={searchParams} fixedCategory="Car" />;
}
