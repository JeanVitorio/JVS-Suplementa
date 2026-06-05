import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useOrders, useProducts, useCustomers } from "@/store";
import { brl, formatDate } from "@/lib/format";
import { ShoppingCart, Package, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const orders = useOrders((s) => s.orders);
  const loadOrders = useOrders((s) => s.load);
  const products = useProducts((s) => s.products);
  const users = useCustomers((s) => s.customers);
  const loadCustomers = useCustomers((s) => s.load);

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, [loadOrders, loadCustomers]);

  const revenue = orders.filter(o => o.status !== "cancelado").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === "aguardando_pagamento").length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);
  const out = products.filter(p => p.stock === 0);
  const clients = users.length;

  const stats = [
    { label: "Faturamento", value: brl(revenue), icon: DollarSign, sub: `${orders.length} pedidos` },
    { label: "Pedidos pendentes", value: String(pending), icon: ShoppingCart, sub: "Aguardando pagamento" },
    { label: "Produtos ativos", value: String(products.filter(p => p.active).length), icon: Package, sub: `${products.length} no total` },
    { label: "Clientes", value: String(clients), icon: Users, sub: "Cadastrados" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua loja</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Pedidos recentes</h2>
            <Link to="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">Ver todos</Link>
          </div>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda.</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 6).map((o) => (
                <Link key={o.id} to="/admin/orders/$id" params={{ id: o.id }} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50">
                  <div>
                    <div className="text-sm font-medium">#{o.id.slice(-8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{o.userEmail} · {formatDate(o.createdAt)}</div>
                  </div>
                  <div className="font-semibold">{brl(o.total)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Atenção em estoque</h2>
            <Link to="/admin/stock" className="text-sm text-muted-foreground hover:text-foreground">Gerenciar</Link>
          </div>
          {lowStock.length === 0 && out.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tudo certo por aqui ✨</p>
          ) : (
            <div className="space-y-2">
              {out.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">{p.name}</span>
                  </div>
                  <span className="text-xs font-medium text-destructive">Esgotado</span>
                </div>
              ))}
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    <span className="text-sm">{p.name}</span>
                  </div>
                  <span className="text-xs font-medium text-warning">{p.stock} restantes</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
