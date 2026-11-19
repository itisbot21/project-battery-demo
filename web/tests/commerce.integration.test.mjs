import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";


const pgliteModule = process.env.BATTERY_PGLITE_MODULE;
const { PGlite } = await import(pgliteModule ? pathToFileURL(pgliteModule).href : "@electric-sql/pglite");
const pg = new PGlite();

globalThis.batteryTestAdmin = true;

const stubs = new Map([
  ["@/db", "export const db = globalThis.batteryTestDb;"],
  ["@/db/transaction", "export const transact = async (fn) => globalThis.batteryTestDb.transaction(fn);"],
  ["@/lib/require-admin", 'export async function requireAdmin() { if (!globalThis.batteryTestAdmin) throw new Error("Unauthorized"); return {user:{id:"test-admin"}}; }'],
  ["next/navigation", "export function redirect(path) { throw new Error(path); }"],
]);

registerHooks({
  resolve(specifier, context, next) {
    if (pgliteModule && specifier === "@electric-sql/pglite") return next(pathToFileURL(pgliteModule).href, context);
    const stub = stubs.get(specifier);
    if (stub) return { url: "data:text/javascript," + encodeURIComponent(stub), shortCircuit: true };
    if (specifier.startsWith("@/")) {
      return next(new URL("../" + specifier.slice(2) + ".ts", import.meta.url).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !specifier.endsWith(".ts")) {
      const candidate = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
});

const { drizzle } = await import("drizzle-orm/pglite");
globalThis.batteryTestDb = drizzle({ client: pg });

const { listCatalog, listVehicles } = await import("../lib/catalog.ts");
const { GET: checkPin } = await import("../app/api/serviceability/route.ts");
const { POST: placeOrder } = await import("../app/api/orders/route.ts");
const { POST: track } = await import("../app/api/order-tracking/route.ts");
const { manageOrder } = await import("../app/admin/orders/actions.ts");
const { parseProductDraft } = await import("../lib/admin-product-data.ts");
const { priceCart } = await import("../lib/cart-prices.ts");

const migrationDir = new URL("../drizzle/", import.meta.url);
const migrations = readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort();
const applyMigration = (name) => pg.exec(readFileSync(new URL(name, migrationDir), "utf8"));
const body = (fields) => new Request("http://localhost/api", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
});
const token = (value) => value.toString(16).padStart(64, "0");
const line = (productId, quantity = 1, exchange = "with", unitPricePaise = 80_000) => ({ productId, quantity, exchange, unitPricePaise });
const checkout = (key, items, pin = "400001") => placeOrder(body({
  token: key, items, paymentMethod: "cod", customer: { name: "Test Buyer", phone: "9876543210", address: "17 Test Road, Test Building", pin },
}));
const query = async (sql, params) => (await pg.query(sql, params)).rows;
const stock = async (id) => (await query("select stock from products where id = $1", [id]))[0].stock;
const admin = (id, fields) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ orderId: id, ...fields })) form.set(key, String(value));
  return manageOrder(form);
};
const adminSaved = (id, fields) => assert.rejects(admin(id, fields), { message: "/admin/orders/" + id + "?saved=1" });

before(async () => {
  for (const migration of migrations.slice(0, 5)) await applyMigration(migration);
  await pg.exec("insert into products (slug, brand, model, category, capacity_ah, warranty_months, mrp_paise, without_exchange_paise, with_exchange_paise, stock) values " +
    "('fit-car','Example','EX-1','Car',40,36,110000,100000,80000,3)," +
    "('other-car','Example','EX-12','Car',50,48,110000,100000,80000,5)," +
    "('legacy','Example','EX-99','Truck',90,60,110000,100000,80000,5)," +
    "('fit-bike','Battery Co','BK-1','Bike',7,24,110000,100000,80000,1)");
  await pg.exec("insert into vehicles (type, brand, model, variant) values " +
    "('Car','Hyundai','Creta','Petrol'),('Car','Hyundai','Creta','Diesel'),('Bike','Honda','Activa','125')");
  await pg.exec("insert into battery_compatibility (product_id, vehicle_id) values (1,1),(3,1),(4,1),(4,3)");
  await pg.exec("insert into delivery_pincodes (pin_code,city,active) values " +
    "('400001','Mumbai',true),('400601','Thane',true),('400703',' Navi  Mumbai ',true),('400003','Mumbai',false)");
  await pg.exec("insert into orders (customer_name,mobile,address,city,pin_code,payment_method,total_paise,balance_due_paise) " +
    "values ('Historical Buyer','9000000001','Old confirmed address','Mumbai','400001','cod',90000,90000)");
  await pg.exec("insert into order_items (order_id,product_id,product_brand,product_model,quantity,unit_price_paise,without_exchange_unit_price_paise,line_total_paise) " +
    "values (1,3,'Example','EX-99',1,90000,90000,90000)");
  for (const migration of migrations.slice(5)) await applyMigration(migration);
});

after(async () => { await pg.close(); });

test("migration preserves historical products, order items, advance defaults on existing orders and PIN codes", async () => {
  assert.deepEqual((await query("select category, stock from products where id = 3"))[0], { category: "Truck", stock: 5 });
  assert.deepEqual((await query("select total_paise, advance_percentage, final_total_paise from orders where id = 1"))[0],
    { total_paise: 90_000, advance_percentage: 20, final_total_paise: null });
  assert.equal((await query("select product_id from order_items where order_id=1"))[0].product_id, 3);
  assert.equal((await query("select count(*)::int as count from delivery_pincodes"))[0].count, 4);
});

test("fitment requires the exact vehicle mapping and category; model search prioritises an exact match", async () => {
  const diesel = (await listVehicles("Car")).find(({ variant }) => variant === "Diesel");
  assert.equal(diesel.model, "Creta");
  assert.deepEqual((await listCatalog({ vehicleId: 1 })).map(({ id }) => id), [1]);
  assert.deepEqual(await listCatalog({ vehicleId: diesel.id }), []);
  assert.deepEqual((await listCatalog({ vehicleId: 3 })).map(({ id }) => id), [4]);
  assert.deepEqual((await listCatalog({ search: " EX-1 " })).map(({ model }) => model), ["EX-1", "EX-12"]);
  assert.deepEqual((await listCatalog({ brand: " battery co ", minPrice: 90_000, warranty: 24, capacity: 7 }))
    .map(({ id }) => id), [4]);
});

test("live cart pricing combines stock across exchange choices and shows the maximum COD total", async () => {
  const catalog = await listCatalog();
  const cart = priceCart([line(1, 2), line(1, 1, "without", 100_000)], catalog);
  assert.equal(cart.totalPaise, 260_000);
  assert.equal(cart.maximumPaise, 300_000);
  assert.equal(cart.valid, true);
  assert.equal(priceCart([line(1, 3), line(1, 1, "without", 100_000)], catalog).valid, false);
});

test("PIN checks and order creation reject inactive or outside-area PINs and forbidden products or quotes", async () => {
  for (const [pin, city] of [["400001", "Mumbai"], ["400703", "Navi Mumbai"], ["400601", null], ["400003", null]]) {
    const result = await checkPin(new Request("http://localhost/api/serviceability?pin=" + pin));
    assert.deepEqual(await result.json(), { serviceable: Boolean(city), city });
  }
  assert.equal((await checkout(token(2), [line(1)], "400601")).status, 400);
  assert.equal((await checkout(token(3), [line(3)])).status, 409);
  const invalidQuote = await checkout(token(4), [line(1, 1, "with", 1)]);
  assert.equal(invalidQuote.status, 409);
  assert.equal((await invalidQuote.json()).code, "PRICE_CHANGED");
  assert.equal(await stock(1), 3);
});

test("COD checkout accepts a duplicate only once and guest recovery requires the private token", async () => {
  const key = token(5);
  const responses = await Promise.all([checkout(key, [line(1, 2)]), checkout(key, [line(1, 2)])]);
  assert.deepEqual(responses.map(({ status }) => status).sort(), [200, 201]);
  const saved = await Promise.all(responses.map((result) => result.json()));
  assert.equal(saved[0].orderId, saved[1].orderId);
  assert.equal(await stock(1), 1);
  assert.equal((await checkout(key, [line(1, 1)])).status, 409);
  assert.equal((await track(body({ orderId: saved[0].orderId }))).status, 400);
  assert.equal((await track(body({ token: token(100) }))).status, 404);
  const guest = await (await track(body({ token: key }))).json();
  assert.equal(guest.items[0].quantity, 2);
  assert.equal(guest.totalPaise, 160_000);
  assert.equal("customerName" in guest || "mobile" in guest || "address" in guest, false);
  const recovered = await (await track(body({ token: key, confirmationOnly: true }))).json();
  assert.deepEqual(recovered.purchased, [{ productId: 1, quantity: 2, exchange: "with" }]);
});

test("multiple checkouts cannot reserve more units than available in the test database", async () => {
  const results = await Promise.all([checkout(token(6), [line(4)]), checkout(token(7), [line(4)])]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [201, 409]);
  assert.equal(await stock(4), 0);
});

test("mixed exchange settlement preserves original amounts and blocks stale cash or status changes", async () => {
  const guest = await (await track(body({ token: token(5) }))).json();
  const id = guest.id;
  const itemId = guest.items[0].id;
  globalThis.batteryTestAdmin = false;
  try { await assert.rejects(admin(id, { operation: "note", reason: "blocked" }), { message: "Unauthorized" }); }
  finally { globalThis.batteryTestAdmin = true; }
  await assert.rejects(admin(id, { operation: "status", status: "delivered" }), /\?error=/);
  for (const status of ["confirmed", "preparing", "out_for_delivery"]) await adminSaved(id, { operation: "status", status });
  await assert.rejects(admin(id, { operation: "cash", amount: "1600", expectedPaidPaise: 0 }), /\?error=/);
  await adminSaved(id, { operation: "exchange", itemId, approved: 1, reason: "One old battery unavailable" });
  await assert.rejects(admin(id, { operation: "exchange", itemId, approved: 0, reason: "Duplicate" }), /\?error=/);
  await adminSaved(id, { operation: "cash", amount: "1800", expectedPaidPaise: 0, reason: "Cash received" });
  await assert.rejects(admin(id, { operation: "cash", amount: "1800", expectedPaidPaise: 0 }), /\?error=/);
  await adminSaved(id, { operation: "status", status: "delivered" });
  await adminSaved(id, { operation: "status", status: "completed" });
  const settled = await (await track(body({ token: token(5) }))).json();
  assert.equal(settled.status, "completed");
  assert.equal(settled.paid, 180_000);
  assert.equal(settled.balance, 0);
  assert.equal(settled.totalPaise, 160_000);
  assert.equal(settled.finalTotalPaise, 180_000);
  assert.equal(settled.items[0].originalPaise, 160_000);
  assert.equal(settled.items[0].finalPaise, 180_000);
  assert.equal(settled.items[0].exchange, "partial");
  assert.equal((await query("select count(*)::int as count from order_events where order_id=$1 and kind in ('exchange','cash')", [id]))[0].count, 2);
  assert.equal((await query("select count(*)::int as count from notification_outbox where status <> 'awaiting_provider'"))[0].count, 0);
});

test("failed deliveries can be cancelled with an auditable, one-time stock restoration", async () => {
  const response = await checkout(token(8), [line(2, 1, "without", 100_000)]);
  assert.equal(response.status, 201);
  const { orderId } = await response.json();
  for (const status of ["confirmed", "preparing", "out_for_delivery"]) await adminSaved(orderId, { operation: "status", status });
  await adminSaved(orderId, { operation: "status", status: "failed_delivery", reason: "Customer unavailable" });
  assert.equal(await stock(2), 4);
  const cancellation = { operation: "status", status: "cancelled", reason: "Cancelled by customer" };
  await adminSaved(orderId, cancellation);
  await assert.rejects(admin(orderId, cancellation), /\?error=/);
  assert.equal(await stock(2), 5);
  assert.equal((await query("select balance_due_paise from orders where id=$1", [orderId]))[0].balance_due_paise, 0);
});

test("product forms accept existing photos and preserve submitted details independently of blob setup", () => {
  const form = new FormData();
  const oldImage = "http://legacy.example.test/battery.png";
  for (const [key, value] of Object.entries({
    brand: "Example", model: "EX-1", category: "Car", stock: "3", mrp: "1100",
    withExchange: "800", withoutExchange: "1000", capacity: "40", warranty: "36",
    warrantyFree: "18", warrantyProRata: "18", description: "Detailed description",
    specifications: "Terminal: left", features: "Sealed case",
    imageUrls: JSON.stringify([oldImage, "https://images.example.test/battery.png"]), seoTitle: "Example battery",
  })) form.set(key, value);
  const parsed = parseProductDraft(form, "Car", [oldImage]);
  assert.deepEqual(parsed?.draft.imageUrls, [oldImage, "https://images.example.test/battery.png"]);
  assert.equal(parsed?.draft.description, "Detailed description");
  assert.deepEqual(parsed?.draft.specifications, { Terminal: "left" });
  assert.equal(parsed?.draft.warrantyProRataMonths, 18);
});
