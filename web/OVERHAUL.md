# Project Battery overhaul

## A. Repository baseline

The local Next.js 16 App Router checkout is the implementation source. It already contains Better Auth with email-based administration and optional Google sign-in, Drizzle migrations 0000–0004, a product detail route, editable product content and compatibility assignments, a guest cart, COD order creation, and a PIN allowlist. Existing checkout uses server prices, transactional writes and conditional inventory decrements. Product detail and vehicle admin code were already present as unfinished local changes.

- Public routes at baseline were home, about, cart, checkout, product detail and car/bike manufacturer pages. APIs served products, PIN checks, orders, auth and admin image uploads. Admin pages covered inventory, vehicle data, PINs and orders.
- The homepage finder used demo data and category-only matching. Manufacturer routes also used a static list. The public catalog API and order endpoint did not consistently enforce the car/bike policy.
- Buy Now added items to the ordinary cart. Checkout could accept a changed price without a new confirmation, and its browser submit lock could not make retries idempotent. There was no guest tracking credential.
- The delivery allowlist accepted free-form city names. Admin could move orders through a short lifecycle and record cash, but rejected exchanges overwrote original amounts, and there was no cancellation stock-restoration or durable audit history.
- The original build failed because the product-image route specified a runtime while Cache Components was enabled. The initial lint reported a navigation effect error and a navigation warning. The first standalone type check overlapped route-type generation. The baseline had no application tests. npm identified security advisories in the original dependency graph.
- The local safety branch is codex/project-battery-overhaul. The existing working tree, including unfinished product and vehicle admin routes, formed the baseline. The sibling archive is outside the web project.
- Competitor research informed the use of compact linked category paths, a dependent finder, and direct battery-model search. [BatteryMall](https://batterymall.in/) · [BatteryBoss](https://www.batteryboss.in/) · [BatteryFix](https://batteryfix.in/) · [BatteryBhai](https://www.batterybhai.com/)

## Data and rollout

Discovery queries use the existing vehicle and compatibility tables. Checkout and operations need additive columns for order identity, current settlement amounts, per-line exchange quantities and inventory restoration, plus an order event log and notification outbox. Existing orders and product/PIN records require no deletion. Production use of the new order code depends on applying the generated migration after review and testing against a safe database. Production migration and deployment await approval.


## B. Discovery

- `app/page.tsx`, `app/shop`, `app/car-batteries`, `app/bike-batteries`, `components/battery-finder/verified-finder.tsx`, `components/shop` and `lib/catalog.ts` use database vehicles and exact vehicle IDs. Catalog queries join stored compatibility and enforce the product/vehicle category boundary. Missing assignments show an honest empty state.
- Catalog URLs carry search, vehicle, brand, capacity, warranty, price, availability, sort and pagination state. Manufacturer links still resolve and the pages display stored models and variants. Search prioritises an exact model number.
- `app/api/products`, `app/api/serviceability`, `lib/serviceability.ts` and `lib/store-policy.ts` enforce the public category and territory rules. Review any historical PIN records with nonstandard city labels in Admin before relying on them.

## C. Purchase

- `app/product` and `components/products` show stored photos, warranty, specs and fitment with a consistent unavailable-photo state. Alternatives share an explicitly verified vehicle mapping.
- `app/cart`, `app/checkout`, `components/checkout` and `lib/cart*` refresh selected item prices and stock. Buy Now uses a single-item, tab-local checkout. COD retry recovery uses a cryptographically generated token in session storage.
- `app/api/orders` locks the checked PIN and the selected inventory rows, validates the quoted selling price per line, and writes stock, order, lines and the initial event in one transaction. The idempotency lock and unique token hash make retries return the same order. The order keeps original totals and a separate current payable amount.

## D. Operations

- `app/admin` adds an order-focused overview, an inventory directory, order search and detail, and public support settings. The existing Better Auth gate protects pages and actions. The product editor keeps its existing image references and supports secure image URLs. It also guards stock edits against a stale inventory quantity. Vehicle edit and delete hold a lock while checking stored assignments.
- `app/admin/orders`, `lib/order-policy.ts` and `lib/order-events.ts` handle delivery confirmation, preparation, dispatch, failed attempts, completion, notes, per-unit exchange acceptance, cash settlement and one-time stock restoration on eligible cancellation.
- `app/api/order-tracking`, `app/track-order` and `app/order-confirmation` use a private bearer link and display order progress and settlement. Only the token hash is stored in PostgreSQL. Historical orders have no tracking credential. Historical totals that the old implementation overwrote cannot be reconstructed from the current schema.
- `drizzle/0005_order_operations.sql` and its snapshot extend the existing schema. They add nullable fields for operational state, an event log, an idempotent notification outbox and support settings. The default advance for new orders becomes zero. No historic field or row is rewritten. Any legacy order already carrying a cancellation status remains terminal.
- WhatsApp and SMS events are durable and marked awaiting provider setup. Provider credentials and a dispatcher with controlled retry and delivery receipts are still required. R2 and online payment remain inactive. Existing Vercel Blob uploads appear only when the existing provider is configured.

## E. Storefront, information and build

- `app/storefront.css` provides shared responsive styling, keyboard focus and reduced motion. The navigation, homepage, footer, product pages, cart and checkout share those styles. The admin workflows use the same form and panel styles where appropriate.
- Public pages cover support, delivery, exchange, warranty, returns, cancellation, FAQs, privacy and ordering terms. Supply the official support details and have the business review publication of its legal and returns information. Set `NEXT_PUBLIC_SITE_URL` to the intended canonical origin before changing hostnames.
- Turbopack’s CSS worker failed on this Windows checkout. The npm build and dev scripts use Webpack with Tailwind PostCSS. Disabling Cache Components and partial prefetching allows product existence to resolve before the page starts streaming and gives stale URLs a normal 404.

## F. Verification and rollout

- Run the automated commerce suite with `npm.cmd test` on Node.js 24. It runs against an in-memory PostgreSQL-compatible engine and synthetic records. They apply the complete migration sequence and exercise real catalog, PIN, checkout, tracking, admin order and product validation code. The test driver serialises database transactions, so a staging run with multiple Neon connections is still needed to measure actual lock contention.
- Apply migration 0005 to a backed-up staging database first. Rehearse guest COD, refund-free cancellation, a partially accepted exchange, cash settlement and product edits with a staging admin. Verify the production database’s migration journal before approval to apply 0005 there.

- The production build, TypeScript, ESLint and Drizzle migration history checks passed. All nine commerce integration scenarios passed on the final dependency set.
- Chrome verified the storefront at widths of 390, 768 and 1440 pixels. The fixture run covered exact and unmapped vehicle variants, supported and unsupported PINs, direct product links, Buy Now isolation and refresh, runtime sitemap data, invalid product HTTP 404 and guest redirection away from Admin.
- The configured store database returned no usable car or bike vehicle records and displayed a listing that appears to be test data. The browser scenarios with fitment used isolated rows. Review actual catalog and verified fitment data in Admin before launch.
- Next.js was patched to 16.4.6 and the optional Blob SDK’s transitive validation dependency was patched. The follow-up npm audit reported zero high or critical advisories and ten moderate advisories in the remaining dependency graph.

