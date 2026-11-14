export type Product = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  category: string;
  capacityAh: number | null;
  warrantyMonths: number | null;
  mrpPaise: number;
  withoutExchangePaise: number;
  withExchangePaise: number;
  stock: number;
  active: boolean;
};
