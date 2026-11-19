import Link from "next/link";
import { Bike, CarFront, ChevronRight } from "lucide-react";
import type { CatalogVehicle } from "@/lib/catalog";
import { manufacturerSlug, normalize } from "@/lib/store-policy";

const groups = [
  { type: "Car", title: "Car manufacturers", href: "/car-batteries", Icon: CarFront },
  { type: "Bike", title: "Bike manufacturers", href: "/bike-batteries", Icon: Bike },
] as const;

export function ManufacturerSection({ vehicles }: { vehicles: CatalogVehicle[] }) {
  return (
    <section className="store-container store-section home-discovery" aria-labelledby="manufacturers">
      <div className="section-heading">
        <div><h2 id="manufacturers">Shop by vehicle manufacturer</h2>
          <p className="muted">Choose a make, then select your exact model and variant to check fit.</p></div>
      </div>
      <div className="make-groups">
        {groups.map(({ type, title, href, Icon }) => {
          const makes = new Map<string, string>();
          for (const vehicle of vehicles) {
            if (vehicle.type !== type) continue;
            const slug = manufacturerSlug(vehicle.brand);
            if (slug && !makes.has(slug)) makes.set(slug, vehicle.brand.trim());
          }
          return (
            <div className="make-group" key={type}>
              <h3><span className="discovery-icon"><Icon size={19} aria-hidden="true" /></span>{title}</h3>
              {makes.size ? (
                <ul className="make-grid">
                  {[...makes].map(([slug, name]) => (
                    <li key={slug}><Link className="make-tile" href={href + "/" + slug}>
                      <span>{name}</span><ChevronRight size={16} aria-hidden="true" />
                    </Link></li>
                  ))}
                </ul>
              ) : (
                <div className="discovery-empty">
                  <p>Verified {normalize(type)} models aren’t listed yet.</p>
                  <Link className="text-link" href={href}>Browse {normalize(type)} batteries</Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
