import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { useProducts, useCategories } from "@/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Truck, ShieldCheck, CreditCard, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) ?? "" }),
  component: ShopHome,
});

function ShopHome() {
  const { q } = Route.useSearch();
  const products = useProducts((s) => s.products);
  const categories = useCategories((s) => s.categories);
  const [query, setQuery] = useState(q ?? "");
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState("relevance");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let r = products.filter((p) => p.active);
    if (query) r = r.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (cat) r = r.filter((p) => p.category === cat);
    if (maxPrice) r = r.filter((p) => (p.promo_price ?? p.price) <= maxPrice);
    if (sort === "price-asc") r = [...r].sort((a, b) => (a.promo_price ?? a.price) - (b.promo_price ?? b.price));
    if (sort === "price-desc") r = [...r].sort((a, b) => (b.promo_price ?? b.price) - (a.promo_price ?? a.price));
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [products, query, cat, sort, maxPrice]);

  const featured = products.filter((p) => p.featured && p.active).slice(0, 4);

  return (
    <div className="min-h-screen">
      <ShopHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="flex flex-col justify-center gap-4">
            <span className="w-fit rounded-full border bg-background px-3 py-1 text-xs font-medium">Nova coleção</span>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Design que entra na sua rotina.</h1>
            <p className="max-w-md text-muted-foreground">Selecionamos peças que combinam estética minimalista, durabilidade e funcionalidade real.</p>
            <div className="flex gap-3 pt-2">
              <a href="#produtos"><Button size="lg">Comprar agora</Button></a>
              <a href="#destaques"><Button size="lg" variant="outline">Ver destaques</Button></a>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-elevated">
            <img src="https://picsum.photos/seed/herobsh/1200/900" alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 text-sm md:grid-cols-4">
          {[
            { icon: Truck, label: "Frete grátis acima de R$ 299" },
            { icon: ShieldCheck, label: "Compra 100% segura" },
            { icon: CreditCard, label: "Em até 12x sem juros" },
            { icon: RotateCcw, label: "Troca em 30 dias" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" /> {label}
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section id="destaques" className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Destaques</h2>
            <p className="text-sm text-muted-foreground">Mais vendidos da semana</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${!cat ? "bg-foreground text-background" : "hover:bg-muted"}`}
          >Todas</button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${cat === c ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >{c}</button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section id="produtos" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produtos..." className="pl-9" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="relevance">Relevância</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A–Z</option>
            </select>
            <select value={maxPrice ?? ""} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Qualquer preço</option>
              <option value="100">Até R$ 100</option>
              <option value="300">Até R$ 300</option>
              <option value="700">Até R$ 700</option>
              <option value="1500">Até R$ 1.500</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-12 text-center text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      <ShopFooter />
    </div>
  );
}
