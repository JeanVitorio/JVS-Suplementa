import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Address,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Settings,
  User,
} from "@/lib/types";
import { defaultProducts, defaultSettings, defaultUsers } from "@/lib/mock-data";
import { uid } from "@/lib/format";

/* ---------------- Auth ---------------- */
interface AuthState {
  users: User[];
  currentUserId: string | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (data: { name: string; email: string; password: string }) => {
    ok: boolean;
    error?: string;
  };
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
          id: "u_" + uid(),
          name,
          email,
          password,
          role: "client",
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
      update: (id, patch) =>
        set({ products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      remove: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      adjustStock: (id, delta) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
        }),
      setStock: (id, n) =>
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, Math.floor(n)) } : p,
          ),
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
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + qty } : i,
            ),
          });
        } else set({ items: [...get().items, { productId, quantity: qty }] });
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQty: (productId, qty) =>
        set({
          items:
            qty <= 0
              ? get().items.filter((i) => i.productId !== productId)
              : get().items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "bsh-cart" },
  ),
);

/* ---------------- Orders ---------------- */
interface OrderState {
  orders: Order[];
  create: (o: Omit<Order, "id" | "createdAt">) => Order;
  setStatus: (id: string, status: OrderStatus) => void;
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
      setStatus: (id, status) =>
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)) }),
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
}): { ok: true; order: Order } | { ok: false; error: string } {
  const cart = useCart.getState();
  const products = useProducts.getState();
  const settings = useSettings.getState().settings;

  if (cart.items.length === 0) return { ok: false, error: "Carrinho vazio." };

  for (const i of cart.items) {
    const p = products.get(i.productId);
    if (!p || !p.active) return { ok: false, error: `Produto indisponível.` };
    if (p.stock < i.quantity)
      return { ok: false, error: `Estoque insuficiente para ${p.name}.` };
  }

  const items = cart.items.map((i) => {
    const p = products.get(i.productId)!;
    const price = p.promo_price ?? p.price;
    return {
      id: "oi_" + uid(),
      productId: p.id,
      name: p.name,
      quantity: i.quantity,
      price,
      image: p.images[0],
    };
  });

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shipping = subtotal >= settings.freeShippingAbove ? 0 : settings.shippingFlat;
  const total = subtotal + shipping;

  // Baixa estoque
  for (const i of cart.items) products.adjustStock(i.productId, -i.quantity);

  const pixCode =
    params.paymentMethod === "pix"
      ? `00020126360014BR.GOV.BCB.PIX0114${settings.pix_key}5204000053039865802BR5913${settings.pix_holder.slice(0, 13)}6009SAO PAULO62${total.toFixed(2)}6304ABCD`
      : undefined;

  const order = useOrders.getState().create({
    userId: params.userId,
    userEmail: params.userEmail,
    items,
    subtotal,
    shipping,
    total,
    status: params.paymentMethod === "pix" ? "aguardando_pagamento" : "pago",
    paymentMethod: params.paymentMethod,
    address: params.address,
    pixCode,
  });

  cart.clear();
  return { ok: true, order };
}
