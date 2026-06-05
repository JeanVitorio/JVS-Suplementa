export type Role = "admin" | "client";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promo_price?: number | null;
  stock: number;
  images: string[];
  category: string;
  sku: string;
  active: boolean;
  featured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "preparando"
  | "enviado"
  | "entregue"
  | "cancelado";

export type PaymentMethod = "pix" | "card";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Address {
  name: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  address: Address;
  pixCode?: string;
  trackingCode?: string;
  createdAt: string;
}

export interface Settings {
  storeName: string;
  storeDescription: string;
  pix_key: string;
  pix_holder: string;
  stripe_public_key: string;
  stripe_secret_key: string;
  shippingFlat: number;
  freeShippingAbove: number;
  whatsapp: string;
  email: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
}
