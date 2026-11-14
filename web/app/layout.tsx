
import type { Metadata } from "next";
import {
  Roboto,
  Bricolage_Grotesque,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Car & Bike Batteries in Mumbai | Project Battery",
  description:
    "Buy car and bike batteries in Mumbai and Navi Mumbai. Free doorstep delivery, battery installation and old battery exchange.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${roboto.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
