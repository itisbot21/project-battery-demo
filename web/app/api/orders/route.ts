
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, eq, gte, inArray, sql } from "drizzle-orm";

import {
  products,
  deliveryPincodes,
  orders,
  orderItems,
} from "@/db/schema";

type CartItem = {
  productId: number;
  exchange: "with" | "without";
  quantity: number;
};

type Customer = {
  name: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
};

class OrderError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  let body: {
    customer?: Customer;
    items?: CartItem[];
    paymentMethod?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const customer = body?.customer;
  const items = body?.items;

  if (!customer || typeof customer !== "object") {
    return Response.json(
      { error: "Customer details are required." },
      { status: 400 }
    );
  }

  const name =
    typeof customer.name === "string"
      ? customer.name.trim()
      : "";

  const phone =
    typeof customer.phone === "string"
      ? customer.phone.trim()
      : "";

  const address =
    typeof customer.address === "string"
      ? customer.address.trim()
      : "";

  const city =
    typeof customer.city === "string"
      ? customer.city.trim()
      : "";

  const pin =
    typeof customer.pin === "string"
      ? customer.pin.trim()
      : "";

  if (
    name.length < 2 ||
    name.length > 100 ||
    !/^[6-9]\d{9}$/.test(phone) ||
    address.length < 8 ||
    address.length > 500 ||
    city.length < 2 ||
    city.length > 100 ||
    !/^\d{6}$/.test(pin)
  ) {
    return Response.json(
      { error: "Check your customer and delivery details." },
      { status: 400 }
    );
  }

  // Only COD is active until a payment gateway is integrated.
  if (body.paymentMethod !== "cod") {
    return Response.json(
      { error: "Only Cash on Delivery is available currently." },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 20
  ) {
    return Response.json(
      { error: "Invalid shopping cart." },
      { status: 400 }
    );
  }

  const grouped = new Map<string, CartItem>();

  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(item.productId) ||
      item.productId <= 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10 ||
      !["with", "without"].includes(item.exchange)
    ) {
      return Response.json(
        { error: "Invalid cart item." },
        { status: 400 }
      );
    }

    const key = `${item.productId}:${item.exchange}`;
    const existing = grouped.get(key);

    grouped.set(key, {
      productId: item.productId,
      exchange: item.exchange,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  const cleanItems = [...grouped.values()];
  const totalQuantity = cleanItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (
    cleanItems.some((item) => item.quantity > 10) ||
    totalQuantity > 30
  ) {
    return Response.json(
      { error: "Cart quantity limit exceeded." },
      { status: 400 }
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return Response.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  const database = drizzle({ client: pool });

  try {
    const result = await database.transaction(async (tx) => {
      // Verify delivery area on the server.
      const [deliveryArea] = await tx
        .select()
        .from(deliveryPincodes)
        .where(
          and(
            eq(deliveryPincodes.pinCode, pin),
            eq(deliveryPincodes.active, true)
          )
        )
        .limit(1);

      if (!deliveryArea) {
        throw new OrderError(
          "Delivery is unavailable for this PIN code."
        );
      }

      const productIds = [
        ...new Set(cleanItems.map((item) => item.productId)),
      ];

      const availableProducts = await tx
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, productIds),
            eq(products.active, true)
          )
        );

      const productMap = new Map(
        availableProducts.map((product) => [
          product.id,
          product,
        ])
      );

      let totalPaise = 0;

      const savedItems = cleanItems.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new OrderError(
            "A battery in your cart is unavailable.",
            409
          );
        }

        const price =
          item.exchange === "with"
            ? product.withExchangePaise
            : product.withoutExchangePaise;

        if (
          !Number.isSafeInteger(price) ||
          price < 0 ||
          product.withoutExchangePaise <
            product.withExchangePaise
        ) {
          throw new OrderError(
            "A product has invalid pricing.",
            409
          );
        }

        const lineTotalPaise = price * item.quantity;
        totalPaise += lineTotalPaise;

        return {
          productId: product.id,
          productBrand: product.brand,
          productModel: product.model,
          quantity: item.quantity,
          exchangeSelected: item.exchange === "with",
          exchangeStatus:
            item.exchange === "with"
              ? "pending"
              : "not_applicable",
          unitPricePaise: price,
          withoutExchangeUnitPricePaise:
            product.withoutExchangePaise,
          lineTotalPaise,
        };
      });

      if (
        totalPaise <= 0 ||
        totalPaise > 2_000_000_000
      ) {
        throw new OrderError(
          "Order total is invalid.",
          400
        );
      }

      // Reserve inventory atomically.
      const quantities = new Map<number, number>();

      for (const item of cleanItems) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) +
            item.quantity
        );
      }

      for (const productId of [...quantities.keys()].sort(
        (a, b) => a - b
      )) {
        const quantity = quantities.get(productId)!;

        const updated = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${quantity}`,
          })
          .where(
            and(
              eq(products.id, productId),
              eq(products.active, true),
              gte(products.stock, quantity)
            )
          )
          .returning({ id: products.id });

        if (updated.length === 0) {
          throw new OrderError(
            "Insufficient battery stock. Please update your cart.",
            409
          );
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          customerName: name,
          mobile: phone,
          address,
          city: deliveryArea.city,
          pinCode: pin,

          paymentMethod: "cod",
          paymentStatus: "pending",
          orderStatus: "pending",

          totalPaise,
          advancePercentage: 20,
          amountDueNowPaise: 0,
          paidPaise: 0,
          balanceDuePaise: totalPaise,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        savedItems.map((item) => ({
          ...item,
          orderId: order.id,
        }))
      );

      return {
        orderId: order.id,
        totalPaise,
      };
    });

    return Response.json(
      {
        success: true,
        orderId: result.orderId,
        totalPaise: result.totalPaise,
        message: "Order placed successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Order creation failed:", error);

    return Response.json(
      { error: "Unable to place order. Please try again." },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
