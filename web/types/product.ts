
export type Product = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  category: string;

  // BASIC DETAILS
  capacityAh: number | null;
  warrantyMonths: number | null;

  // PRODUCT PAGE CONTENT
  description: string | null;
  imageUrls: string[];
  features: string[];
  specifications: Record<string, string>;

  // WARRANTY BREAKDOWN
  warrantyFreeMonths: number | null;
  warrantyProRataMonths: number | null;

  // SEO
  seoTitle: string | null;
  seoDescription: string | null;

  // PRICES IN PAISE (GST INCLUDED)
  mrpPaise: number;
  withoutExchangePaise: number;
  withExchangePaise: number;

  // INVENTORY
  stock: number;
  active: boolean;
};