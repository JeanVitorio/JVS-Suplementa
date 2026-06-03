import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useOrders } from "@/store";
import { brl, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersList,
});

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  aguardando_pagamento: { label: "Aguardando", cls: "bg-warning/15 text-warning" },
  pago: { label: "Pago", cls: "bg-success/15 text-success" },
  preparando: { label: "Preparando", cls: "bg-accent text-accent-foreground" },
  enviado: { label: "Enviado", cls: "bg-accent text-accent-foreground" },
  entregue: { label: "Entregue", cls: "bg-success/15 text-success" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/15 text-destructive" },
};

function OrdersList() {
  const orders = useOrders((s) => s.orders);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  let rows = orders;
  if (q) rows = rows.filter(o => o.id.includes(q) || o.userEmail.toLowerCase().includes(q.toLowerCase()));
  if (status) rows = rows.filter(o => o.status === status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos no total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ID ou e-mail..." className="pl-9" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Pedido</th>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Pagamento</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const st = STATUS[o.status];
              return (
                <tr key={o.id} className="cursor-pointer border-t hover:bg-muted/30">
                  <td className="p-3 font-medium"><Link to="/admin/orders/$id" params={{ id: o.id }}>#{o.id.slice(-8).toUpperCase()}</Link></td>
                  <td className="p-3 text-muted-foreground">{o.userEmail}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="p-3 text-muted-foreground">{o.paymentMethod === "pix" ? "PIX" : "Cartão"}</td>
                  <td className="p-3 text-center"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                  <td className="p-3 text-right font-semibold">{brl(o.total)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhum pedido.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
