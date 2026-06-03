import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { useAuth, useOrders } from "@/store";
import { brl, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  aguardando_pagamento: { label: "Aguardando pagamento", cls: "bg-warning/15 text-warning" },
  pago: { label: "Pago", cls: "bg-success/15 text-success" },
  preparando: { label: "Preparando", cls: "bg-accent text-accent-foreground" },
  enviado: { label: "Enviado", cls: "bg-accent text-accent-foreground" },
  entregue: { label: "Entregue", cls: "bg-success/15 text-success" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/15 text-destructive" },
};

function AccountPage() {
  const router = useRouter();
  const user = useAuth((s) => s.current());
  const orders = useOrders((s) => (user ? s.orders.filter((o) => o.userId === user.id) : []));

  useEffect(() => {
    if (!user) router.navigate({ to: "/auth", search: { redirect: "/account" } as never });
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <h2 className="mb-3 font-semibold">Seus pedidos</h2>
        {orders.length === 0 ? (
          <div className="rounded-xl border bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground">Você ainda não fez pedidos.</p>
            <Link to="/" className="mt-4 inline-block"><Button>Explorar produtos</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_LABEL[o.status];
              return (
                <div key={o.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Pedido #{o.id.slice(-8).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.items.length} {o.items.length === 1 ? "item" : "itens"}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="my-3 flex gap-2 overflow-x-auto">
                    {o.items.slice(0, 5).map((it) => (
                      <div key={it.id} className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{o.paymentMethod === "pix" ? "PIX" : "Cartão"}</span>
                    <div className="font-semibold">{brl(o.total)}</div>
                  </div>
                  {o.status === "aguardando_pagamento" && (
                    <Link to="/checkout/success" search={{ id: o.id } as never} className="mt-3 inline-block text-sm font-medium underline">Ver PIX para pagamento</Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ShopFooter />
    </div>
  );
}
