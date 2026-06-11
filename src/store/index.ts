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
import { supabase } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

/* ============ Helpers ============ */
function req() {
  if (!supabase) throw new Error("Supabase não configurado (.env).");
  return supabase;
}

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

/* ============ Auth (Supabase) ============ */
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

async function loadUserFromAuth(authUser: any): Promise<User | null> {
  if (!authUser) return null;
  const sb = req();
  const { data: profile } = await sb
    .from("profiles")
    .select("name, email")
    .eq("id", authUser.id)
    .maybeSingle();
  const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", authUser.id);
  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  return {
    id: authUser.id,
    name: profile?.name ?? authUser.user_metadata?.name ?? authUser.email?.split("@")[0] ?? "",
    email: profile?.email ?? authUser.email ?? "",
    role: isAdmin ? "admin" : "client",
    createdAt: authUser.created_at,
  };
}

export const useAuth = create<AuthState>()((set, get) => ({
  currentUser: null,
  loading: false,
  initialized: false,

  current: () => get().currentUser,
  isAdmin: () => get().currentUser?.role === "admin",

  init: async () => {
    if (!supabase) {
      set({ initialized: true });
      return;
    }
    set({ loading: true });
    const { data } = await supabase.auth.getUser();
    const u = await loadUserFromAuth(data.user);
    set({ currentUser: u, loading: false, initialized: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = await loadUserFromAuth(session?.user ?? null);
      set({ currentUser: user });
    });
  },

  refresh: async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    set({ currentUser: await loadUserFromAuth(data.user) });
  },

  login: async (email, password) => {
    if (!supabase) return { ok: false, error: "Supabase não configurado." };
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) return { ok: false, error: error.message };
    await get().refresh();
    return { ok: true };
  },

  register: async ({ name, email, password }) => {
    if (!supabase) return { ok: false, error: "Supabase não configurado." };
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      set({ loading: false });
      return { ok: false, error: error.message };
    }
    // Tenta criar profile (se trigger não existir)
    if (data.user) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, name, email }, { onConflict: "id" });
    }
    set({ loading: false });
    await get().refresh();
    return { ok: true };
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ currentUser: null });
  },
}));

/* ============ Customers (lista para admin) ============ */
interface CustomersState {
  customers: User[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useCustomers = create<CustomersState>()((set) => ({
  customers: [],
  loading: false,
  load: async () => {
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      set({ loading: false });
      return;
    }
    set({
      customers: (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: "client",
        createdAt: p.created_at,
      })),
      loading: false,
    });
  },
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
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("[products] load:", error);
    set({ products: (data ?? []).map(mapProduct), loading: false });
  },

  add: async (p) => {
    const sb = req();
    const { data, error } = await sb
      .from("products")
      .insert(productPatchToDb(p as Partial<Product>))
      .select("*")
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    const prod = mapProduct(data);
    set({ products: [prod, ...get().products] });
    return prod;
  },

  update: async (id, patch) => {
    const sb = req();
    const { error } = await sb.from("products").update(productPatchToDb(patch)).eq("id", id);
    if (error) return console.error(error);
    set({ products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  remove: async (id) => {
    const sb = req();
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) return console.error(error);
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

/* ============ Wishlist (Supabase quando logado, localStorage senão) ============ */
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
        if (!supabase) return;
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        const { data } = await supabase
          .from("wishlist")
          .select("product_id")
          .eq("user_id", u.user.id);
        set({ ids: (data ?? []).map((r: any) => r.product_id) });
      },
      toggle: async (productId) => {
        const has = get().ids.includes(productId);
        set({ ids: has ? get().ids.filter((x) => x !== productId) : [...get().ids, productId] });
        if (!supabase) return;
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        if (has) {
          await supabase
            .from("wishlist")
            .delete()
            .eq("user_id", u.user.id)
            .eq("product_id", productId);
        } else {
          await supabase.from("wishlist").insert({ user_id: u.user.id, product_id: productId });
        }
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
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    set({ reviews: (data ?? []).map(mapReview), loading: false });
  },
  add: async (r) => {
    const sb = req();
    const { data, error } = await sb
      .from("reviews")
      .insert({
        product_id: r.productId,
        user_id: r.userId,
        user_name: r.userName,
        rating: r.rating,
        comment: r.comment,
      })
      .select("*")
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    const rv = mapReview(data);
    set({ reviews: [rv, ...get().reviews] });
    return rv;
  },
  remove: async (id) => {
    const sb = req();
    const { error } = await sb.from("reviews").delete().eq("id", id);
    if (error) return console.error(error);
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
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    set({ coupons: (data ?? []).map(mapCoupon), loading: false });
  },
  add: async (c) => {
    const sb = req();
    const { data, error } = await sb
      .from("coupons")
      .insert(couponPatchToDb(c as Partial<Coupon>))
      .select("*")
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    const cp = mapCoupon(data);
    set({ coupons: [cp, ...get().coupons] });
    return cp;
  },
  update: async (id, patch) => {
    const sb = req();
    const { error } = await sb.from("coupons").update(couponPatchToDb(patch)).eq("id", id);
    if (error) return console.error(error);
    set({ coupons: get().coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  },
  remove: async (id) => {
    const sb = req();
    const { error } = await sb.from("coupons").delete().eq("id", id);
    if (error) return console.error(error);
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

async function fetchOrderItems(orderIds: string[]): Promise<Record<string, OrderItem[]>> {
  if (!supabase || orderIds.length === 0) return {};
  const { data } = await supabase.from("order_items").select("*").in("order_id", orderIds);
  const map: Record<string, OrderItem[]> = {};
  for (const row of data ?? []) {
    (map[row.order_id] ??= []).push(mapOrderItem(row));
  }
  return map;
}

export const useOrders = create<OrderState>()((set, get) => ({
  orders: [],
  loading: false,
  load: async () => {
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      set({ loading: false });
      return;
    }
    const rows = data ?? [];
    const items = await fetchOrderItems(rows.map((r: any) => r.id));
    set({ orders: rows.map((r: any) => mapOrder(r, items[r.id] ?? [])), loading: false });
  },
  loadOne: async (id) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const items = await fetchOrderItems([id]);
    const order = mapOrder(data, items[id] ?? []);
    const existing = get().orders;
    set({
      orders: existing.some((o) => o.id === id)
        ? existing.map((o) => (o.id === id ? order : o))
        : [order, ...existing],
    });
    return order;
  },
  setStatus: async (id, status) => {
    const sb = req();
    const { error } = await sb.from("orders").update({ status }).eq("id", id);
    if (error) return console.error(error);
    set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)) });
  },
  setTracking: async (id, code) => {
    const sb = req();
    const { error } = await sb.from("orders").update({ tracking_code: code }).eq("id", id);
    if (error) return console.error(error);
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
  load: async () => {
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase.from("settings").select("*").limit(1).maybeSingle();
    if (error) {
      console.error(error);
      set({ loading: false });
      return;
    }
    if (data) set({ settings: mapSettings(data), id: data.id, loading: false });
    else set({ loading: false });
  },
  update: async (patch) => {
    const sb = req();
    const id = get().id;
    if (id) {
      const { error } = await sb.from("settings").update(settingsPatchToDb(patch)).eq("id", id);
      if (error) return console.error(error);
    } else {
      const { data, error } = await sb
        .from("settings")
        .insert(settingsPatchToDb({ ...get().settings, ...patch }))
        .select("*")
        .single();
      if (error) return console.error(error);
      set({ id: data.id });
    }
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
    if (!supabase) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, image_url, position")
      .order("position", { ascending: true });
    if (error) {
      console.error(error);
      set({ loading: false });
      return;
    }
    const items: Category[] = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.image_url,
      position: c.position ?? 0,
    }));
    set({
      items,
      categories: items.length ? items.map((i) => i.name) : DEFAULT_CATEGORIES,
      loading: false,
    });
  },
  add: async ({ name, slug, imageUrl, position }) => {
    const sb = req();
    const { data, error } = await sb
      .from("categories")
      .insert({
        name,
        slug: slug?.trim() ? slugify(slug) : slugify(name),
        image_url: imageUrl ?? null,
        position: position ?? get().items.length,
      })
      .select("*")
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    await get().load();
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      imageUrl: data.image_url,
      position: data.position,
    };
  },
  update: async (id, patch) => {
    const sb = req();
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.slug !== undefined) dbPatch.slug = slugify(patch.slug);
    if (patch.imageUrl !== undefined) dbPatch.image_url = patch.imageUrl;
    if (patch.position !== undefined) dbPatch.position = patch.position;
    const { error } = await sb.from("categories").update(dbPatch).eq("id", id);
    if (error) return console.error(error);
    await get().load();
  },
  remove: async (id) => {
    const sb = req();
    const { error } = await sb.from("categories").delete().eq("id", id);
    if (error) return console.error(error);
    await get().load();
  },
}));

/* ============ Storage helpers ============ */
async function uploadToBucket(bucket: string, file: File, prefix = ""): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) {
    console.error(`[upload:${bucket}]`, error);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export const uploadProductImage = (file: File) => uploadToBucket("product-images", file);
export const uploadStoreLogo = (file: File) => uploadToBucket("store-assets", file, "logo/");
export const uploadCategoryImage = (file: File) => uploadToBucket("category-images", file);
export const uploadUserAvatar = (file: File, userId: string) =>
  uploadToBucket("avatars", file, `${userId}/`);

export async function generateUniqueSku(): Promise<string> {
  if (!supabase) return `SKU-${Date.now().toString(36).toUpperCase()}`;
  for (let i = 0; i < 8; i++) {
    const candidate = `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("sku", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `SKU-${Date.now().toString(36).toUpperCase()}`;
}

/* ============ Checkout (Supabase) ============ */
export async function checkout(params: {
  userId: string;
  userEmail: string;
  address: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Supabase não configurado." };
  const cart = useCart.getState();
  const products = useProducts.getState();
  const settings = useSettings.getState().settings;

  if (cart.items.length === 0) return { ok: false, error: "Carrinho vazio." };

  for (const i of cart.items) {
    const p = products.get(i.productId);
    if (!p || !p.active) return { ok: false, error: "Produto indisponível." };
    if (p.stock < i.quantity) return { ok: false, error: `Estoque insuficiente para ${p.name}.` };
  }

  const lineItems = cart.items.map((i) => {
    const p = products.get(i.productId)!;
    const price = p.promo_price ?? p.price;
    return {
      product_id: p.id,
      name: p.name,
      quantity: i.quantity,
      price,
      image: p.images[0] ?? null,
    };
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

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: params.userId,
      user_email: params.userEmail,
      subtotal,
      shipping,
      discount,
      coupon_code: couponCode,
      total,
      status: params.paymentMethod === "pix" ? "aguardando_pagamento" : "pago",
      payment_method: params.paymentMethod,
      address: params.address,
    })
    .select("*")
    .single();

  if (orderErr || !orderRow) {
    console.error(orderErr);
    return { ok: false, error: orderErr?.message ?? "Falha ao criar pedido." };
  }

  const { data: itemRows, error: itemsErr } = await supabase
    .from("order_items")
    .insert(lineItems.map((it) => ({ ...it, order_id: orderRow.id })))
    .select("*");

  if (itemsErr) {
    console.error(itemsErr);
    return { ok: false, error: itemsErr.message };
  }

  // Decrementa estoque
  for (const i of cart.items) {
    const cur = products.get(i.productId);
    if (cur) await products.setStock(i.productId, Math.max(0, cur.stock - i.quantity));
  }

  const order = mapOrder(orderRow, (itemRows ?? []).map(mapOrderItem));
  useOrders.setState((s) => ({ orders: [order, ...s.orders] }));
  cart.clear();
  return { ok: true, order };
}
