import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSettings } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [f, setF] = useState(settings);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update(f);
    toast.success("Configurações salvas");
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Loja, pagamentos e frete</p>
      </div>

      <Section title="Loja">
        <Field label="Nome da loja" v={f.storeName} on={(v) => setF({ ...f, storeName: v })} />
        <Field label="URL da logo" v={f.logoUrl} on={(v) => setF({ ...f, logoUrl: v })} />
        <div className="sm:col-span-2">
          <Label>Descrição</Label>
          <Textarea value={f.storeDescription} onChange={(e) => setF({ ...f, storeDescription: e.target.value })} rows={3} className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label>Pré-visualização da logo</Label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
            {f.logoUrl ? (
              <img src={f.logoUrl} alt={f.storeName || "Logo da loja"} className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                {(f.storeName || "B").slice(0, 1).toUpperCase()}
              </div>
            )}
            <p className="text-sm text-muted-foreground">Cole a URL da imagem da sua logo para substituir o ícone padrão no cabeçalho e no painel.</p>
          </div>
        </div>
        <Field label="WhatsApp" v={f.whatsapp} on={(v) => setF({ ...f, whatsapp: v })} />
        <Field label="E-mail de contato" v={f.email} on={(v) => setF({ ...f, email: v })} />
      </Section>

      <Section title="PIX">
        <Field label="Chave PIX" v={f.pix_key} on={(v) => setF({ ...f, pix_key: v })} />
        <Field label="Titular" v={f.pix_holder} on={(v) => setF({ ...f, pix_holder: v })} />
      </Section>

      <Section title="Stripe (Cartão)">
        <Field label="Stripe Public Key" v={f.stripe_public_key} on={(v) => setF({ ...f, stripe_public_key: v })} />
        <Field label="Stripe Secret Key" v={f.stripe_secret_key} on={(v) => setF({ ...f, stripe_secret_key: v })} />
        <p className="sm:col-span-2 text-xs text-muted-foreground">Em produção, mova a Secret Key para segredo do servidor (Edge Function) e crie automaticamente o Price no Stripe ao salvar um produto.</p>
      </Section>

      <Section title="Frete">
        <div>
          <Label>Frete fixo (R$)</Label>
          <Input type="number" step="0.01" value={f.shippingFlat} onChange={(e) => setF({ ...f, shippingFlat: Number(e.target.value) })} className="mt-1" />
        </div>
        <div>
          <Label>Frete grátis acima de (R$)</Label>
          <Input type="number" step="0.01" value={f.freeShippingAbove} onChange={(e) => setF({ ...f, freeShippingAbove: Number(e.target.value) })} className="mt-1" />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button size="lg">Salvar configurações</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={v} onChange={(e) => on(e.target.value)} className="mt-1" />
    </div>
  );
}
