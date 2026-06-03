import { createFileRoute, Link } from "@tanstack/react-router";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { useOrders, useSettings } from "@/store";
import { brl, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) ?? "" }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useSearch();
  const order = useOrders((s) => s.orders.find((o) => o.id === id));
  const settings = useSettings((s) => s.settings);

  if (!order) {
    return (
      <div className="min-h-screen">
        <ShopHeader />
        <div className="mx-auto max-w-3xl p-12 text-center">
          <p className="text-muted-foreground">Pedido não encontrado.</p>
          <Link to="/" className="mt-4 inline-block"><Button>Voltar à loja</Button></Link>
        </div>
      </div>
    );
  }

  const isPix = order.paymentMethod === "pix";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(order.pixCode ?? "")}`;

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Pedido confirmado!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido #{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}
          </p>
        </div>

        {isPix && (
          <div className="mt-6 rounded-xl border bg-card p-6">
            <div className="mb-3 flex items-center gap-2 font-semibold"><QrCode className="h-5 w-5" /> Pague com PIX</div>
            <div className="grid items-center gap-6 sm:grid-cols-[260px_1fr]">
              <img src={qrUrl} alt="QR PIX" className="rounded-lg border bg-white p-2" />
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Valor</div>
                  <div className="text-xl font-bold">{brl(order.total)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Chave PIX</div>
                  <div className="font-medium">{settings.pix_key}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">PIX Copia e Cola</div>
                  <div className="mt-1 break-all rounded-md bg-muted p-2 text-xs">{order.pixCode}</div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard.writeText(order.pixCode ?? ""); toast.success("Código copiado"); }}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Copiar código
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Após o pagamento, o status do pedido será atualizado automaticamente.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Itens</h2>
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex gap-3 text-sm">
                <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                  {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">Qtd {it.quantity}</div>
                </div>
                <div className="font-medium">{brl(it.price * it.quantity)}</div>
              </div>
            ))}
            <div className="my-3 border-t" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{brl(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span>{order.shipping === 0 ? "Grátis" : brl(order.shipping)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{brl(order.total)}</span></div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link to="/account" className="flex-1"><Button variant="outline" className="w-full">Meus pedidos</Button></Link>
          <Link to="/" className="flex-1"><Button className="w-full">Continuar comprando</Button></Link>
        </div>
      </div>
      <ShopFooter />
    </div>
  );
}
