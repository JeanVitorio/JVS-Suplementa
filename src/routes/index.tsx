import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, Dumbbell, Flame, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCategories, useProducts } from "@/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/supplement-hero.jpg";
import wheyImage from "@/assets/whey-product.jpg";
import creatineImage from "@/assets/creatine-product.jpg";
import preworkoutImage from "@/assets/preworkout-product.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bertolleti Performance — Suplementação para ir além" },
      { name: "description", content: "Suplementos selecionados para força, performance e recuperação. Whey, creatina, pré-treino e vitaminas." },
      { property: "og:title", content: "Bertolleti Performance" },
      { property: "og:description", content: "Suplementação selecionada para quem leva evolução a sério." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopHome,
});

const goals = [
  { title: "Ganhar massa", copy: "Proteína e calorias para construir.", image: wheyImage, category: "Proteínas", span: "md:col-span-2 md:row-span-2" },
  { title: "Mais força", copy: "Potência para subir a carga.", image: creatineImage, category: "Creatina", span: "md:col-span-1" },
  { title: "Energia total", copy: "Foco para chegar mais longe.", image: preworkoutImage, category: "Pré-treino", span: "md:col-span-1" },
];

function ShopHome() {
  const products = useProducts((s) => s.products);
  const categories = useCategories((s) => s.categories);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState("relevance");

  const featured = products.filter((p) => p.active && p.featured).slice(0, 4);
  const filtered = useMemo(() => {
    let result = products.filter((p) => p.active);
    if (query) result = result.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    if (cat) result = result.filter((p) => p.category === cat);
    if (sort === "price-asc") result = [...result].sort((a, b) => (a.promo_price ?? a.price) - (b.promo_price ?? b.price));
    if (sort === "price-desc") result = [...result].sort((a, b) => (b.promo_price ?? b.price) - (a.promo_price ?? a.price));
    return result;
  }, [products, query, cat, sort]);

  const pickCategory = (category: string) => {
    setCat(category);
    document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      <main>
        <section className="relative min-h-[680px] overflow-hidden bg-secondary text-secondary-foreground lg:min-h-[760px]">
          <img src={heroImage} alt="Suplemento premium em estúdio esportivo" width={1280} height={1536} className="absolute inset-0 h-full w-full object-cover object-[68%_46%] opacity-70 lg:left-auto lg:w-[58%] lg:opacity-100" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--secondary)_0%,var(--secondary)_42%,transparent_78%)]" />
          <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-4 pb-16 pt-24 lg:min-h-[760px] lg:items-center lg:pb-20">
            <div className="max-w-3xl">
              <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase text-primary">
                <span className="h-px w-10 bg-primary" /> Performance começa na escolha
              </div>
              <h1 className="max-w-3xl text-5xl uppercase leading-[0.92] sm:text-7xl lg:text-[92px]">
                Suplementação<br /><span className="text-primary">para ir além.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg text-secondary-foreground/70 sm:text-xl">
                Fórmulas selecionadas para força, recuperação e consistência. Sem atalhos. Só evolução.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-13 px-7 font-bold uppercase">
                  <a href="#destaques">Comprar agora <ArrowRight /></a>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 border-secondary-foreground/30 bg-transparent px-7 font-bold uppercase text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary">
                  <a href="#catalogo">Explorar suplementos</a>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-secondary-foreground/65">
                <span className="flex items-center gap-2"><Check className="text-primary" /> Produtos selecionados</span>
                <span className="flex items-center gap-2"><Check className="text-primary" /> Compra protegida</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-4 hidden border-l border-primary/50 pl-4 text-right lg:block">
            <strong className="block font-display text-3xl text-primary">+4,9</strong>
            <span className="text-xs uppercase text-secondary-foreground/60">avaliação média</span>
          </div>
        </section>

        <section className="border-b border-secondary-foreground/10 bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
            {[{ icon: Truck, title: "Frete grátis", copy: "acima de R$ 299" }, { icon: ShieldCheck, title: "Compra segura", copy: "do início ao fim" }, { icon: Sparkles, title: "Seleção premium", copy: "só produtos confiáveis" }, { icon: Dumbbell, title: "Performance", copy: "para todos os objetivos" }].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex min-h-28 items-center gap-3 border-r border-primary-foreground/15 px-4 py-5 last:border-r-0 lg:px-7">
                <Icon className="h-6 w-6 shrink-0" />
                <div><strong className="block text-sm uppercase">{title}</strong><span className="text-xs opacity-70">{copy}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <div className="mb-9 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div><span className="text-xs font-bold uppercase text-muted-foreground">Escolha seu objetivo</span><h2 className="mt-2 text-4xl uppercase sm:text-5xl">O que move você?</h2></div>
            <p className="max-w-sm text-sm text-muted-foreground">Encontre os produtos certos para cada fase do seu treino.</p>
          </div>
          <div className="grid auto-rows-[260px] gap-3 md:grid-cols-4">
            {goals.map((goal) => (
              <button key={goal.title} onClick={() => pickCategory(goal.category)} className={`group relative overflow-hidden text-left ${goal.span}`}>
                <img src={goal.image} alt="" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-secondary-foreground">
                  <span className="mb-2 block text-xs font-bold uppercase text-primary">{goal.category}</span>
                  <h3 className="text-2xl uppercase">{goal.title}</h3><p className="mt-1 text-sm text-secondary-foreground/65">{goal.copy}</p>
                  <ChevronRight className="absolute bottom-6 right-6 text-primary transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="destaques" className="bg-secondary py-16 text-secondary-foreground lg:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-9 flex items-end justify-between gap-5">
              <div><span className="text-xs font-bold uppercase text-primary">Mais escolhidos</span><h2 className="mt-2 text-4xl uppercase sm:text-5xl">Produtos em destaque</h2></div>
              <a href="#catalogo" className="hidden items-center gap-2 text-sm font-bold uppercase text-primary sm:flex">Ver todos <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} dark />)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <div className="relative overflow-hidden bg-primary px-6 py-12 text-primary-foreground md:px-12 lg:py-16">
            <Flame className="absolute -right-8 -top-12 h-64 w-64 opacity-10" />
            <div className="relative max-w-2xl"><span className="text-xs font-bold uppercase">Combo da semana</span><h2 className="mt-2 text-4xl uppercase sm:text-6xl">Mais resultado.<br />Menos desculpa.</h2><p className="mt-4 max-w-lg text-primary-foreground/75">Whey + creatina: a dupla essencial para uma rotina focada em evolução.</p><Button asChild variant="secondary" size="lg" className="mt-7 uppercase"><a href="#catalogo">Montar meu combo <ArrowRight /></a></Button></div>
          </div>
        </section>

        <section id="catalogo" className="mx-auto max-w-7xl px-4 pb-20">
          <div className="mb-8"><span className="text-xs font-bold uppercase text-muted-foreground">Toda a linha</span><h2 className="mt-2 text-4xl uppercase sm:text-5xl">Encontre seu próximo nível</h2></div>
          <div className="mb-7 grid gap-4 border-y py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative max-w-lg"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busque whey, creatina, vitaminas..." className="h-11 pl-10" /></div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 border bg-background px-4 text-sm"><option value="relevance">Mais relevantes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select>
          </div>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2"><Button variant={cat === null ? "default" : "outline"} onClick={() => setCat(null)}>Todos</Button>{categories.map((category) => <Button key={category} variant={cat === category ? "default" : "outline"} onClick={() => setCat(category)}>{category}</Button>)}</div>
          {filtered.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border py-16 text-center text-muted-foreground">Nenhum suplemento encontrado.</div>}
        </section>
      </main>
      <ShopFooter />
    </div>
  );
}