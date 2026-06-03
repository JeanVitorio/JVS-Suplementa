import { createFileRoute, Link } from "@tanstack/react-router";
import { useOrders } from "@/store";
import { brl, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders/$id")({
  component: OrderDetail,
});

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "aguardando_pagamento", label: "Aguardando pagamento" },
  { value: "pago", label: "Pago" },
  { value: "preparando", label: "Preparando" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

function OrderDetail() {
  const { id } = Route.useParams();
  const order = useOrders((s) => s.orders.find((o) => o.id === id));
  const setStatus = useOrders((s) => s.setStatus);

  if (!order) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Link to="/admin/orders" className="mt-4 inline-block"><Button>Voltar</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Pedidos
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)} · {order.userEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <select
            value={order.status}
            onChange={(e) => { setStatus(order.id, e.target.value as OrderStatus); toast.success("Status atualizado"); }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Itens</h2>
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex gap-3 text-sm">
                <div className="h-14 w-14 overflow-hidden rounded-md bg-muted">
                  {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.quantity} × {brl(it.price)}</div>
                </div>
                <div className="font-semibold">{brl(it.price * it.quantity)}</div>
              </div>
            ))}
            <div className="my-3 border-t" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{brl(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span>{order.shipping === 0 ? "Grátis" : brl(order.shipping)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{brl(order.total)}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 text-sm">
            <h3 className="mb-2 font-semibold">Pagamento</h3>
            <div className="text-muted-foreground">{order.paymentMethod === "pix" ? "PIX" : "Cartão de crédito"}</div>
            {order.pixCode && (
              <div className="mt-2 break-all rounded-md bg-muted p-2 text-xs">{order.pixCode}</div>
            )}
          </div>
          <div className="rounded-xl border bg-card p-5 text-sm">
            <h3 className="mb-2 font-semibold">Entrega</h3>
            <div>{order.address.name}</div>
            <div className="text-muted-foreground">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` — ${order.address.complement}` : ""}<br />
              {order.address.district} · {order.address.city}/{order.address.state}<br />
              CEP {order.address.cep}<br />
              {order.address.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
