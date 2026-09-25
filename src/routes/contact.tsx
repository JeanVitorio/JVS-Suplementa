import { createFileRoute } from "@tanstack/react-router";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/store";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contato — JVS Modelo" },
    { name: "description", content: "Fale com a JVS Modelo: dúvidas, pedidos e suporte." },
    { property: "og:title", content: "Contato — JVS Modelo" },
  ], links: [{ rel: "canonical", href: "/contact" }] }),
  component: ContactPage,
});

function ContactPage() {
  const s = useSettings((x) => x.settings);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Como podemos ajudar?</h1>
        <p className="mt-2 text-muted-foreground">Respondemos em até 1 dia útil.</p>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <form
            onSubmit={(e) => { e.preventDefault(); toast.success("Mensagem enviada!"); setForm({ name: "", email: "", message: "" }); }}
            className="space-y-4 rounded-xl border bg-card p-6 shadow-soft"
          >
            <Input placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input type="email" placeholder="Seu e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Textarea rows={6} placeholder="Sua mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <Button type="submit" className="w-full">Enviar mensagem</Button>
          </form>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border bg-card p-5"><Mail className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><div className="font-medium">E-mail</div><div className="text-sm text-muted-foreground">{s.email}</div></div></div>
            <div className="flex items-start gap-3 rounded-xl border bg-card p-5"><Phone className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><div className="font-medium">Telefone</div><div className="text-sm text-muted-foreground">{s.whatsapp}</div></div></div>
            <div className="flex items-start gap-3 rounded-xl border bg-card p-5"><MessageCircle className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><div className="font-medium">WhatsApp</div><div className="text-sm text-muted-foreground">Atendimento Seg–Sex, 9h–18h</div></div></div>
            <div className="flex items-start gap-3 rounded-xl border bg-card p-5"><MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><div className="font-medium">Endereço</div><div className="text-sm text-muted-foreground">São Paulo, SP — Brasil</div></div></div>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
