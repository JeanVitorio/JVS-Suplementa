import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCoupons } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: CouponsAdmin });

function CouponsAdmin() {
  const coupons = useCoupons((s) => s.coupons);
  const add = useCoupons((s) => s.add);
  const update = useCoupons((s) => s.update);
  const remove = useCoupons((s) => s.remove);
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "fixed", value: 10, minSubtotal: 0, active: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Tag className="h-5 w-5" /> Cupons</h1>
        <p className="text-sm text-muted-foreground">Crie e gerencie códigos promocionais.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.code.trim()) return toast.error("Informe o código");
          add({ ...form, code: form.code.toUpperCase(), expiresAt: null });
          setForm({ code: "", type: "percent", value: 10, minSubtotal: 0, active: true });
          toast.success("Cupom criado");
        }}
        className="grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 md:grid-cols-6"
      >
        <Input placeholder="CÓDIGO" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="percent">Percentual %</option>
          <option value="fixed">Valor fixo R$</option>
        </select>
        <Input type="number" min={0} step="0.01" placeholder="Valor" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        <Input type="number" min={0} step="0.01" placeholder="Mínimo R$" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: Number(e.target.value) })} />
        <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><span className="text-sm">Ativo</span></div>
        <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Código</th><th className="p-3">Tipo</th><th className="p-3">Valor</th><th className="p-3">Mínimo</th><th className="p-3">Ativo</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">{c.type === "percent" ? "%" : "R$"}</td>
                <td className="p-3">{c.type === "percent" ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`}</td>
                <td className="p-3">{c.minSubtotal ? `R$ ${c.minSubtotal.toFixed(2)}` : "—"}</td>
                <td className="p-3"><Switch checked={c.active} onCheckedChange={(v) => update(c.id, { active: v })} /></td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum cupom cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
