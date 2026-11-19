import Link from "next/link";
import { BatteryImage } from "@/components/products/battery-image";
import { StockStatus } from "@/components/design/commerce-ui";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const title = product.brand + " " + product.model;
  const specs = [product.capacityAh && product.capacityAh + " Ah",
    product.warrantyMonths && product.warrantyMonths + " mo warranty"].filter(Boolean).join(" · ");

  return <article className="catalog-card">
    <Link href={"/product/" + encodeURIComponent(product.slug)} className="catalog-card-link" aria-label={"View " + title}>
      <BatteryImage src={product.imageUrls?.[0]} alt="" />
      <div className="card-content">
        <div className="catalog-card-meta"><span className="brand-label">{product.brand}</span><StockStatus available={product.stock > 0} /></div>
        <h3>{product.model}</h3>
        <p className="catalog-specs">{specs || product.category + " battery"}</p>
        <dl className="catalog-prices">
          <div><dt>With exchange</dt><dd>{formatCurrency(product.withExchangePaise)}</dd></div>
          <div><dt>Without exchange</dt><dd>{formatCurrency(product.withoutExchangePaise)}</dd></div>
        </dl>
        <p className="catalog-mrp">MRP {formatCurrency(product.mrpPaise)}</p>
      </div>
    </Link>
  </article>;
}
