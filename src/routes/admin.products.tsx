import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useProducts } from "@/store";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  component: ProductsList,
});

function ProductsList() {
  const products = useProducts((s) => s.products);
  const remove = useProducts((s) => s.remove);
  const update = useProducts((s) => s.update);
  const [q, setQ] = useState("");
  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <Link to="/admin/products/new"><Button><Plus className="mr-2 h-4 w-4" /> Novo produto</Button></Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-right">Preço</th>
              <th className="p-3 text-right">Estoque</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{p.sku}</td>
                <td className="p-3 text-right">
                  {p.promo_price ? (
                    <div>
                      <div className="text-xs text-muted-foreground line-through">{brl(p.price)}</div>
                      <div className="font-medium">{brl(p.promo_price)}</div>
                    </div>
                  ) : brl(p.price)}
                </td>
                <td className="p-3 text-right">
                  <span className={p.stock === 0 ? "text-destructive font-medium" : p.stock <= 5 ? "text-warning font-medium" : ""}>{p.stock}</span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => update(p.id, { active: !p.active })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}
                  >
                    {p.active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Link to="/admin/products/$id" params={{ id: p.id }}>
                      <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm(`Excluir "${p.name}"?`)) { remove(p.id); toast.success("Produto excluído"); }
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
