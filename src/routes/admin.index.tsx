import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, CircleDollarSign, Clock3, Package, ShoppingCart, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { useCustomers, useOrders, useProducts } from "@/store";
import { brl, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Central de comando | Bertolleti Performance" },
    { name: "description", content: "Visão operacional da loja Bertolleti Performance." },
    { property: "og:title", content: "Central de comando | Bertolleti Performance" },
    { property: "og:description", content: "Indicadores, pedidos e estoque em uma visão operacional." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const orders = useOrders((state) => state.orders);
  const products = useProducts((state) => state.products);
  const customers = useCustomers((state) => state.customers);
  const revenue = orders.filter((order) => order.status !== "cancelado").reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock <= 20);
  const avgTicket = orders.length ? revenue / orders.length : 0;
  const stats = [
    { label: "Receita no período", value: brl(revenue), change: "+18,4%", icon: CircleDollarSign },
    { label: "Pedidos ativos", value: String(orders.filter((order) => !["entregue", "cancelado"].includes(order.status)).length), change: "+6 hoje", icon: ShoppingCart },
    { label: "Ticket médio", value: brl(avgTicket), change: "+8,2%", icon: TrendingUp },
    { label: "Base de clientes", value: String(customers.length), change: "+12 este mês", icon: Users },
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-bold uppercase text-primary">Segunda-feira, 21 de setembro</p><h1 className="mt-2 text-3xl uppercase md:text-5xl">Operação em alta.</h1><p className="mt-2 text-muted-foreground">Tudo o que importa para vender mais, sem ruído.</p></div>
        <div className="flex gap-2"><Link to="/admin/products/new"><Button variant="outline" className="rounded-sm"><Package className="h-4 w-4" /> Novo produto</Button></Link><Link to="/admin/orders"><Button className="rounded-sm">Ver pedidos <ArrowRight className="h-4 w-4" /></Button></Link></div>
      </section>

      <section className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon }) => <article key={label} className="bg-card p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div><strong className="mt-5 block font-display text-3xl">{value}</strong><span className="mt-2 inline-block bg-primary/15 px-2 py-0.5 text-xs font-bold text-foreground">{change}</span></article>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <article className="border bg-card">
          <header className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-bold uppercase text-muted-foreground">Fluxo ao vivo</p><h2 className="mt-1 text-xl uppercase">Pedidos recentes</h2></div><Link to="/admin/orders" className="text-sm font-bold text-primary">Ver todos</Link></header>
          <div className="divide-y">
            {orders.map((order) => <Link key={order.id} to="/admin/orders/$id" params={{ id: order.id }} className="grid items-center gap-3 p-4 transition hover:bg-muted/40 sm:grid-cols-[1fr_1.4fr_1fr_auto]"><div><strong className="block text-sm">#{order.id.slice(-8).toUpperCase()}</strong><span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span></div><span className="truncate text-sm text-muted-foreground">{order.userEmail}</span><span className="flex items-center gap-1.5 text-xs font-bold uppercase"><Clock3 className="h-3.5 w-3.5 text-primary" />{order.status.replaceAll("_", " ")}</span><strong className="text-right">{brl(order.total)}</strong></Link>)}
          </div>
        </article>

        <article className="bg-secondary p-6 text-secondary-foreground">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-primary">Saúde do estoque</p><h2 className="mt-1 text-xl uppercase">Ação necessária</h2></div><Boxes className="h-6 w-6 text-primary" /></div>
          <div className="my-8"><strong className="font-display text-6xl text-primary">{lowStock.length}</strong><p className="text-sm text-secondary-foreground/50">produtos abaixo do nível ideal</p></div>
          <div className="space-y-2">{lowStock.slice(0, 4).map((product) => <div key={product.id} className="flex items-center gap-3 border border-secondary-foreground/10 p-3"><TriangleAlert className="h-4 w-4 text-warning" /><span className="min-w-0 flex-1 truncate text-sm">{product.name}</span><strong className="text-sm text-primary">{product.stock} un.</strong></div>)}</div>
          <Link to="/admin/stock" className="mt-5 flex items-center justify-between border-t border-secondary-foreground/10 pt-5 text-sm font-bold">Gerenciar estoque <ArrowRight className="h-4 w-4" /></Link>
        </article>
      </section>
    </div>
  );
}