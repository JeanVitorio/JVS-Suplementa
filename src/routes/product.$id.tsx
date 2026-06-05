import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { useProducts, useCart, useAuth, useReviews } from "@/store";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, ShieldCheck, Truck, RotateCcw, ChevronLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const product = useProducts((s) => s.products.find((p) => p.id === id));
  const related = useProducts((s) => s.products.filter((p) => p.id !== id && p.active).slice(0, 4));
  const add = useCart((s) => s.add);
  const user = useAuth((s) => s.current());
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen">
        <ShopHeader />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Produto não encontrado</h1>
          <Link to="/" className="mt-4 inline-block text-sm underline">Voltar à loja</Link>
        </div>
      </div>
    );
  }

  const price = product.promo_price ?? product.price;
  const hasPromo = product.promo_price != null && product.promo_price < product.price;
  const out = product.stock <= 0;

  const buyNow = () => {
    if (out) return;
    add(product.id, qty);
    if (!user) router.navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
    else router.navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <button onClick={() => router.history.back()} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <img src={product.images[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`aspect-square w-20 overflow-hidden rounded-md border-2 transition ${i === imgIdx ? "border-foreground" : "border-transparent opacity-70"}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">{product.category} · SKU {product.sku}</div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

            <div className="flex items-end gap-3">
              {hasPromo && <span className="text-base text-muted-foreground line-through">{brl(product.price)}</span>}
              <span className="text-3xl font-bold">{brl(price)}</span>
              {hasPromo && (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                  -{Math.round((1 - (product.promo_price as number) / product.price) * 100)}%
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              ou 12x de {brl(price / 12)} sem juros
            </div>

            <p className="leading-relaxed text-foreground/80">{product.description}</p>

            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              {out ? (
                <span className="font-medium text-destructive">Produto esgotado</span>
              ) : product.stock <= 5 ? (
                <span className="font-medium text-warning">Últimas {product.stock} unidades</span>
              ) : (
                <span className="text-muted-foreground">{product.stock} unidades em estoque</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-md border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-muted" aria-label="-">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 hover:bg-muted" aria-label="+">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1" disabled={out} onClick={buyNow}>Comprar agora</Button>
              <Button size="lg" variant="outline" disabled={out} onClick={() => { add(product.id, qty); toast.success("Adicionado ao carrinho"); }}>
                Carrinho
              </Button>
            </div>

            <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Envio rápido</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Compra segura</div>
              <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Troca em 30d</div>
            </div>
          </div>
        </div>

        <ReviewsSection productId={product.id} />

        <div className="mt-16">
          <h2 className="mb-4 text-xl font-bold">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
      <ShopFooter />
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const user = useAuth((s) => s.current());
  const reviews = useReviews((s) => s.reviews.filter((r) => r.productId === productId));
  const addReview = useReviews((s) => s.add);
  const avg = useReviews((s) => s.avg(productId));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <div className="mt-16 grid gap-8 md:grid-cols-[1fr_2fr]">
      <div>
        <h2 className="text-xl font-bold">Avaliações</h2>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < Math.round(avg.score) ? "fill-warning text-warning" : "text-muted-foreground"}`} />
          ))}</div>
          <span className="text-sm font-medium">{avg.count > 0 ? avg.score.toFixed(1) : "—"}</span>
          <span className="text-sm text-muted-foreground">({avg.count})</span>
        </div>
        {user ? (
          <form
            className="mt-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return toast.error("Escreva um comentário");
              addReview({ productId, userId: user.id, userName: user.name, rating, comment });
              setComment(""); setRating(5);
              toast.success("Avaliação enviada");
            }}
          >
            <div className="flex gap-1">{Array.from({ length: 5 }).map((_, i) => (
              <button type="button" key={i} onClick={() => setRating(i + 1)}>
                <Star className={`h-6 w-6 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              </button>
            ))}</div>
            <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Conte sua experiência..." />
            <Button type="submit" size="sm">Publicar</Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground"><Link to="/auth" className="underline">Entre</Link> para avaliar.</p>
        )}
      </div>
      <div className="space-y-3">
        {reviews.length === 0 && <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">Seja o primeiro a avaliar.</div>}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              ))}</div>
              <span className="text-sm font-medium">{r.userName}</span>
              <span className="text-xs text-muted-foreground">· {new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
            <p className="mt-1 text-sm text-foreground/80">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
