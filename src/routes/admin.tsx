import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Bell, Boxes, ChevronRight, FolderTree, LayoutDashboard, LogOut, Menu, MessageSquare, Package, Search, Settings, ShoppingCart, Store, Tag, Users, X } from "lucide-react";
import { useAuth } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/products", label: "Produtos", icon: Package },
  { to: "/admin/stock", label: "Estoque", icon: Boxes },
  { to: "/admin/categories", label: "Categorias", icon: FolderTree },
  { to: "/admin/customers", label: "Clientes", icon: Users },
  { to: "/admin/coupons", label: "Cupons", icon: Tag },
  { to: "/admin/reviews", label: "Avaliações", icon: MessageSquare },
  { to: "/admin/settings", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const router = useRouter();
  const location = useLocation();
  const user = useAuth((state) => state.currentUser);
  const initialized = useAuth((state) => state.initialized);
  const logout = useAuth((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = NAV.find((item) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to));

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.navigate({ to: "/auth", search: { redirect: "/admin" } as never });
    else if (user.role !== "admin") router.navigate({ to: "/account" });
  }, [user, initialized, router]);

  if (!initialized || !user || user.role !== "admin") return null;

  const side = (
    <div className="flex h-full flex-col bg-secondary text-secondary-foreground">
      <div className="flex h-20 items-center justify-between border-b border-secondary-foreground/10 px-5">
        <Link to="/admin" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center bg-primary font-display text-lg text-primary-foreground">B</span>
          <span><strong className="block font-display text-sm uppercase">Bertolleti</strong><small className="block text-[10px] font-bold uppercase text-primary">Performance OS</small></span>
        </Link>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase text-secondary-foreground/35">Operação da loja</p>
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return <Link key={to} to={to} onClick={() => setMobileOpen(false)} className={cn("group flex h-11 items-center gap-3 border-l-2 px-3 text-sm font-semibold transition", active ? "border-primary bg-primary/10 text-primary" : "border-transparent text-secondary-foreground/55 hover:bg-secondary-foreground/5 hover:text-secondary-foreground")}><Icon className="h-[18px] w-[18px]" />{label}<ChevronRight className={cn("ml-auto h-4 w-4 opacity-0 transition", active && "opacity-100")} /></Link>;
        })}
      </nav>
      <div className="border-t border-secondary-foreground/10 p-3">
        <Link to="/" className="flex h-10 items-center gap-3 px-3 text-sm text-secondary-foreground/55 hover:text-primary"><Store className="h-4 w-4" /> Ver loja</Link>
        <Button variant="ghost" className="h-10 w-full justify-start gap-3 rounded-none px-3 text-secondary-foreground/55 hover:bg-destructive/10 hover:text-destructive" onClick={async () => { await logout(); await router.navigate({ to: "/auth", search: { redirect: "/" }, replace: true }); }}><LogOut className="h-4 w-4" /> Sair</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{side}</aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><Button type="button" variant="ghost" aria-label="Fechar menu" className="absolute inset-0 h-full w-full rounded-none bg-secondary/80 p-0 hover:bg-secondary/80" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-72">{side}</aside></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase text-muted-foreground">Central de comando</p><p className="truncate font-display text-sm uppercase">{current?.label ?? "Gestão"}</p></div>
          <div className="relative ml-auto hidden w-full max-w-xs md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 bg-card pl-9" placeholder="Buscar na operação..." /></div>
          <Button variant="outline" size="icon" className="relative"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 bg-primary" /></Button>
          <div className="hidden items-center gap-3 border-l pl-4 sm:flex"><span className="grid h-9 w-9 place-items-center bg-secondary text-sm font-bold text-primary">{user.name.slice(0, 1)}</span><span><strong className="block text-sm leading-none">{user.name}</strong><small className="text-xs text-muted-foreground">Administrador</small></span></div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}