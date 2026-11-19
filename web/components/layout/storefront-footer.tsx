import Link from "next/link";
import { Brand } from "@/components/design/brand";

const links = [
  ["Support", "/contact"], ["Delivery", "/delivery"], ["Track order", "/track-order"], ["Warranty", "/warranty"],
  ["FAQs", "/faq"], ["Exchange", "/exchange"], ["About", "/about"], ["Returns & cancellations", "/returns"],
  ["Privacy", "/privacy"], ["Terms", "/terms"],
];

export function StorefrontFooter() {
  return <footer className="store-footer">
    <div className="store-container footer-inner">
      <div><Brand /><p>Car and bike batteries, delivered and installed in eligible areas of Mumbai and Navi Mumbai.</p></div>
      <nav aria-label="Customer information">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    </div>
  </footer>;
}
