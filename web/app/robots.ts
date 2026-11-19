import type { MetadataRoute } from "next";
import { publicOrigin } from "@/lib/public-origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/cart", "/checkout", "/order-confirmation", "/track-order"] },
    sitemap: new URL("/sitemap.xml", publicOrigin()).href,
  };
}
