import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { useAuth } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) ?? "/" }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = tab === "login" ? login(email, password) : register({ name, email, password });
    setLoading(false);
    if (!res.ok) return toast.error(res.error!);
    toast.success(tab === "login" ? "Bem-vindo de volta!" : "Conta criada!");
    router.navigate({ to: redirect });
  };

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-xl border bg-card p-6 shadow-soft">
          <div className="mb-5 flex gap-2 rounded-lg bg-muted p-1">
            <button onClick={() => setTab("login")} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === "login" ? "bg-background shadow-soft" : "text-muted-foreground"}`}>Entrar</button>
            <button onClick={() => setTab("register")} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === "register" ? "bg-background shadow-soft" : "text-muted-foreground"}`}>Criar conta</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {tab === "register" && (
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
              </div>
            )}
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">Contas demo</div>
            <div>Admin: <code>admin@bertolleti.com</code> / <code>admin123</code></div>
            <div>Cliente: <code>cliente@bertolleti.com</code> / <code>cliente123</code></div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">← Voltar à loja</Link>
        </p>
      </div>
      <ShopFooter />
    </div>
  );
}
