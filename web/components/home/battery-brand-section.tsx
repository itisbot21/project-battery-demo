import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BatteryBrandMark } from "./battery-brand-mark";

const logos = new Map([
  ["amaron", "/images/battery-brands/amaron.jpg"],
  ["exide", "/images/battery-brands/exide.jpeg"],
  ["powerzone", "/images/battery-brands/powerzone.jpg"],
  ["sfsonic", "/images/battery-brands/sf-sonic.jpg"],
]);

export function BatteryBrandSection({ brands }: { brands: string[] }) {
  return (
    <section className="store-container store-section home-discovery" aria-labelledby="battery-brands">
      <div className="section-heading">
        <div><h2 id="battery-brands">Shop by battery brand</h2>
          <p className="muted">See which brands have batteries in stock today.</p></div>
      </div>
      {brands.length ? (
        <ul className="battery-brand-grid">
          {brands.map((brand) => (
            <li key={brand}>
              <Link className="battery-brand-tile" href={"/shop?" + new URLSearchParams({ brand, stock: "1" })}>
                <BatteryBrandMark brand={brand} logo={logos.get(brand.toLowerCase().replace(/[^a-z0-9]/g, ""))} />
                <span className="battery-brand-name">{brand}<ArrowUpRight size={16} aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="discovery-empty">
          <p>There are no battery brands in stock online right now.</p>
          <Link className="text-link" href="/contact">Ask about availability</Link>
        </div>
      )}
    </section>
  );
}
