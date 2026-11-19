import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./storefront.css";
import { publicOrigin } from "@/lib/public-origin";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: publicOrigin(),
  alternates: { canonical: "/" },
  title: "Car & Bike Batteries in Mumbai | Project Battery",
  description: "Find car and bike batteries in Mumbai and Navi Mumbai. Free doorstep delivery, installation and old battery exchange.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en-IN" className={geist.variable + " " + mono.variable + " h-full antialiased"}>
    <body className={geist.className + " min-h-full flex flex-col"}>{children}</body>
  </html>;
}
