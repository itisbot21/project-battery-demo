import { and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { sellableProducts } from "@/lib/catalog";
import { positiveId } from "@/lib/store-policy";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids");
  const requested = ids?.split(",").map(positiveId);
  if (requested && (requested.length > 20 || requested.some((id) => id === undefined))) {
    return Response.json({ error: "Invalid battery selection." }, { status: 400 });
  }

  try {
    const result = await db.select().from(products).where(and(sellableProducts,
      requested ? inArray(products.id, requested.flatMap((id) => id ?? [])) : undefined));
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load products." }, { status: 503 });
  }
}
