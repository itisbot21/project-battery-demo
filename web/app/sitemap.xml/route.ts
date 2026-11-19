import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { sellableProducts } from "@/lib/catalog";
import { publicOrigin } from "@/lib/public-origin";

export const dynamic = "force-dynamic";

const information = ["/", "/shop", "/car-batteries", "/bike-batteries", "/about", "/contact", "/delivery", "/faq", "/warranty", "/exchange", "/returns", "/privacy", "/terms"];

export async function GET() {
  try {
    const items = await db.select({ slug: products.slug }).from(products).where(sellableProducts).orderBy(asc(products.id)).limit(49000);
    const paths = information.concat(items.map(({ slug }) => "/product/" + encodeURIComponent(slug)));
    const entries = paths.map((path) => "<url><loc>" + new URL(path, publicOrigin()).href + "</loc></url>").join("");
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + "</urlset>", {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
    });
  } catch {
    return new Response("Sitemap temporarily unavailable.", { status: 503 });
  }
}
