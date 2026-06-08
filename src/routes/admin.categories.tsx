import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCategories, uploadProductImage } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/store";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const items = useCategories((s) => s.items);
  const load = useCategories((s) => s.load);
  const add = useCategories((s) => s.add);
  const update = useCategories((s) => s.update);
  const remove = useCategories((s) => s.remove);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">{items.length} categorias cadastradas</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Categoria</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-right">Posição</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3 text-right">{c.position}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!confirm(`Excluir "${c.name}"?`)) return;
                        await remove(c.id);
                        toast.success("Categoria excluída");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                  Nenhuma categoria. Crie a primeira.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSave={async (data) => {
          if (editing) {
            await update(editing.id, data);
            toast.success("Categoria atualizada");
          } else {
            const created = await add(data);
            if (!created) {
              toast.error("Falha ao criar categoria");
              return;
            }
            toast.success("Categoria criada");
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Category | null;
  onSave: (data: { name: string; slug?: string; imageUrl?: string; position?: number }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [position, setPosition] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setSlug(editing?.slug ?? "");
      setImageUrl(editing?.imageUrl ?? "");
      setPosition(editing?.position ?? 0);
    }
  }, [open, editing]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadProductImage(file);
    setUploading(false);
    if (url) setImageUrl(url);
    else toast.error("Falha ao enviar imagem");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error("Informe o nome");
            onSave({ name: name.trim(), slug, imageUrl: imageUrl || undefined, position });
          }}
        >
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="(gerado do nome)"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Posição</Label>
            <Input
              type="number"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Imagem</Label>
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 h-24 w-24 rounded-md object-cover" />
            )}
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground hover:bg-muted/50">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Enviar imagem
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="...ou URL"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}