import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
  name: string;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
  promo_price?: number;
  promo_expiry?: string;
}

export interface Customer {
  id: number;
  member_id: string;
  name: string;
  phone: string;
  points: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: number;
  invoice_no: string;
  total: number;
  discount: number;
  payment_method: string;
  cash_received: number;
  change_amount: number;
  customer_id?: number;
  user_id: number;
  created_at: string;
  cashier_name?: string;
  customer_name?: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product_name?: string;
  barcode?: string;
}
