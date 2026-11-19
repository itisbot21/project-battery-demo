import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/design/brand";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-surface">
    <header className="admin-top"><div className="store-container admin-top-frame">
      <Brand href="/admin" /><span>Store operations</span><Link href="/" className="shop-button quiet">View storefront</Link>
    </div></header>
    {children}
  </div>;
}
