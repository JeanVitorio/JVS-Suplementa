import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Address,
  CartItem,
  Coupon,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  Review,
  Settings,
  User,
} from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { MOCK_CREDENTIALS, mockUsers } from "@/lib/mock-data";

/* ============ Helpers ============ */

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    promo_price: row.promo_price != null ? Number(row.promo_price) : null,
    stock: row.stock ?? 0,
    images: row.images ?? [],
    category: row.category ?? "",
    sku: row.sku ?? "",
    active: row.active ?? true,
    featured: row.featured ?? false,
    createdAt: row.created_at,
  };
}

function mapReview(row: any): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minSubtotal: row.min_subtotal != null ? Number(row.min_subtotal) : 0,
    active: row.active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function mapOrder(row: any, items: OrderItem[] = []): Order {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    items,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: row.discount != null ? Number(row.discount) : 0,
    couponCode: row.coupon_code ?? undefined,
    total: Number(row.total),
    status: row.status,
    paymentMethod: row.payment_method,
    address: row.address,
    pixCode: row.pix_code ?? undefined,
    trackingCode: row.tracking_code ?? undefined,
    createdAt: row.created_at,
  };
}

function mapOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    quantity: row.quantity,
    price: Number(row.price),
    image: row.image ?? undefined,
  };
}

function mapSettings(row: any): Settings {
  return {
    storeName: row.store_name ?? "",
    storeDescription: row.store_description ?? "",
    logoUrl: row.logo_url ?? "",
    pix_key: row.pix_key ?? "",
    pix_holder: row.pix_holder ?? "",
    stripe_public_key: row.stripe_public_key ?? "",
    stripe_secret_key: row.stripe_secret_key ?? "",
    shippingFlat: Number(row.shipping_flat ?? 0),
    freeShippingAbove: Number(row.free_shipping_above ?? 0),
    whatsapp: row.whatsapp ?? "",
    email: row.email ?? "",
  };
}

const DEFAULT_SETTINGS: Settings = {
  storeName: "Loja",
  storeDescription: "",
  logoUrl: "",
  pix_key: "",
  pix_holder: "",
  stripe_public_key: "",
  stripe_secret_key: "",
  shippingFlat: 0,
  freeShippingAbove: 0,
  whatsapp: "",
  email: "",
};

/* ============ Auth local de demonstração ============ */
interface AuthState {
  currentUser: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  current: () => User | null;
  isAdmin: () => boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      loading: false,
      initialized: true,
      current: () => get().currentUser,
      isAdmin: () => get().currentUser?.role === "admin",
      init: async () => { set({ initialized: true }); },
      refresh: async () => undefined,
      login: async (email, password) => {
        set({ loading: true });
        await new Promise<void>((resolve) => setTimeout(resolve, 450));
        const normalized = email.trim().toLowerCase();
        const role = normalized === MOCK_CREDENTIALS.admin.email && password === MOCK_CREDENTIALS.admin.password
          ? "admin"
          : normalized === MOCK_CREDENTIALS.client.email && password === MOCK_CREDENTIALS.client.password
            ? "client"
            : null;
        const user = role ? mockUsers.find((item) => item.role === role && item.email === normalized) : undefined;
        if (!user) {
          set({ loading: false });
          return { ok: false, error: "E-mail ou senha inválidos para a demonstração." };
        }
        set({ currentUser: user, loading: false, initialized: true });
        return { ok: true };
      },
      register: async ({ name, email, password }) => {
        if (password.length < 6) return { ok: false, error: "A senha precisa ter pelo menos 6 caracteres." };
        const user: User = { id: `client-${Date.now()}`, name, email: email.trim().toLowerCase(), role: "client", createdAt: new Date().toISOString() };
        useCustomers.setState((state) => ({ customers: [user, ...state.customers] }));
        set({ currentUser: user, initialized: true });
        return { ok: true };
      },
      logout: async () => { set({ currentUser: null }); },
    }),
    { name: "bertolleti-demo-auth", partialize: (state) => ({ currentUser: state.currentUser }) },
  ),
);

/* ============ Customers (lista para admin) ============ */
interface CustomersState {
  customers: User[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useCustomers = create<CustomersState>()((set) => ({
  customers: mockUsers.filter((user) => user.role === "client"),
  loading: false,
  load: async () => { set({ loading: false }); },
}));

/* ============ Products ============ */
interface ProductState {
  products: Product[];
  loading: boolean;
  load: () => Promise<void>;
  add: (p: Omit<Product, "id" | "createdAt">) => Promise<Product | null>;
  update: (id: string, patch: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  setStock: (id: string, n: number) => Promise<void>;
  get: (id: string) => Product | undefined;
}

function productPatchToDb(patch: Partial<Product>) {
  const out: any = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.price !== undefined) out.price = patch.price;
  if (patch.promo_price !== undefined) out.promo_price = patch.promo_price;
  if (patch.stock !== undefined) out.stock = patch.stock;
  if (patch.images !== undefined) out.images = patch.images;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.sku !== undefined) out.sku = patch.sku;
  if (patch.active !== undefined) out.active = patch.active;
  if (patch.featured !== undefined) out.featured = patch.featured;
  return out;
}

export const useProducts = create<ProductState>()((set, get) => ({
  products: [],
  loading: false,

  load: async () => {
    set({ loading: false });
  },

  add: async (p) => {
    const prod: Product = { ...p, id: `product-${Date.now()}`, createdAt: new Date().toISOString() };
    set({ products: [prod, ...get().products] });
    return prod;
  },

  update: async (id, patch) => {
    set({ products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  remove: async (id) => {
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  adjustStock: async (id, delta) => {
    const cur = get().products.find((p) => p.id === id);
    if (!cur) return;
    await get().setStock(id, Math.max(0, cur.stock + delta));
  },

  setStock: async (id, n) => {
    await get().update(id, { stock: Math.max(0, Math.floor(n)) });
  },

  get: (id) => get().products.find((p) => p.id === id),
}));

/* ============ Cart (local) ============ */
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
        const ex = get().items.find((i) => i.productId === productId);
        if (ex)
          set({
            items: get().items.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + qty } : i,
            ),
          });
        else set({ items: [...get().items, { productId, quantity: qty }] });
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

/* ============ Wishlist local ============ */
interface WishlistState {
  ids: string[];
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      load: async () => {
        return;
      },
      toggle: async (productId) => {
        const has = get().ids.includes(productId);
        set({ ids: has ? get().ids.filter((x) => x !== productId) : [...get().ids, productId] });
      },
      has: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    { name: "bsh-wishlist" },
  ),
);

/* ============ Reviews ============ */
interface ReviewState {
  reviews: Review[];
  loading: boolean;
  load: () => Promise<void>;
  add: (r: Omit<Review, "id" | "createdAt">) => Promise<Review | null>;
  remove: (id: string) => Promise<void>;
  byProduct: (productId: string) => Review[];
  avg: (productId: string) => { score: number; count: number };
}

export const useReviews = create<ReviewState>()((set, get) => ({
  reviews: [],
  loading: false,
  load: async () => {
    set({ loading: false });
  },
  add: async (r) => {
    const rv: Review = { ...r, id: `review-${Date.now()}`, createdAt: new Date().toISOString() };
    set({ reviews: [rv, ...get().reviews] });
    return rv;
  },
  remove: async (id) => {
    set({ reviews: get().reviews.filter((r) => r.id !== id) });
  },
  byProduct: (productId) => get().reviews.filter((r) => r.productId === productId),
  avg: (productId) => {
    const list = get().reviews.filter((r) => r.productId === productId);
    if (!list.length) return { score: 0, count: 0 };
    return { score: list.reduce((s, r) => s + r.rating, 0) / list.length, count: list.length };
  },
}));

/* ============ Coupons ============ */
interface CouponState {
  coupons: Coupon[];
  loading: boolean;
  load: () => Promise<void>;
  add: (c: Omit<Coupon, "id" | "createdAt">) => Promise<Coupon | null>;
  update: (id: string, patch: Partial<Coupon>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  validate: (
    code: string,
    subtotal: number,
  ) => { ok: true; coupon: Coupon; discount: number } | { ok: false; error: string };
}

function couponPatchToDb(p: Partial<Coupon>) {
  const o: any = {};
  if (p.code !== undefined) o.code = p.code;
  if (p.type !== undefined) o.type = p.type;
  if (p.value !== undefined) o.value = p.value;
  if (p.minSubtotal !== undefined) o.min_subtotal = p.minSubtotal;
  if (p.active !== undefined) o.active = p.active;
  if (p.expiresAt !== undefined) o.expires_at = p.expiresAt;
  return o;
}

export const useCoupons = create<CouponState>()((set, get) => ({
  coupons: [],
  loading: false,
  load: async () => {
    set({ loading: false });
  },
  add: async (c) => {
    const cp: Coupon = { ...c, id: `coupon-${Date.now()}`, createdAt: new Date().toISOString() };
    set({ coupons: [cp, ...get().coupons] });
    return cp;
  },
  update: async (id, patch) => {
    set({ coupons: get().coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },
  remove: async (id) => {
    set({ coupons: get().coupons.filter((c) => c.id !== id) });
  },
  validate: (code, subtotal) => {
    const c = get().coupons.find((x) => x.code.toLowerCase() === code.toLowerCase());
    if (!c) return { ok: false, error: "Cupom inválido." };
    if (!c.active) return { ok: false, error: "Cupom inativo." };
    if (c.expiresAt && new Date(c.expiresAt) < new Date())
      return { ok: false, error: "Cupom expirado." };
    if (c.minSubtotal && subtotal < c.minSubtotal)
      return { ok: false, error: `Pedido mínimo de R$ ${c.minSubtotal.toFixed(2)}.` };
    const discount =
      c.type === "percent"
        ? Math.min(subtotal, subtotal * (c.value / 100))
        : Math.min(subtotal, c.value);
    return { ok: true, coupon: c, discount };
  },
}));

/* ============ Orders ============ */
interface OrderState {
  orders: Order[];
  loading: boolean;
  load: () => Promise<void>;
  loadOne: (id: string) => Promise<Order | null>;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
  setTracking: (id: string, code: string) => Promise<void>;
  byUser: (userId: string) => Order[];
  get: (id: string) => Order | undefined;
}

export const useOrders = create<OrderState>()((set, get) => ({
  orders: [],
  loading: false,
  load: async () => { set({ loading: false }); },
  loadOne: async (id) => {
    return get().orders.find((order) => order.id === id) ?? null;
  },
  setStatus: async (id, status) => {
    set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)) });
  },
  setTracking: async (id, code) => {
    set({ orders: get().orders.map((o) => (o.id === id ? { ...o, trackingCode: code } : o)) });
  },
  byUser: (userId) => get().orders.filter((o) => o.userId === userId),
  get: (id) => get().orders.find((o) => o.id === id),
}));

/* ============ Settings ============ */
interface SettingsState {
  settings: Settings;
  id: string | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

function settingsPatchToDb(p: Partial<Settings>) {
  const o: any = {};
  if (p.storeName !== undefined) o.store_name = p.storeName;
  if (p.storeDescription !== undefined) o.store_description = p.storeDescription;
  if (p.logoUrl !== undefined) o.logo_url = p.logoUrl;
  if (p.pix_key !== undefined) o.pix_key = p.pix_key;
  if (p.pix_holder !== undefined) o.pix_holder = p.pix_holder;
  if (p.stripe_public_key !== undefined) o.stripe_public_key = p.stripe_public_key;
  if (p.stripe_secret_key !== undefined) o.stripe_secret_key = p.stripe_secret_key;
  if (p.shippingFlat !== undefined) o.shipping_flat = p.shippingFlat;
  if (p.freeShippingAbove !== undefined) o.free_shipping_above = p.freeShippingAbove;
  if (p.whatsapp !== undefined) o.whatsapp = p.whatsapp;
  if (p.email !== undefined) o.email = p.email;
  return o;
}

export const useSettings = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  id: null,
  loading: false,
  load: async () => { set({ loading: false }); },
  update: async (patch) => {
    set({ settings: { ...get().settings, ...patch } });
  },
}));

/* ============ Categories ============ */
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  position: number;
}

interface CategoriesState {
  items: Category[];
  categories: string[]; // nomes (compat)
  loading: boolean;
  load: () => Promise<void>;
  add: (data: { name: string; slug?: string; imageUrl?: string; position?: number }) => Promise<Category | null>;
  update: (id: string, patch: Partial<Omit<Category, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const useCategories = create<CategoriesState>()((set, get) => ({
  items: [],
  categories: DEFAULT_CATEGORIES,
  loading: false,
  load: async () => {
    set({ loading: false });
  },
  add: async ({ name, slug, imageUrl, position }) => {
    const category: Category = { id: `cat-${Date.now()}`, name, slug: slug?.trim() ? slugify(slug) : slugify(name), imageUrl, position: position ?? get().items.length };
    const items = [...get().items, category];
    set({ items, categories: items.map((item) => item.name) });
    return category;
  },
  update: async (id, patch) => {
    const normalized = patch.slug ? { ...patch, slug: slugify(patch.slug) } : patch;
    const items = get().items.map((item) => item.id === id ? { ...item, ...normalized } : item);
    set({ items, categories: items.map((item) => item.name) });
  },
  remove: async (id) => {
    const items = get().items.filter((item) => item.id !== id);
    set({ items, categories: items.map((item) => item.name) });
  },
}));

/* ============ Storage helpers ============ */
async function uploadToBucket(bucket: string, file: File, prefix = ""): Promise<string | null> {
  void bucket;
  void prefix;
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Arquivo inválido"));
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export const uploadProductImage = (file: File) => uploadToBucket("product-images", file);
export const uploadStoreLogo = (file: File) => uploadToBucket("store-assets", file, "logo/");
export const uploadCategoryImage = (file: File) => uploadToBucket("category-images", file);
export const uploadUserAvatar = (file: File, userId: string) =>
  uploadToBucket("avatars", file, `${userId}/`);

export async function generateUniqueSku(): Promise<string> {
  return `SKU-${Date.now().toString(36).toUpperCase()}`;
}

/* ============ Checkout local ============ */
export async function checkout(params: {
  userId: string;
  userEmail: string;
  address: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const cart = useCart.getState();
  const products = useProducts.getState();
  const settings = useSettings.getState().settings;

  if (cart.items.length === 0) return { ok: false, error: "Carrinho vazio." };

  for (const i of cart.items) {
    const p = products.get(i.productId);
    if (!p || !p.active) return { ok: false, error: "Produto indisponível." };
    if (p.stock < i.quantity) return { ok: false, error: `Estoque insuficiente para ${p.name}.` };
  }

  const lineItems: OrderItem[] = cart.items.flatMap((i) => {
    const p = products.get(i.productId)!;
    if (!p) return [];
    const price = p.promo_price ?? p.price;
    return [{
      id: `item-${Date.now()}-${p.id}`,
      productId: p.id,
      name: p.name,
      quantity: i.quantity,
      price,
      image: p.images[0],
    }];
  });

  const subtotal = lineItems.reduce((s, it) => s + it.price * it.quantity, 0);

  let discount = 0;
  let couponCode: string | null = null;
  if (params.couponCode) {
    const v = useCoupons.getState().validate(params.couponCode, subtotal);
    if (v.ok) {
      discount = v.discount;
      couponCode = v.coupon.code;
    }
  }

  const shipping =
    settings.freeShippingAbove > 0 && subtotal - discount >= settings.freeShippingAbove
      ? 0
      : settings.shippingFlat;
  const total = Math.max(0, subtotal - discount + shipping);

  for (const i of cart.items) {
    const cur = products.get(i.productId);
    if (cur) await products.setStock(i.productId, Math.max(0, cur.stock - i.quantity));
  }
  const order: Order = {
    id: `BP-${Date.now()}`,
    userId: params.userId,
    userEmail: params.userEmail,
    items: lineItems,
    subtotal,
    shipping,
    discount,
    couponCode: couponCode ?? undefined,
    total,
    status: params.paymentMethod === "pix" ? "aguardando_pagamento" : "pago",
    paymentMethod: params.paymentMethod,
    address: params.address,
    pixCode: params.paymentMethod === "pix" ? `00020126BERTOLLETI${Date.now()}` : undefined,
    createdAt: new Date().toISOString(),
  };
  useOrders.setState((s) => ({ orders: [order, ...s.orders] }));
  cart.clear();
  return { ok: true, order };
}
