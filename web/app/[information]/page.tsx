import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoPage } from "@/components/layout/info-page";
import { PinChecker } from "@/components/layout/pin-checker";

const pages = {
  delivery: { title: "Delivery and installation", content: <>
    <p>Doorstep delivery and installation are free for eligible PIN codes in Mumbai and Navi Mumbai. We do not serve Thane.</p>
    <PinChecker />
    <h2>How delivery is arranged</h2><p>After you place an order, our team calls you to confirm delivery timing. You pay in cash at delivery after installation and any old battery check.</p>
  </> },
  faq: { title: "Frequently asked questions", content: <>
    <details><summary>How do I find the right battery?</summary><p>Choose the exact vehicle variant in the <Link className="text-link" href="/#battery-finder">vehicle finder</Link>. Results are based on recorded compatibility.</p></details>
    <details><summary>Can I buy without signing in?</summary><p>Yes. Guest checkout is available with cash on delivery.</p></details>
    <details><summary>When will my battery arrive?</summary><p>Our team calls after your order is placed to confirm timing. <Link className="text-link" href="/delivery">Check your delivery PIN</Link> before ordering.</p></details>
    <details><summary>What if my old battery doesn’t qualify?</summary><p>The applicable without-exchange price becomes payable. See the <Link className="text-link" href="/exchange">exchange information</Link>.</p></details>
  </> },
  warranty: { title: "Battery warranty", content: <>
    <p>Check the product page for the published total, free replacement and pro-rata warranty periods. The manufacturer’s terms determine eligibility and coverage.</p>
    <p>Keep your order reference and any warranty documentation supplied with the battery. For help with a particular battery, <Link className="text-link" href="/contact">visit customer support</Link>.</p>
  </> },
  exchange: { title: "Old battery exchange", content: <>
    <p>Product pages show prices with and without old battery exchange. Select exchange when ordering to see the conditional price.</p>
    <p>Our team verifies each old battery at delivery. The without-exchange price applies to each old battery that is unavailable or does not qualify. You can see any adjustment in your private order tracking page.</p>
  </> },
  returns: { title: "Returns and cancellations", content: <>
    <p>For a cancellation request, contact the team when they call to confirm delivery, or use the <Link className="text-link" href="/contact">published support options</Link>. Keep your order reference available.</p>
    <p>For a problem with an installed battery, contact support with your order reference and battery model. Review the <Link className="text-link" href="/warranty">manufacturer warranty information</Link> that applies to your battery.</p>
  </> },
  privacy: { title: "Privacy information", content: <>
    <p>Checkout asks for your name, mobile number and delivery address so we can arrange delivery and installation and manage your order. Guest checkout is available.</p>
    <p>Keep your tracking link private. It allows anyone with the link to see the order status, batteries and settlement amounts. Your phone number and address do not appear in guest tracking.</p>
    <p>Optional Google sign-in is available for customers. The cart is saved in your browser. Contact <Link className="text-link" href="/contact">customer support</Link> for privacy enquiries.</p>
  </> },
  terms: { title: "Ordering information", content: <>
    <p>Orders cover car and bike batteries for eligible delivery PIN codes in Mumbai and Navi Mumbai. Displayed prices include GST. Cash on delivery is the available payment method.</p>
    <p>Our team contacts you after ordering to confirm delivery timing. Exchange prices depend on inspection at delivery. See <Link className="text-link" href="/exchange">exchange</Link>, <Link className="text-link" href="/returns">returns and cancellations</Link> and <Link className="text-link" href="/warranty">manufacturer warranty</Link> information.</p>
  </> },
};

function pageFor(key: string) {
  return Object.hasOwn(pages, key) ? pages[key as keyof typeof pages] : undefined;
}

export function generateStaticParams() {
  return Object.keys(pages).map((information) => ({ information }));
}

export async function generateMetadata({ params }: PageProps<"/[information]">): Promise<Metadata> {
  const { information } = await params;
  const page = pageFor(information);
  return page ? { title: page.title + " | Project Battery", alternates: { canonical: "/" + information } } : { robots: { index: false } };
}

export default async function Information({ params }: PageProps<"/[information]">) {
  const page = pageFor((await params).information);
  if (!page) notFound();
  return <InfoPage title={page.title}>{page.content}</InfoPage>;
}
