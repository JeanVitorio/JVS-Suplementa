import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { useAuth, useCart, useProducts, useSettings, useCoupons, checkout } from "@/store";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, QrCode, Tag } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const router = useRouter();
  const user = useAuth((s) => s.current());
  const items = useCart((s) => s.items);
  const products = useProducts((s) => s.products);
  const settings = useSettings((s) => s.settings);
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    phone: "",
  });
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "", installments: "1" });

  if (!user) {
    router.navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
    return null;
  }

  const rows = items.map((i) => {
    const p = products.find((x) => x.id === i.productId)!;
    const price = p?.promo_price ?? p?.price ?? 0;
    return { ...i, product: p, price, lineTotal: price * i.quantity };
  }).filter(r => r.product);

  if (rows.length === 0) {
    return (
      <div className="min-h-screen">
        <ShopHeader />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="mb-4 text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/"><Button>Voltar à loja</Button></Link>
        </div>
      </div>
    );
  }

  const subtotal = rows.reduce((s, r) => s + r.lineTotal, 0);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const validateCoupon = useCoupons((s) => s.validate);
  const discount = appliedCoupon?.discount ?? 0;
  const shipping = subtotal - discount >= settings.freeShippingAbove ? 0 : settings.shippingFlat;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyCoupon = () => {
    const res = validateCoupon(couponInput, subtotal);
    if (!res.ok) return toast.error(res.error);
    setAppliedCoupon({ code: res.coupon.code, discount: res.discount });
    toast.success(`Cupom ${res.coupon.code} aplicado`);
  };

  const submit = async () => {
    if (!form.name || !form.cep || !form.street || !form.number || !form.city || !form.state || !form.phone) {
      toast.error("Preencha o endereço completo"); return;
    }
    if (method === "card" && (!card.number || !card.name || !card.exp || !card.cvv)) {
      toast.error("Preencha os dados do cartão"); return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const res = checkout({
      userId: user.id, userEmail: user.email,
      address: { ...form }, paymentMethod: method,
      couponCode: appliedCoupon?.code,
    });
    setSubmitting(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Pedido criado!");
    router.navigate({ to: "/checkout/success", search: { id: res.order.id } as never });
  };

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 font-semibold">Endereço de entrega</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome completo" v={form.name} onChange={(v) => setForm({ ...form, name: v })} className="sm:col-span-2" />
                <Field label="CEP" v={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />
                <Field label="Telefone" v={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <Field label="Rua" v={form.street} onChange={(v) => setForm({ ...form, street: v })} className="sm:col-span-2" />
                <Field label="Número" v={form.number} onChange={(v) => setForm({ ...form, number: v })} />
                <Field label="Complemento" v={form.complement} onChange={(v) => setForm({ ...form, complement: v })} />
                <Field label="Bairro" v={form.district} onChange={(v) => setForm({ ...form, district: v })} />
                <Field label="Cidade" v={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="Estado" v={form.state} onChange={(v) => setForm({ ...form, state: v })} />
              </div>
            </section>

            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 font-semibold">Pagamento</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setMethod("pix")} className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${method === "pix" ? "border-foreground bg-muted/40" : "hover:bg-muted/30"}`}>
                  <QrCode className="h-5 w-5" />
                  <div>
                    <div className="font-medium">PIX</div>
                    <div className="text-xs text-muted-foreground">Aprovação imediata</div>
                  </div>
                </button>
                <button onClick={() => setMethod("card")} className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${method === "card" ? "border-foreground bg-muted/40" : "hover:bg-muted/30"}`}>
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Cartão de crédito</div>
                    <div className="text-xs text-muted-foreground">Em até 12x</div>
                  </div>
                </button>
              </div>

              {method === "card" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Número do cartão" v={card.number} onChange={(v) => setCard({ ...card, number: v })} className="sm:col-span-2" />
                  <Field label="Nome impresso" v={card.name} onChange={(v) => setCard({ ...card, name: v })} className="sm:col-span-2" />
                  <Field label="Validade (MM/AA)" v={card.exp} onChange={(v) => setCard({ ...card, exp: v })} />
                  <Field label="CVV" v={card.cvv} onChange={(v) => setCard({ ...card, cvv: v })} />
                  <div className="sm:col-span-2">
                    <Label>Parcelas</Label>
                    <select value={card.installments} onChange={(e) => setCard({ ...card, installments: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}x de {brl(total / n)} sem juros</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Seu pedido</h2>
            <div className="space-y-3 text-sm">
              {rows.map((r) => (
                <div key={r.productId} className="flex gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={r.product.images[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="line-clamp-1 font-medium">{r.product.name}</div>
                    <div className="text-xs text-muted-foreground">Qtd {r.quantity}</div>
                  </div>
                  <div className="font-medium">{brl(r.lineTotal)}</div>
                </div>
              ))}
              <div className="my-3 border-t" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Cupom" className="pl-9 h-9" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={applyCoupon}>Aplicar</Button>
              </div>
              <div className="my-3 border-t" />
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>Desconto ({appliedCoupon?.code})</span><span>-{brl(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shipping === 0 ? "Grátis" : brl(shipping)}</span></div>
              <div className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{brl(total)}</span></div>
            </div>
            <Button className="mt-5 w-full" size="lg" disabled={submitting} onClick={submit}>
              {submitting ? "Processando..." : `Pagar ${brl(total)}`}
            </Button>
          </aside>
        </div>
      </div>
      <ShopFooter />
    </div>
  );
}

function Field({ label, v, onChange, className }: { label: string; v: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input value={v} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}
