import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, uploadProductImage, generateUniqueSku } from "@/store";
import type { Product } from "@/lib/types";
import { Plus, X, Upload, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

type Form = Omit<Product, "id" | "createdAt">;

export function ProductForm({
  initial,
  onSubmit,
}: {
  initial?: Product;
  onSubmit: (data: Form) => void;
}) {
  const categories = useCategories((s) => s.categories);
  const [f, setF] = useState<Form>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    promo_price: initial?.promo_price ?? null,
    stock: initial?.stock ?? 0,
    weight: initial?.weight ?? 1,
    length: initial?.length ?? 20,
    height: initial?.height ?? 10,
    width: initial?.width ?? 15,
    images: initial?.images ?? [],
    category: initial?.category ?? categories[0] ?? "",
    sku: initial?.sku ?? "",
    active: initial?.active ?? true,
    featured: initial?.featured ?? false,
  });
  const [newImg, setNewImg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [autoSku, setAutoSku] = useState(!initial?.sku);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let sku = f.sku.trim();
    if (autoSku || !sku) {
      sku = await generateUniqueSku();
    }
    const payload: Form = {
      ...f,
      sku,
      images: f.images.length ? f.images : [`https://picsum.photos/seed/${Date.now()}/800`],
    };
    onSubmit(payload);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadProductImage(file);
      if (url) uploaded.push(url);
      else toast.error(`Falha ao subir ${file.name}`);
    }
    if (uploaded.length) setF((p) => ({ ...p, images: [...p.images, ...uploaded] }));
    setUploading(false);
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Informações</h2>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input
                required
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                rows={5}
                className="mt-1"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>SKU (código único do produto)</Label>
                <Input
                  value={f.sku}
                  onChange={(e) => setF({ ...f, sku: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select
                  value={f.category}
                  onChange={(e) => setF({ ...f, category: e.target.value })}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {categories.length === 0 && <option value="">Sem categoria</option>}
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Imagens</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {f.images.map((src, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-md bg-muted"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="Remover imagem"
                  onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-6 text-sm text-muted-foreground hover:bg-muted/50">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Clique para enviar imagens do seu computador
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={newImg}
              onChange={(e) => setNewImg(e.target.value)}
              placeholder="...ou cole uma URL"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (newImg) {
                  setF({ ...f, images: [...f.images, newImg] });
                  setNewImg("");
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Preço & estoque</h2>
          <div className="space-y-3">
            <div>
              <Label>Preço (R$) *</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={f.price}
                onChange={(e) => setF({ ...f, price: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Preço promocional (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={f.promo_price ?? ""}
                onChange={(e) =>
                  setF({ ...f, promo_price: e.target.value ? Number(e.target.value) : null })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Estoque *</Label>
              <Input
                required
                type="number"
                min="0"
                step="1"
                value={f.stock}
                onChange={(e) =>
                  setF({ ...f, stock: Math.max(0, Math.floor(Number(e.target.value))) })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Visibilidade</h2>
          <label className="flex items-center justify-between py-1.5 text-sm">
            <span>Produto ativo</span>
            <input
              type="checkbox"
              checked={f.active}
              onChange={(e) => setF({ ...f, active: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between py-1.5 text-sm">
            <span>Destaque</span>
            <input
              type="checkbox"
              checked={f.featured}
              onChange={(e) => setF({ ...f, featured: e.target.checked })}
            />
          </label>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Frete</h2>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Peso (kg)" value={f.weight} min={0.01} step={0.01} onChange={(weight) => setF({ ...f, weight })} />
            <NumberField label="Comprimento (cm)" value={f.length} min={16} onChange={(length) => setF({ ...f, length })} />
            <NumberField label="Altura (cm)" value={f.height} min={2} onChange={(height) => setF({ ...f, height })} />
            <NumberField label="Largura (cm)" value={f.width} min={11} onChange={(width) => setF({ ...f, width })} />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Salvar produto
        </Button>
      </aside>
    </form>
  );
}

function NumberField({
  label,
  value,
  min,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        required
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1"
      />
    </div>
  );
}
