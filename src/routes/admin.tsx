import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, useSettings } from "@/store";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Store,
  Tag,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Produtos", icon: Package },
  { to: "/admin/stock", label: "Estoque", icon: Boxes },
  { to: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/customers", label: "Clientes", icon: Users },
  { to: "/admin/coupons", label: "Cupons", icon: Tag },
  { to: "/admin/reviews", label: "Avaliações", icon: MessageSquare },
  { to: "/admin/settings", label: "Configurações", icon: SettingsIcon },
];

function AdminLayout() {
  const router = useRouter();
  const loc = useLocation();
  const user = useAuth((s) => s.current());
  const initialized = useAuth((s) => s.initialized);
  const logout = useAuth((s) => s.logout);
  const settings = useSettings((s) => s.settings);

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.navigate({ to: "/auth", search: { redirect: "/admin" } as never });
    else if (user.role !== "admin") router.navigate({ to: "/" });
  }, [user, router, initialized]);

  if (!initialized) return null;
  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-sidebar p-4 md:block">
        <Link to="/admin" className="mb-6 flex items-center gap-2">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.storeName || "Logo da loja"}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              {(settings.storeName || "B").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold leading-tight">
              {settings.storeName || "Bertolleti"}
            </div>
            <div className="text-xs text-muted-foreground">Painel Admin</div>
          </div>
        </Link>
        <nav className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-4 bottom-4 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60"
          >
            <Store className="h-4 w-4" /> Ver loja
          </Link>
          <button
            onClick={() => {
              logout();
              router.navigate({ to: "/" });
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b bg-background p-3 md:hidden">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs",
                active ? "bg-foreground text-background" : "bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </Link>
          );
        })}
      </header>

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
