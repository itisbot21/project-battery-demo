"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, Boxes, ClipboardList, LayoutDashboard, MapPin, Settings } from "lucide-react";

const areas = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard }, { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/vehicles", label: "Vehicles", icon: Bike }, { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/pincodes", label: "Delivery PINs", icon: MapPin }, { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function OperationsNav() {
  const pathname = usePathname();
  return <nav className="operations-menu" aria-label="Store operations">
    {areas.map(({ href, label, icon: Icon }) => <Link key={href} href={href}
      aria-current={pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")) ? "page" : undefined}>
      <Icon size={16} aria-hidden="true" />{label}
    </Link>)}
  </nav>;
}
