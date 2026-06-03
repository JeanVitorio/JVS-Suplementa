import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useProducts } from "@/store";
import { ProductForm } from "@/components/admin/ProductForm";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products/new")({
  component: NewProduct,
});

function NewProduct() {
  const router = useRouter();
  const add = useProducts((s) => s.add);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo produto</h1>
      <ProductForm
        onSubmit={(data) => {
          add(data);
          toast.success("Produto criado!");
          router.navigate({ to: "/admin/products" });
        }}
      />
    </div>
  );
}
