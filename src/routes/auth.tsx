import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "@/store";
import { MOCK_CREDENTIALS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === "string" ? search.redirect : "/" }),
  head: () => ({ meta: [
    { title: "Acessar conta | Bertolleti Performance" },
    { name: "description", content: "Acesse a demonstração da loja ou do painel Bertolleti Performance." },
    { property: "og:title", content: "Acessar conta | Bertolleti Performance" },
    { property: "og:description", content: "Entrada segura para clientes e administração da loja." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

type Access = "client" | "admin";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const login = useAuth((state) => state.login);
  const loading = useAuth((state) => state.loading);
  const [access, setAccess] = useState<Access>(redirect.startsWith("/admin") ? "admin" : "client");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const fillDemo = (kind: Access) => {
    setAccess(kind);
    setForm(MOCK_CREDENTIALS[kind]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await login(form.email, form.password);
    if (!result.ok) return toast.error(result.error ?? "Não foi possível entrar.");
    const role = useAuth.getState().currentUser?.role;
    const destination = role === "admin" ? "/admin" : redirect.startsWith("/admin") ? "/account" : redirect;
    toast.success(role === "admin" ? "Painel liberado." : "Bem-vindo de volta!");
    await router.navigate({ to: destination as never, replace: true });
  };

  return (
    <main className="min-h-screen bg-secondary text-secondary-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-secondary-foreground/10 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <Link to="/" className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center bg-primary font-display text-xl text-primary-foreground">B</span>
            <span className="font-display text-lg uppercase">Bertolleti Performance</span>
          </Link>

          <div className="relative max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Área de performance
            </div>
            <h1 className="text-5xl uppercase leading-[1.02] xl:text-7xl">Controle sua evolução.</h1>
            <p className="mt-6 max-w-lg text-lg text-secondary-foreground/60">Acompanhe pedidos, favoritos e entregas. Na gestão, veja a operação inteira sem perder o ritmo.</p>
            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-secondary-foreground/10 bg-secondary-foreground/10">
              {["Pedidos em tempo real", "Estoque sob controle", "Experiência exclusiva", "Dados protegidos"].map((item) => (
                <div key={item} className="flex items-center gap-2 bg-secondary p-4 text-sm font-semibold"><Check className="h-4 w-4 text-primary" />{item}</div>
              ))}
            </div>
          </div>
          <p className="relative text-xs uppercase text-secondary-foreground/35">Ambiente demonstrativo · nenhum dado bancário</p>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground sm:px-10">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center bg-secondary font-display text-lg text-primary">B</span>
              <span className="font-display text-sm uppercase">Bertolleti Performance</span>
            </Link>
            <div className="mb-8">
              <span className="text-xs font-bold uppercase text-muted-foreground">Acesso exclusivo</span>
              <h2 className="mt-2 text-4xl uppercase">Entre na sua conta</h2>
              <p className="mt-2 text-muted-foreground">Escolha o perfil e use o acesso de demonstração.</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 bg-muted p-1">
              <Button type="button" variant={access === "client" ? "default" : "ghost"} onClick={() => fillDemo("client")} className="h-12 rounded-sm">
                <UserRound className="h-4 w-4" /> Cliente
              </Button>
              <Button type="button" variant={access === "admin" ? "default" : "ghost"} onClick={() => fillDemo("admin")} className="h-12 rounded-sm">
                <ShieldCheck className="h-4 w-4" /> Administração
              </Button>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="voce@exemplo.com" className="h-12 bg-card" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Sua senha" className="h-12 bg-card pr-12" required />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((current) => !current)} className="absolute right-1 top-1 h-10 w-10" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="h-13 w-full rounded-sm text-sm font-bold uppercase" disabled={loading}>
                {loading ? "Liberando acesso..." : <>Entrar agora <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <div className="mt-6 border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Acesso preenchido automaticamente</p>
                  <p className="mt-1 text-xs text-muted-foreground">Clique em Cliente ou Administração para testar cada experiência.</p>
                </div>
              </div>
            </div>
            <Link to="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ShoppingBag className="h-4 w-4" /> Voltar para a loja</Link>
          </div>
        </section>
      </div>
    </main>
  );
}