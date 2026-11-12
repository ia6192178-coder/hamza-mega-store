export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  description: string;
  image_url: string;
  stock: number;
  is_new: boolean;
  is_best_seller: boolean;
  is_clearance: boolean;
  is_sold_out: boolean;
  rating: number;
  created_at?: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  total: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
};

export type Settings = Record<string, string>;

export function formatRs(amount: number): string {
  return `Rs ${Number(amount).toLocaleString('en-US')}`;
}

export function discountPercent(p: Product): number | null {
  if (!p.old_price || p.old_price <= p.price) return null;
  return Math.round(((p.old_price - p.price) / p.old_price) * 100);
}
