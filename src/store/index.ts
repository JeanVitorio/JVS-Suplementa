import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Address,
  CartItem,
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Review,
  Settings,
  User,
} from "@/lib/types";
import { defaultProducts, defaultSettings, defaultUsers, defaultReviews, defaultCoupons } from "@/lib/mock-data";
import { uid } from "@/lib/format";

/* ---------------- Auth ---------------- */
interface AuthState {
  users: User[];
  currentUserId: string | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (data: { name: string; email: string; password: string }) => { ok: boolean; error?: string };
  logout: () => void;
  current: () => User | null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: defaultUsers,
      currentUserId: null,
      current: () => {
        const id = get().currentUserId;
        return get().users.find((u) => u.id === id) ?? null;
      },
      login: (email, password) => {
        const u = get().users.find(
          (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password,
        );
        if (!u) return { ok: false, error: "E-mail ou senha inválidos." };
        set({ currentUserId: u.id });
        return { ok: true };
      },
      register: ({ name, email, password }) => {
        if (get().users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
          return { ok: false, error: "E-mail já cadastrado." };
        const user: User = {
          id: "u_" + uid(), name, email, password, role: "client",
          createdAt: new Date().toISOString(),
        };
        set({ users: [...get().users, user], currentUserId: user.id });
        return { ok: true };
      },
      logout: () => set({ currentUserId: null }),
    }),
    { name: "bsh-auth" },
  ),
);

/* ---------------- Products ---------------- */
interface ProductState {
  products: Product[];
  add: (p: Omit<Product, "id" | "createdAt">) => Product;
  update: (id: string, patch: Partial<Product>) => void;
  remove: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  setStock: (id: string, n: number) => void;
  get: (id: string) => Product | undefined;
}

export const useProducts = create<ProductState>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      add: (p) => {
        const product: Product = { ...p, id: "p_" + uid(), createdAt: new Date().toISOString() };
        set({ products: [product, ...get().products] });
        return product;
      },
      update: (id, patch) => set({ products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      remove: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      adjustStock: (id, delta) => set({
        products: get().products.map((p) => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p),
      }),
      setStock: (id, n) => set({
        products: get().products.map((p) => p.id === id ? { ...p, stock: Math.max(0, Math.floor(n)) } : p),
      }),
      get: (id) => get().products.find((p) => p.id === id),
    }),
    { name: "bsh-products" },
  ),
);

/* ---------------- Cart ---------------- */
interface CartState {
  items: CartItem[];
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (productId, qty = 1) => {
        const existing = get().items.find((i) => i.productId === productId);
        if (existing) set({
          items: get().items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + qty } : i),
        });
        else set({ items: [...get().items, { productId, quantity: qty }] });
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQty: (productId, qty) => set({
        items: qty <= 0
          ? get().items.filter((i) => i.productId !== productId)
          : get().items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i),
      }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "bsh-cart" },
  ),
);

/* ---------------- Wishlist ---------------- */
interface WishlistState {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => set({
        ids: get().ids.includes(productId)
          ? get().ids.filter((x) => x !== productId)
          : [...get().ids, productId],
      }),
      has: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    { name: "bsh-wishlist" },
  ),
);

/* ---------------- Reviews ---------------- */
interface ReviewState {
  reviews: Review[];
  add: (r: Omit<Review, "id" | "createdAt">) => Review;
  remove: (id: string) => void;
  byProduct: (productId: string) => Review[];
  avg: (productId: string) => { score: number; count: number };
}

export const useReviews = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: defaultReviews,
      add: (r) => {
        const review: Review = { ...r, id: "r_" + uid(), createdAt: new Date().toISOString() };
        set({ reviews: [review, ...get().reviews] });
        return review;
      },
      remove: (id) => set({ reviews: get().reviews.filter((r) => r.id !== id) }),
      byProduct: (productId) => get().reviews.filter((r) => r.productId === productId),
      avg: (productId) => {
        const list = get().reviews.filter((r) => r.productId === productId);
        if (!list.length) return { score: 0, count: 0 };
        return { score: list.reduce((s, r) => s + r.rating, 0) / list.length, count: list.length };
      },
    }),
    { name: "bsh-reviews" },
  ),
);

/* ---------------- Coupons ---------------- */
interface CouponState {
  coupons: Coupon[];
  add: (c: Omit<Coupon, "id" | "createdAt">) => Coupon;
  update: (id: string, patch: Partial<Coupon>) => void;
  remove: (id: string) => void;
  validate: (code: string, subtotal: number) => { ok: true; coupon: Coupon; discount: number } | { ok: false; error: string };
}

export const useCoupons = create<CouponState>()(
  persist(
    (set, get) => ({
      coupons: defaultCoupons,
      add: (c) => {
        const coupon: Coupon = { ...c, id: "c_" + uid(), createdAt: new Date().toISOString() };
        set({ coupons: [coupon, ...get().coupons] });
        return coupon;
      },
      update: (id, patch) => set({ coupons: get().coupons.map((c) => c.id === id ? { ...c, ...patch } : c) }),
      remove: (id) => set({ coupons: get().coupons.filter((c) => c.id !== id) }),
      validate: (code, subtotal) => {
        const c = get().coupons.find((x) => x.code.toLowerCase() === code.toLowerCase());
        if (!c) return { ok: false, error: "Cupom inválido." };
        if (!c.active) return { ok: false, error: "Cupom inativo." };
        if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { ok: false, error: "Cupom expirado." };
        if (c.minSubtotal && subtotal < c.minSubtotal)
          return { ok: false, error: `Pedido mínimo de R$ ${c.minSubtotal.toFixed(2)}.` };
        const discount = c.type === "percent"
          ? Math.min(subtotal, subtotal * (c.value / 100))
          : Math.min(subtotal, c.value);
        return { ok: true, coupon: c, discount };
      },
    }),
    { name: "bsh-coupons" },
  ),
);

/* ---------------- Orders ---------------- */
interface OrderState {
  orders: Order[];
  create: (o: Omit<Order, "id" | "createdAt">) => Order;
  setStatus: (id: string, status: OrderStatus) => void;
  setTracking: (id: string, code: string) => void;
  byUser: (userId: string) => Order[];
  get: (id: string) => Order | undefined;
}

export const useOrders = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      create: (o) => {
        const order: Order = { ...o, id: "o_" + uid(), createdAt: new Date().toISOString() };
        set({ orders: [order, ...get().orders] });
        return order;
      },
      setStatus: (id, status) => set({ orders: get().orders.map((o) => o.id === id ? { ...o, status } : o) }),
      setTracking: (id, code) => set({ orders: get().orders.map((o) => o.id === id ? { ...o, trackingCode: code } : o) }),
      byUser: (userId) => get().orders.filter((o) => o.userId === userId),
      get: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: "bsh-orders" },
  ),
);

/* ---------------- Settings ---------------- */
interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      update: (patch) => set({ settings: { ...get().settings, ...patch } }),
    }),
    { name: "bsh-settings" },
  ),
);

/* ---------------- Helpers ---------------- */
export function checkout(params: {
  userId: string;
  userEmail: string;
  address: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}): { ok: true; order: Order } | { ok: false; error: string } {
  const cart = useCart.getState();
  const products = useProducts.getState();
  const settings = useSettings.getState().settings;

  if (cart.items.length === 0) return { ok: false, error: "Carrinho vazio." };

  for (const i of cart.items) {
    const p = products.get(i.productId);
    if (!p || !p.active) return { ok: false, error: `Produto indisponível.` };
    if (p.stock < i.quantity) return { ok: false, error: `Estoque insuficiente para ${p.name}.` };
  }

  const items = cart.items.map((i) => {
    const p = products.get(i.productId)!;
    const price = p.promo_price ?? p.price;
    return { id: "oi_" + uid(), productId: p.id, name: p.name, quantity: i.quantity, price, image: p.images[0] };
  });

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  let discount = 0;
  let couponCode: string | undefined;
  if (params.couponCode) {
    const v = useCoupons.getState().validate(params.couponCode, subtotal);
    if (v.ok) { discount = v.discount; couponCode = v.coupon.code; }
  }
  const shipping = subtotal - discount >= settings.freeShippingAbove ? 0 : settings.shippingFlat;
  const total = Math.max(0, subtotal - discount + shipping);

  for (const i of cart.items) products.adjustStock(i.productId, -i.quantity);

  const pixCode = params.paymentMethod === "pix"
    ? `00020126360014BR.GOV.BCB.PIX0114${settings.pix_key}5204000053039865802BR5913${settings.pix_holder.slice(0, 13)}6009SAO PAULO62${total.toFixed(2)}6304ABCD`
    : undefined;

  const order = useOrders.getState().create({
    userId: params.userId,
    userEmail: params.userEmail,
    items, subtotal, shipping, discount, couponCode, total,
    status: params.paymentMethod === "pix" ? "aguardando_pagamento" : "pago",
    paymentMethod: params.paymentMethod,
    address: params.address,
    pixCode,
  });

  cart.clear();
  return { ok: true, order };
}
