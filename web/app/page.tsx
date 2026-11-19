import { cache, Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Bike, CarFront, ChevronRight, MapPin } from "lucide-react";
import { VerifiedFinder } from "@/components/battery-finder/verified-finder";
import { LoadingPanel } from "@/components/design/commerce-ui";
import { PinChecker } from "@/components/layout/pin-checker";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { ProductCard } from "@/components/products/product-card";
import { listBrands, listCatalog, listVehicles } from "@/lib/catalog";
import { manufacturerSlug } from "@/lib/store-policy";

const homeVehicles = cache(() => listVehicles());
const homeBrands = cache(listBrands);

async function HomeFinder() {
  await connection();
  const [vehicles, brands] = await Promise.all([homeVehicles(), homeBrands()]);
  return <VerifiedFinder vehicles={vehicles} brands={brands} />;
}

async function HomeCatalog() {
  await connection();
  const [vehicles, brands, products] = await Promise.all([homeVehicles(), homeBrands(), listCatalog({ inStock: true }, 4)]);
  const makes = [...new Map(vehicles.map((vehicle) => [vehicle.type + ":" + manufacturerSlug(vehicle.brand), vehicle])).values()];

  return <>
    {(makes.length > 0 || brands.length > 0) && <div className="store-container store-section home-discovery">
      {makes.length > 0 && <section className="discovery-panel" id="manufacturers">
        <h2>Browse by vehicle make</h2>
        <div className="make-groups">{(["Car", "Bike"] as const).map((category) => {
          const group = makes.filter((make) => make.type === category);
          return group.length ? <div key={category}>
            <h3>{category === "Car" ? "Cars" : "Bikes"}</h3>
            <div className="store-chips">{group.map((make) => {
              const slug = manufacturerSlug(make.brand);
              return <Link key={slug} href={"/" + category.toLowerCase() + "-batteries/" + slug}>{make.brand}</Link>;
            })}</div>
          </div> : null;
        })}</div>
      </section>}
      {brands.length > 0 && <section className="discovery-panel">
        <h2>Battery brands</h2>
        <div className="store-chips">{brands.map((brand) => <Link key={brand} href={"/shop?brand=" + encodeURIComponent(brand)}>{brand}</Link>)}</div>
      </section>}
    </div>}
    <section className="store-container store-section" id="products">
      <div className="section-heading"><h2>Available batteries</h2><Link className="text-link" href="/shop">View all batteries</Link></div>
      {products.length ? <div className="catalog-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        : <div className="empty-catalog"><p>Online stock is currently unavailable.</p><Link href="/contact" className="text-link">Ask about availability</Link></div>}
    </section>
  </>;
}

export default function Home() {
  return <>
    <StorefrontNav />
    <main id="main-content" tabIndex={-1}>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="store-container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow hero-location"><MapPin size={15} aria-hidden="true" /> Mumbai & Navi Mumbai</p>
            <h1 id="home-title">Car &amp; bike batteries. <em>Fitted at your door.</em></h1>
            <p>Find a verified fit, compare prices with and without exchange, and pay after installation.</p>
            <div className="hero-actions">
              <a className="shop-button primary" href="#battery-finder">Find my battery</a>
              <Link className="shop-button" href="/shop">Browse batteries</Link>
            </div>
          </div>
          <div className="energy-board" aria-hidden="true">
            <i className="energy-trace energy-trace-one" /><i className="energy-trace energy-trace-two" />
            <div className="energy-terminal energy-positive"><span>+</span></div>
            <div className="energy-terminal energy-negative"><span>−</span></div>
            <i className="energy-junction" />
          </div>
        </div>
      </section>
      <div className="store-container home-finder">
        <Suspense fallback={<div id="battery-finder"><LoadingPanel label="Loading vehicle options…" /></div>}><HomeFinder /></Suspense>
      </div>
      <section className="store-container store-section home-paths" aria-label="Shop by vehicle type">
        <Link className="category-path" href="/car-batteries">
          <span className="path-icon"><CarFront size={24} aria-hidden="true" /></span>
          <div><strong>Car batteries</strong><small>Explore by make or model</small></div><ChevronRight size={20} aria-hidden="true" />
        </Link>
        <Link className="category-path" href="/bike-batteries">
          <span className="path-icon"><Bike size={24} aria-hidden="true" /></span>
          <div><strong>Bike batteries</strong><small>Explore by make or model</small></div><ChevronRight size={20} aria-hidden="true" />
        </Link>
      </section>
      <Suspense fallback={<div className="store-container store-section"><LoadingPanel label="Loading the catalog…" cards /></div>}><HomeCatalog /></Suspense>
      <div className="store-container store-section home-service">
        <section className="home-coverage" id="delivery">
          <p className="eyebrow">Mumbai & Navi Mumbai</p>
          <h2>Check delivery at your address</h2>
          <p className="muted">Delivery and installation are free for eligible PIN codes.</p>
          <PinChecker />
        </section>
        <section className="home-order">
          <h2>From order to installation</h2>
          <ol>
            <li><span aria-hidden="true">1</span> Choose your battery and place a cash-on-delivery order.</li>
            <li><span aria-hidden="true">2</span> Our team calls to confirm your delivery timing.</li>
            <li><span aria-hidden="true">3</span> We install the battery and check any exchange before you pay.</li>
          </ol>
          <Link className="text-link" href="/exchange">How old battery exchange works</Link>
        </section>
      </div>
    </main>
    <StorefrontFooter />
  </>;
}
