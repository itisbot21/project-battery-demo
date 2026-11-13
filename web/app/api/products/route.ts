
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.active, true));

    return Response.json(result);
  } catch (error) {
    console.error("Database query failed:", error);

    return Response.json(
      { error: "Unable to load products" },
      { status: 500 }
    );
  }
}
