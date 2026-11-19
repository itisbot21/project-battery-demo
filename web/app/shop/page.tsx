import type { Metadata } from "next";
import { CatalogPage } from "@/components/shop/catalog-page";
import { batteryCategory } from "@/lib/store-policy";

type Query = Record<string, string | string[] | undefined>;
const field = (query: Query, key: string) => typeof query[key] === "string" ? query[key].trim().slice(0, 120) : undefined;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Query> }): Promise<Metadata> {
  const category = batteryCategory(field(await searchParams, "category"));
  return {
    title: (category ? category + " Batteries" : "Shop Car & Bike Batteries") + " | Project Battery",
    alternates: { canonical: category ? "/" + category.toLowerCase() + "-batteries" : "/shop" },
    robots: { index: !Object.keys(await searchParams).some((key) => key !== "category"), follow: true },
  };
}

export default function Shop({ searchParams }: PageProps<"/shop">) {
  return <CatalogPage searchParams={searchParams} />;
}
