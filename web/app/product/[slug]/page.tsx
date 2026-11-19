import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { batteryCompatibility, products, vehicles } from "@/db/schema";
import { ChevronRight } from "lucide-react";
import { BatteryGallery } from "@/components/products/battery-gallery";
import { ProductPurchasePanel } from "@/components/products/product-purchase-panel";
import { PinChecker } from "@/components/layout/pin-checker";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { listCatalog, sellableProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/products/product-card";


const getProduct = cache(async (slug: string) => {
  const [product] = await db.select().from(products)
    .where(and(eq(products.slug, slug), sellableProducts)).limit(1);
  return product;
});

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Battery unavailable | Project Battery", robots: { index: false } };
  const title = product.seoTitle || product.brand + " " + product.model + " | Project Battery";
  const description = product.seoDescription || product.description?.slice(0, 160) ||
    "See prices, warranty and verified vehicle fitment for the " + product.brand + " " + product.model + " battery.";
  const path = "/product/" + encodeURIComponent(product.slug);
  return {
    title, description, alternates: { canonical: path },
    openGraph: { title, description, url: path, images: product.imageUrls.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  await connection();
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const fits = await db.select({ id: vehicles.id, brand: vehicles.brand, model: vehicles.model, variant: vehicles.variant })
    .from(batteryCompatibility).innerJoin(vehicles, eq(vehicles.id, batteryCompatibility.vehicleId))
    .where(and(eq(batteryCompatibility.productId, product.id), eq(vehicles.type, product.category)))
    .orderBy(asc(vehicles.brand), asc(vehicles.model), asc(vehicles.variant));
  const firstFit = fits[0];
  const alternatives = firstFit
    ? (await listCatalog({ vehicleId: firstFit.id, inStock: true }, 5)).filter((item) => item.id !== product.id).slice(0, 4)
    : [];
  const name = product.brand + " " + product.model;
  const spec = [
    ["Model number", product.model],
    ["Battery capacity", product.capacityAh === null ? null : product.capacityAh + " Ah"],
    ...Object.entries(product.specifications),
  ].filter(([, value]) => value);
  const warranty = [
    ["Total", product.warrantyMonths], ["Free replacement", product.warrantyFreeMonths], ["Pro-rata", product.warrantyProRataMonths],
  ] as const;
  const data = {
    "@context": "https://schema.org", "@type": "Product", name, model: product.model,
    brand: { "@type": "Brand", name: product.brand },
    image: product.imageUrls.length ? product.imageUrls : undefined,
    description: product.description || undefined,
    offers: { "@type": "Offer", priceCurrency: "INR", price: (product.withoutExchangePaise / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };

  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/shop">Shop</Link><ChevronRight size={14} aria-hidden="true" />
      <Link href={product.category === "Car" ? "/car-batteries" : "/bike-batteries"}>{product.category} batteries</Link>
      <ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{product.model}</span>
    </nav>
    <div className="product-layout product-detail-grid">
      <div className="page-intro product-detail-intro">
        <p className="eyebrow">{product.brand}</p><h1>{product.model}</h1>
        <p className="muted">{product.category} battery{product.capacityAh ? " · " + product.capacityAh + " Ah" : ""}</p>
      </div>
      <BatteryGallery images={product.imageUrls} title={name} />
      <div className="product-buy grid min-w-0 gap-3">
        <ProductPurchasePanel product={product} />
        <section className="panel operations-card">
          <h2>Delivery & installation</h2>
          <p>Free doorstep delivery and installation for eligible PIN codes. Our team calls after you order to confirm timing.</p>
          <PinChecker />
        </section>
      </div>
    </div>
    <div className="product-layout mt-5">
      <section className="panel operations-card">
        <h2>Specifications</h2>
        {product.description && <p className="whitespace-pre-line">{product.description}</p>}
        <dl className="spec-list">{spec.map(([label, value], index) => <div className="flex flex-wrap justify-between gap-2 border-b pb-1" key={index}><dt>{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>
        {product.features.length > 0 && <><h3 className="font-bold">Features</h3><ul className="list-disc pl-5">{product.features.map((feature, index) => <li key={index}>{feature}</li>)}</ul></>}
      </section>
      <section className="panel operations-card">
        <h2>Warranty & fitment</h2>
        {warranty.some(([, value]) => value !== null) ? <dl className="spec-list">
          {warranty.map(([label, value]) => value !== null && <div key={label} className="flex justify-between gap-2"><dt>{label}</dt><dd>{value} months</dd></div>)}
        </dl> : <p>Warranty details are unavailable for this listing.</p>}
        <p className="muted">Manufacturer warranty terms apply. <Link className="text-link" href="/warranty">Warranty information</Link></p>
        <h3 className="font-bold">Verified compatible vehicles</h3>
        {fits.length ? <ul className="list-disc pl-5">{fits.map((vehicle) => <li key={vehicle.id}>
          <Link className="text-link" href={"/shop?vehicle=" + vehicle.id}>{vehicle.brand} {vehicle.model} {vehicle.variant}</Link>
        </li>)}</ul> : <p>Fitment has not been verified for this battery. <Link className="text-link" href="/contact">Ask for fitment help</Link>.</p>}
      </section>
    </div>
    {firstFit && alternatives.length > 0 && <section className="mt-7">
      <h2 className="mb-3">Other verified fits for {firstFit.brand} {firstFit.model} {firstFit.variant}</h2>
      <div className="catalog-grid">{alternatives.map((item) => <ProductCard key={item.id} product={item} />)}</div>
    </section>}
  </main><StorefrontFooter /></>;
}
