import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useSettings, uploadStoreLogo } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2, Shield, Copy } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [f, setF] = useState(settings);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/stripe-webhook`
      : "/api/public/stripe-webhook";

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update(f);
    toast.success("Configurações salvas");
  };

  const onLogoFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadStoreLogo(file);
    setUploading(false);
    if (!url) {
      toast.error("Falha ao subir a logo. Crie o bucket 'store-assets' rodando o SQL v4.");
      return;
    }
    setF((p) => ({ ...p, logoUrl: url }));
    toast.success("Logo enviada!");
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Loja, pagamentos e frete</p>
      </div>

      <Section title="Loja">
        <Field label="Nome da loja" v={f.storeName} on={(v) => setF({ ...f, storeName: v })} />
        <Field label="WhatsApp" v={f.whatsapp} on={(v) => setF({ ...f, whatsapp: v })} />
        <div className="sm:col-span-2">
          <Label>Descrição</Label>
          <Textarea
            value={f.storeDescription}
            onChange={(e) => setF({ ...f, storeDescription: e.target.value })}
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="sm:col-span-2">
          <Label>Logo da loja</Label>
          <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border bg-muted/20 p-4">
            {f.logoUrl ? (
              <img
                src={f.logoUrl}
                alt={f.storeName || "Logo"}
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-border"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground">
                {(f.storeName || "B").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> {f.logoUrl ? "Trocar logo" : "Enviar logo"}
                  </>
                )}
              </Button>
              {f.logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setF((p) => ({ ...p, logoUrl: "" }))}
                >
                  Remover
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                PNG/JPG/SVG. Recomendado 512×512. Armazenada no bucket <code>store-assets</code>.
              </p>
            </div>
          </div>
        </div>

        <Field label="E-mail de contato" v={f.email} on={(v) => setF({ ...f, email: v })} />
      </Section>

      <Section title="PIX">
        <Field label="Chave PIX" v={f.pix_key} on={(v) => setF({ ...f, pix_key: v })} />
        <Field label="Titular" v={f.pix_holder} on={(v) => setF({ ...f, pix_holder: v })} />
      </Section>

      <Section title="Stripe (Cartão de crédito)">
        <Field
          label="Stripe Publishable Key (pk_...)"
          v={f.stripe_public_key}
          on={(v) => setF({ ...f, stripe_public_key: v })}
        />
        <div className="sm:col-span-2 flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="space-y-2">
            <p>
              A <strong>Secret Key</strong> (sk_...) e a <strong>Webhook Secret</strong> (whsec_...)
              <strong> NÃO</strong> ficam no banco — elas são salvas como Lovable Secrets (variáveis
              de ambiente do servidor). Peça ao agente para configurar
              <code className="mx-1 rounded bg-background px-1 py-0.5">STRIPE_SECRET_KEY</code>e
              <code className="mx-1 rounded bg-background px-1 py-0.5">STRIPE_WEBHOOK_SECRET</code>.
            </p>
            <div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                URL do Webhook (cole no Stripe Dashboard)
              </div>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">
                  {webhookUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.success("Copiado!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Entrega">
        <div>
          <Label>Frete fixo (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={f.shippingFlat}
            onChange={(e) => setF({ ...f, shippingFlat: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Frete grátis acima de (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={f.freeShippingAbove}
            onChange={(e) => setF({ ...f, freeShippingAbove: Number(e.target.value) })}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Prazo de entrega padrão (dias)</Label>
          <Input
            type="number"
            min="1"
            value={(f as any).deliveryDays ?? 14}
            onChange={(e) =>
              setF({ ...f, ...({ deliveryDays: Number(e.target.value) } as any) })
            }
            className="mt-1 max-w-[200px]"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Usado para calcular a data estimada de entrega mostrada ao cliente nos pedidos.
          </p>
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
