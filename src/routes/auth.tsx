import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
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
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const loading = useAuth((s) => s.loading);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = mode === "login"
      ? await login(form.email, form.password)
      : await register(form);
    if (!res.ok) return toast.error(res.error ?? "Erro");
    toast.success(mode === "login" ? "Bem-vindo!" : "Conta criada!");
    router.navigate({ to: redirect as never });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted/20 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-soft">
        <h1 className="mb-1 text-2xl font-bold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "login" ? "Acesse sua conta" : "Cadastre-se em segundos"}
        </p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
        <Link to="/" className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground">Voltar à loja</Link>
      </div>
    </div>
  );
}
