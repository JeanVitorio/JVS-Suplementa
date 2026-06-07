import { createFileRoute, Link } from "@tanstack/react-router";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { ProductCard } from "@/components/shop/ProductCard";
import { useProducts, useWishlist } from "@/store";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favoritos — Bertolleti Shop" },
      { name: "description", content: "Seus produtos favoritos." },
    ],
    links: [{ rel: "canonical", href: "/favorites" }],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const ids = useWishlist((s) => s.ids);
  const clear = useWishlist((s) => s.clear);
  const allProducts = useProducts((s) => s.products);
  const products = allProducts.filter((p) => ids.includes(p.id));

  return (
    <div className="min-h-screen">
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Heart className="h-6 w-6 text-destructive" /> Favoritos
            </h1>
            <p className="text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "produto salvo" : "produtos salvos"}
            </p>
          </div>
          {products.length > 0 && (
            <Button variant="outline" onClick={clear}>
              Limpar tudo
            </Button>
          )}
        </div>
        {products.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Você ainda não favoritou nada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Toque no coração nos produtos para salvá-los aqui.
            </p>
            <Link to="/" className="mt-4 inline-block">
              <Button>Explorar a loja</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <ShopFooter />
    </div>
  );
}
