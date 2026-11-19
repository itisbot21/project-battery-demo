import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/info-page";

export const metadata: Metadata = { title: "About Project Battery", alternates: { canonical: "/about" } };
export default function About() {
  return <InfoPage title="About Project Battery">
    <p>We sell car and bike batteries from our own inventory. Our team handles doorstep delivery and installation in serviceable parts of Mumbai and Navi Mumbai.</p>
    <p>Use the vehicle finder to check recorded battery fitment, or shop by battery brand and model number. You can place an order as a guest and pay in cash at delivery.</p>
    <p><Link className="text-link" href="/delivery">Check delivery coverage</Link> or <Link className="text-link" href="/contact">get customer support</Link>.</p>
  </InfoPage>;
}
