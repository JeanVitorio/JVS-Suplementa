import { createFileRoute } from "@tanstack/react-router";
import { useReviews, useProducts } from "@/store";
import { Button } from "@/components/ui/button";
import { Star, Trash2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsAdmin });

function ReviewsAdmin() {
  const reviews = useReviews((s) => s.reviews);
  const remove = useReviews((s) => s.remove);
  const products = useProducts((s) => s.products);
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><MessageSquare className="h-5 w-5" /> Avaliações</h1>
        <p className="text-sm text-muted-foreground">Modere comentários e notas dos clientes.</p>
      </div>
      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                ))}</div>
                <span className="font-medium">{r.userName}</span>
                <span className="text-muted-foreground">· {productName(r.productId)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("pt-BR")}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {reviews.length === 0 && <div className="rounded-xl border bg-muted/30 p-10 text-center text-sm text-muted-foreground">Nenhuma avaliação ainda.</div>}
      </div>
    </div>
  );
}
