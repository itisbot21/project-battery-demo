# Project Battery post-overhaul audit

## Guest cash-on-delivery abuse prevention

`POST /api/orders` reserves stock when it accepts an order. The endpoint validates buyer details, delivery PIN, cart limits, product availability and quoted prices. The transaction locks the stock being reserved. A repeat submission with the same checkout token replays the existing order. Confirmed abuse can be handled through the existing order management flow, with auditable cancellation and stock restoration. Fresh tokens can still create separate reservations, so protect the endpoint at the hosting layer before launch.

1. In the production project's Firewall, scope a rule to the exact path `/api/orders` and the `POST` method. Use the provider's shared rate counter and client IP identity. Start with a 60-second fixed window and 10 requests per IP as a threshold to evaluate in Log mode. Keep the storefront, delivery PIN checks and private order recovery outside this rule. [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules) · [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
2. Observe normal traffic and test retries from a shared connection before enforcing. Confirm that repeated submissions on the same checkout recover safely and that another customer on that connection can still place a legitimate order. Tune the threshold using the observed traffic, then use HTTP 429 for requests exceeding it. The checkout preserves its retry token when the edge returns 429. Verify quota and billing in the hosting project before enabling a metered rule. [Vercel WAF usage and pricing](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing)
3. Monitor bursts of accepted orders, repeated stock conflicts and rate-limit hits. Use aggregate counts and existing order references for investigation. Keep customer details and checkout or tracking tokens out of firewall or application logs. Review repeated holds on a SKU or multiple orders to the same delivery contact through the admin workflow. Confirm delivery with the customer before dispatch and cancel confirmed abuse through the existing stock-release workflow.
4. If abuse persists across many sources, evaluate a targeted storefront challenge before the checkout submission or a shared reservation limit tied to a reviewed signal. Measure failed legitimate submissions before expanding either control. Guest checkout remains available without an account or a universal challenge.

Hosting rule rollout is pending. Production records and migration `0005` were outside the scope of the audit.

## Verification

- `npm.cmd test` passed all 10 integration tests, including the new interrupted Buy Now regression. It used in-memory PGlite for the stock, idempotency and private recovery endpoints.
- `npm.cmd run lint`, `tsc.cmd --noEmit`, `npm.cmd run build` and `git diff --check` passed. The final production build also ran TypeScript.
- Headless Chrome rendered the production build at 360, 390, 768 and 1440 px. The checks covered populated discovery sections, absent vehicles, absent active brands, manufacturer and brand links, the exact Petrol fitment and unmatched Diesel variant, four loaded brand images, fallback text, keyboard focus and horizontal overflow.
- Browser checkout checks used local catalog and PIN data with simulated order responses. They verified an interrupted Buy Now, switching batteries, checking an earlier order again, private recovery, normal cart checkout and a 429 retry with the same token. No remaining verification failures were observed.

The audit is uncommitted on local `main`, whose upstream is `myvercel/main`. There was no push or deployment.

## Files changed

All paths below are relative to the storefront directory.

### Homepage discovery

- `app/page.tsx`
- `app/storefront.css`
- `components/home/battery-brand-mark.tsx` (new)
- `components/home/battery-brand-section.tsx`
- `components/home/manufacturer-section.tsx`
- `lib/catalog.ts`

Manufacturer tiles use text because the repository has no approved manufacturer artwork. Battery-brand tiles use the four existing branded product images and show initials for other brands or if an image fails.

### Buy Now and order recovery

- `app/checkout/page.tsx`
- `components/checkout/checkout.tsx`
- `components/checkout/order-receipt.tsx`
- `components/products/product-purchase-panel.tsx`
- `lib/cart.ts`
- `lib/checkout-session.ts`
- `lib/direct-checkout.ts` (new)
- `tests/commerce.integration.test.mjs`

### Removed unused storefront files

- `components/battery-finder/battery-finder.tsx`
- `components/battery-finder/finder-select.tsx`
- `components/home/hero-section.tsx`
- `components/home/hero-visual.tsx`
- `components/home/product-section.tsx`
- `components/home/services-strip.module.css`
- `components/home/services-strip.tsx`
- `components/home/styles.ts`
- `public/images/hero-road.png` (16,805,764 bytes)
- `types/vehicle.ts`

### Audit notes

- `POST-OVERHAUL-AUDIT.md` (new)
