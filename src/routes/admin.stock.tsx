import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProducts } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/stock")({
  component: StockPage,
});

function StockPage() {
  const products = useProducts((s) => s.products);
  const adjustStock = useProducts((s) => s.adjustStock);
  const setStock = useProducts((s) => s.setStock);
  const [q, setQ] = useState("");
  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
        <p className="text-sm text-muted-foreground">Ajuste rápido das quantidades</p>
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
              <th className="p-3 text-center">Estoque</th>
              <th className="p-3 text-right">Ajuste</th>
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
                    <div className="font-medium">{p.name}</div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{p.sku}</td>
                <td className="p-3 text-center">
                  <Input
                    type="number" min="0"
                    value={p.stock}
                    onChange={(e) => setStock(p.id, Number(e.target.value))}
                    className="mx-auto w-24 text-center"
                  />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="icon" onClick={() => { adjustStock(p.id, -1); }}><Minus className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => { adjustStock(p.id, 1); }}><Plus className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { adjustStock(p.id, 10); toast.success("+10 unidades"); }}>+10</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
