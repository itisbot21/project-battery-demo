import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { VerifiedFinder } from "@/components/battery-finder/verified-finder";
import { ChoiceSelect } from "@/components/design/choice-field";
import { LoadingPanel } from "@/components/design/commerce-ui";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { ProductCard } from "@/components/products/product-card";
import { FilterDrawer } from "@/components/shop/filter-drawer";
import { catalogCapacities, listBrands, listCatalog, listVehicles, PAGE_SIZE } from "@/lib/catalog";
import { BATTERY_CATEGORIES, batteryCategory, normalize, positiveId } from "@/lib/store-policy";

type Query = Record<string, string | string[] | undefined>;
const field = (query: Query, key: string) => typeof query[key] === "string" ? query[key].trim().slice(0, 120) : undefined;

function paise(value?: string) {
  if (!value || !/^[0-9]{1,7}([.][0-9]{1,2})?$/.test(value)) return undefined;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

const sorts = [
  { value: "", label: "Recommended" }, { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" }, { value: "warranty", label: "Longest warranty" },
];

async function CatalogContent({ searchParams, fixedCategory }: { searchParams: Promise<Query>; fixedCategory?: "Car" | "Bike" }) {
  const query = await searchParams;
  const vehicleParam = query.vehicle !== undefined;
  const id = positiveId(field(query, "vehicle"));
  const page = Math.min(positiveId(field(query, "page")) ?? 1, 1000);
  const search = field(query, "q");
  const brand = field(query, "brand");
  const capacity = positiveId(field(query, "capacity"));
  const warranty = positiveId(field(query, "warranty"));
  const minPrice = field(query, "min");
  const maxPrice = field(query, "max");
  const inStock = field(query, "stock") === "1";
  const sort = field(query, "sort");
  const [vehicles, brands, capacities] = await Promise.all([listVehicles(), listBrands(), catalogCapacities()]);
  const vehicle = vehicles.find((row) => row.id === id && (!fixedCategory || row.type === fixedCategory));
  const category = fixedCategory ?? (vehicle ? batteryCategory(vehicle.type) : batteryCategory(field(query, "category")));
  const rows = vehicleParam && !vehicle ? [] : await listCatalog({
    category, brand, search, capacity, warranty, inStock, sort, page, vehicleId: vehicle?.id,
    minPrice: paise(minPrice), maxPrice: paise(maxPrice),
  });
  const verified = vehicle && (rows.length > 0 || (await listCatalog({ vehicleId: vehicle.id }, 1)).length > 0);
  const vehicleName = vehicle && [vehicle.brand, vehicle.model, vehicle.variant].filter(Boolean).join(" ");
  const base = fixedCategory ? "/" + fixedCategory.toLowerCase() + "-batteries" : "/shop";
  const resetHref = vehicle ? base + "?vehicle=" + vehicle.id : base;
  const filtersUsed = [search, brand, capacity, warranty, minPrice, maxPrice, inStock, sort,
    !vehicle && !fixedCategory && category].filter(Boolean).length;
  const noFit = vehicleParam && !verified;
  const visibleCount = Math.min(rows.length, PAGE_SIZE);

  function pageHref(number: number) {
    const params = new URLSearchParams();
    for (const key of ["q", "brand", "category", "vehicle", "capacity", "warranty", "min", "max", "stock", "sort"]) {
      const value = field(query, key);
      if (value) params.set(key, value);
    }
    if (number > 1) params.set("page", String(number));
    const suffix = params.toString();
    return suffix ? base + "?" + suffix : base;
  }

  const filters = <form className="filter-form" method="get" action={base}>
    {vehicleParam && <input type="hidden" name="vehicle" value={field(query, "vehicle") ?? ""} />}
    <label className="form-field">Search
      <span className="search-field"><Search size={17} aria-hidden="true" />
        <input className="store-input" type="search" name="q" defaultValue={search} placeholder="Brand or model" />
      </span>
    </label>
    {!vehicle && !fixedCategory && <ChoiceSelect label="Vehicle type" name="category" defaultValue={category ?? ""}
      options={[{ value: "", label: "Cars and bikes" }, ...BATTERY_CATEGORIES.map((item) => ({ value: item, label: item }))]} />}
    <ChoiceSelect label="Battery brand" name="brand" defaultValue={brands.find((item) => normalize(item) === normalize(brand ?? "")) ?? ""}
      options={[{ value: "", label: "All brands" }, ...brands.map((item) => ({ value: item, label: item }))]} />
    <ChoiceSelect label="Capacity" name="capacity" defaultValue={capacity ? String(capacity) : ""}
      options={[{ value: "", label: "Any capacity" }, ...capacities.map((value) => ({ value: String(value), label: value + " Ah" }))]} />
    <ChoiceSelect label="Minimum warranty" name="warranty" defaultValue={warranty ? String(warranty) : ""}
      options={[{ value: "", label: "Any warranty" }, ...[12, 24, 36, 48, 60].map((value) => ({ value: String(value), label: value + " months" }))]} />
    <div className="filter-prices">
      <label>Min price (₹)<input className="store-input" type="number" name="min" min="0" max="9999999" step="0.01" defaultValue={minPrice} /></label>
      <label>Max price (₹)<input className="store-input" type="number" name="max" min="0" max="9999999" step="0.01" defaultValue={maxPrice} /></label>
    </div>
    <p className="field-hint">Filters use the price without exchange.</p>
    <label className="check-option"><input className="checkmark" type="checkbox" name="stock" value="1" defaultChecked={inStock} /> In stock only</label>
    <ChoiceSelect label="Sort by" name="sort" defaultValue={sort ?? ""} options={sorts} />
    <div className="filter-actions"><button className="shop-button primary">Apply filters</button><Link className="text-link" href={resetHref}>Reset</Link></div>
  </form>;

  return <>
    <div className="page-intro catalog-hero">
      <p className="eyebrow">{vehicleName ? "Verified vehicle selection" : "Battery catalog"}</p>
      <h1>{vehicleName ? "Batteries for " + vehicleName : category ? category + " batteries" : "Shop batteries"}</h1>
      <p className="muted">Prices include GST. Exchange prices apply after your old battery is checked at delivery.</p>
      {vehicleParam && <Link className="text-link" href={base}>Clear vehicle selection</Link>}
    </div>
    <details className="catalog-finder">
      <summary>{vehicle ? "Change vehicle" : "Find batteries by vehicle"}</summary>
      <VerifiedFinder key={vehicle?.id ?? category} vehicles={vehicles} brands={brands}
        initialType={category} initialVehicle={vehicle} selectedBrand={brand} />
    </details>
    <div className="catalog-layout">
      <aside className="catalog-filters-desktop" aria-label="Catalog filters"><h2>Search and filters</h2>{filters}</aside>
      <section aria-label={vehicle ? "Verified battery results" : "Battery results"}>
        <div className="catalog-toolbar">
          <p className="catalog-count">{visibleCount ? (page > 1 || rows.length > PAGE_SIZE ? "Showing " : "") + visibleCount + (visibleCount === 1 ? " battery" : " batteries") : "No results"}</p>
          <FilterDrawer count={filtersUsed}>{filters}</FilterDrawer>
        </div>
        {rows.length ? <div className="catalog-grid">{rows.slice(0, PAGE_SIZE).map((product) => <ProductCard key={product.id} product={product} />)}</div> :
          <div className="empty-catalog">
            <h2>{noFit ? "No verified fitment available" : "No batteries match these filters"}</h2>
            <p>{noFit ? "We don’t have a verified match for this vehicle. Our team can help with fitment." : "Try clearing a filter or searching for another model number."}</p>
            <div className="flex flex-wrap gap-2">
              <Link className="shop-button" href={noFit ? base : resetHref}>{noFit ? "Browse batteries" : "Clear filters"}</Link>
              {noFit && <Link className="shop-button primary" href="/contact">Get fitment help</Link>}
            </div>
          </div>}
        {(page > 1 || rows.length > PAGE_SIZE) && <nav className="catalog-pagination" aria-label="Catalog pages">
          {page > 1 && <Link className="icon-button" aria-label="Previous page" href={pageHref(page - 1)}><ChevronLeft size={20} aria-hidden="true" /></Link>}
          <span aria-current="page">Page {page}</span>
          {rows.length > PAGE_SIZE && page < 1000 && <Link className="icon-button" aria-label="Next page" href={pageHref(page + 1)}><ChevronRight size={20} aria-hidden="true" /></Link>}
        </nav>}
      </section>
    </div>
  </>;
}

export function CatalogPage({ searchParams, fixedCategory }: { searchParams: Promise<Query>; fixedCategory?: "Car" | "Bike" }) {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <Suspense fallback={<LoadingPanel label="Loading batteries…" cards />}><CatalogContent searchParams={searchParams} fixedCategory={fixedCategory} /></Suspense>
  </main><StorefrontFooter /></>;
}
