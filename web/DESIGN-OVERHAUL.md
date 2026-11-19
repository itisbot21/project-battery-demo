# Project Battery design overhaul

## Design decisions

- The Wollo screenshots informed the balance of white space, contrast and a few expressive accents. Project Battery uses its own wordmark and an electrical-terminal illustration made with CSS.
- Geist provides the storefront and admin typography. Geist Mono is reserved for small operational readings and labels. [Geist type specimens](https://vercel.com/font)
- White and neutral surfaces carry the shopping task. Violet identifies primary actions and selected controls. Pink and yellow are reserved for brand graphics and wayfinding. Inventory and validation status use their own semantic colours.
- Searchable comboboxes handle longer vehicle lists. Short lists use styled select menus. Native radios, checkboxes and inputs retain semantics and autofill. The mobile catalog keeps the existing GET query contract in a filter drawer. Price filters use exact minimum and maximum fields.
- Product imagery comes from the existing catalog. A neutral, labelled fallback covers missing or unavailable images.

## Implementation

| Area | Main files |
| --- | --- |
| Typography and system styling | `app/layout.tsx`, `app/globals.css`, `app/storefront.css`, `app/design-controls.css`, `app/admin-design.css` |
| Shared controls | `components/design/` for brand, selects, comboboxes, dialogs, quantity steppers, status, notices, loading states and submit buttons |
| Storefront | `app/page.tsx`, `components/layout/`, `components/battery-finder/verified-finder.tsx`, `components/shop/`, `components/products/` and the product detail page |
| Checkout and customer care | `app/cart/`, `app/checkout/`, `components/checkout/`, `app/track-order/`, `app/[information]/page.tsx` and `lib/cart.ts` |
| Operations | `app/admin/` and `components/admin/` for navigation, responsive tables, product and vehicle editors, PIN management, order detail, settlement controls and settings |

The cart count subscribes to local cart changes. A cart line can switch exchange options and merges with a matching line within the existing quantity limit. Buy Now continues to use its own tab-local selection. The storefront APIs, database schema, migrations, payment rules, authentication and order transactions match the pre-design checkpoint.

The working branch is `codex/project-battery-overhaul`. The local pre-design snapshot is `codex/project-battery-before-design` at `2891117`. The snapshot includes earlier uncommitted work. The original staging area and active branch were left intact.

## Verification

- `npm.cmd run lint`, `npx.cmd tsc --noEmit` and `npm.cmd run build` passed. The nine existing commerce integration tests passed, including fitment, serviceability, protected pricing, idempotency, inventory reservations, exchange settlement and cancellation.
- Chrome verified home, catalog, product details and admin sign-in at 360, 390, 768, 1024 and 1440 px. Screenshots were inspected at 390, 768 and 1440 px.
- Browser interactions covered keyboard focus, mobile navigation, dependent vehicle selection, exact fitment and empty results, URL-based filter submission, image enlargement, out-of-stock and empty cart states, quantity and exchange changes, cart count, Buy Now isolation through refresh, both PIN outcomes, checkout confirmation and private tracking. The support and policy routes were also opened.
- An isolated admin account exercised real sign-in, the overview, inventory table, product editor, vehicles, order list and detail at 360 and 1440 px. Additional checks covered the cancellation dialog, PIN form submission and settings.
- Browser verification used an in-memory database with synthetic records. The browser confirmation used a simulated COD response. The existing integration tests exercised order creation and settlement. Google OAuth and live Blob uploads were outside the isolated browser check.

The design work stayed local. Production migration 0005 is still pending approval.

