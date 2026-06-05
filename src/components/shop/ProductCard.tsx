import { Link } from "@tanstack/react-router";
import { ShoppingBag, Heart, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart, useWishlist, useReviews } from "@/store";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  // ✅ pega direto o array, sem lógica dentro
  const ids = useWishlist((s) => s.ids);
  const toggleFav = useWishlist((s) => s.toggle);

  // ✅ calcula fora
  const isFav = ids.includes(product.id);

  // ✅ pega função estável
  const getAvg = useReviews((s) => s.avg);
  const rating = getAvg(product.id);

  const price = product.promo_price ?? product.price;
  const hasPromo =
    product.promo_price != null && product.promo_price < product.price;

  const off = hasPromo
    ? Math.round((1 - (product.promo_price as number) / product.price) * 100)
    : 0;

  const out = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-elevated">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {hasPromo && !out && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            -{off}%
          </span>
        )}

        {out && (
          <span className="absolute left-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Esgotado
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFav(product.id);
            toast.success(
              isFav
                ? "Removido dos favoritos"
                : "Adicionado aos favoritos"
            );
          }}
          aria-label="Favoritar"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
        >
          <Heart
            className={`h-4 w-4 ${
              isFav
                ? "fill-destructive text-destructive"
                : "text-foreground"
            }`}
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{product.category}</span>

          {rating.count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {rating.score.toFixed(1)}
              <span className="opacity-60">
                ({rating.count})
              </span>
            </span>
          )}
        </div>

        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {hasPromo && (
              <div className="text-xs text-muted-foreground line-through">
                {brl(product.price)}
              </div>
            )}
            <div className="text-base font-semibold">
              {brl(price)}
            </div>
          </div>

          <Button
            size="icon"
            variant="secondary"
            disabled={out}
            onClick={() => {
              add(product.id, 1);
              toast.success("Adicionado ao carrinho");
            }}
            aria-label="Adicionar"
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}