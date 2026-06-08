import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/store";
import type { Product } from "@/lib/types";
import { Plus, X } from "lucide-react";

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
    images: initial?.images ?? [],
    category: initial?.category ?? categories[0] ?? "",
    sku: initial?.sku ?? "",
    active: initial?.active ?? true,
    featured: initial?.featured ?? false,
  });
  const [newImg, setNewImg] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Form = {
      ...f,
      images: f.images.length ? f.images : [`https://picsum.photos/seed/${Date.now()}/800`],
    };
    onSubmit(payload);
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
                <button
                  type="button"
                  onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={newImg}
              onChange={(e) => setNewImg(e.target.value)}
              placeholder="URL da imagem"
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
          <p className="mt-2 text-xs text-muted-foreground">
            Cole uma URL de imagem. Em produção, conecte o storage de imagens.
          </p>
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

        <Button type="submit" className="w-full" size="lg">
          Salvar produto
        </Button>
      </aside>
    </form>
  );
}
