import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { useCart, useProducts, useSettings, useAuth } from "@/store";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const products = useProducts((s) => s.products);
  const settings = useSettings((s) => s.settings);
  const user = useAuth((s) => s.current());

  const rows = items.map((i) => {
    const p = products.find((x) => x.id === i.productId)!;
    const price = p?.promo_price ?? p?.price ?? 0;
    return { ...i, product: p, price, lineTotal: price * i.quantity };
  }).filter(r => r.product);

  const subtotal = rows.reduce((s, r) => s + r.lineTotal, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= settings.freeShippingAbove ? 0 : settings.shippingFlat;
  const total = subtotal + shipping;

  const goCheckout = () => {
    if (!user) router.navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
    else router.navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Carrinho</h1>

        {rows.length === 0 ? (
          <div className="grid place-items-center rounded-xl border bg-muted/20 p-16 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">Seu carrinho está vazio.</p>
            <Link to="/"><Button>Explorar produtos</Button></Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.productId} className="flex gap-4 rounded-xl border bg-card p-4">
                  <Link to="/product/$id" params={{ id: r.product.id }} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={r.product.images[0]} alt="" className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link to="/product/$id" params={{ id: r.product.id }} className="font-medium hover:underline">{r.product.name}</Link>
                      <button onClick={() => remove(r.productId)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.product.category}</div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-md border">
                        <button onClick={() => setQty(r.productId, r.quantity - 1)} className="p-1.5 hover:bg-muted"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm">{r.quantity}</span>
                        <button onClick={() => setQty(r.productId, Math.min(r.product.stock, r.quantity + 1))} className="p-1.5 hover:bg-muted"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="font-semibold">{brl(r.lineTotal)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-xl border bg-card p-5 shadow-soft">
              <h2 className="mb-4 font-semibold">Resumo</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shipping === 0 ? "Grátis" : brl(shipping)}</span></div>
                <div className="my-3 border-t" />
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{brl(total)}</span></div>
                <div className="text-xs text-muted-foreground">em até 12x de {brl(total / 12)}</div>
              </div>
              <Button className="mt-4 w-full" size="lg" onClick={goCheckout}>Finalizar compra</Button>
              <Link to="/" className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground">Continuar comprando</Link>
            </aside>
          </div>
        )}
      </div>
      <ShopFooter />
    </div>
  );
}
