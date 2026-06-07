import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Search, User as UserIcon, LogOut, LayoutDashboard, Package, Menu, X, Heart } from "lucide-react";
import { useAuth, useCart, useSettings } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShopHeader() {
  const router = useRouter();
  const user = useAuth((s) => s.current());
  const logout = useAuth((s) => s.logout);
  const settings = useSettings((s) => s.settings);
  const count = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/", search: { q } as never });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.storeName || "Logo da loja"} className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              {(settings.storeName || "B").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="hidden text-base font-semibold tracking-tight sm:inline">{settings.storeName || "Bertolleti Shop"}</span>
        </Link>

        <form onSubmit={submit} className="relative ml-auto hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos..."
            className="pl-9"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/favorites" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" aria-label="Favoritos"><Heart className="h-5 w-5" /></Button>
          </Link>
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.navigate({ to: "/account" })}>
                  <Package className="mr-2 h-4 w-4" /> Meus pedidos
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => router.navigate({ to: "/admin" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Painel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t p-4 md:hidden">
          <form onSubmit={submit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </form>
        </div>
      )}
    </header>
  );
}

export function ShopFooter() {
  const settings = useSettings((s) => s.settings);

  return (
    <footer className="mt-20 border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.storeName || "Logo da loja"} className="h-8 w-8 rounded-md object-cover" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
                {(settings.storeName || "B").slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="font-semibold">{settings.storeName || "Bertolleti Shop"}</span>
          </div>
          <p className="text-sm text-muted-foreground">{settings.storeDescription || "Curadoria premium em produtos para uma vida com mais design."}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Loja</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/">Todos os produtos</Link></li>
            <li><Link to="/favorites">Favoritos</Link></li>
            <li><Link to="/cart">Carrinho</Link></li>
            <li><Link to="/account">Minha conta</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Empresa</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about">Sobre</Link></li>
            <li><Link to="/contact">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Atendimento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{settings.email || "contato@bertolleti.com"}</li>
            <li>Seg–Sex, 9h–18h</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Pagamento</h4>
          <p className="text-sm text-muted-foreground">PIX, cartão de crédito em até 12x.</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings.storeName || "Bertolleti Shop"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
