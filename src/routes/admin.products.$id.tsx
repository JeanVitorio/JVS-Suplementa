import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useProducts } from "@/store";
import { ProductForm } from "@/components/admin/ProductForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const router = useRouter();
  const product = useProducts((s) => s.products.find((p) => p.id === id));
  const update = useProducts((s) => s.update);

  if (!product) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/admin/products" className="mt-4 inline-block"><Button>Voltar</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar produto</h1>
      <ProductForm
        initial={product}
        onSubmit={(data) => {
          update(id, data);
          toast.success("Produto atualizado!");
          router.navigate({ to: "/admin/products" });
        }}
      />
    </div>
  );
}
