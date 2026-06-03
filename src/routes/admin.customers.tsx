import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useOrders } from "@/store";
import { brl, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const users = useAuth((s) => s.users.filter(u => u.role === "client"));
  const orders = useOrders((s) => s.orders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">{users.length} clientes cadastrados</p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-left">Cadastro</th>
              <th className="p-3 text-right">Pedidos</th>
              <th className="p-3 text-right">Total gasto</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userOrders = orders.filter(o => o.userId === u.id && o.status !== "cancelado");
              const total = userOrders.reduce((s, o) => s + o.total, 0);
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold uppercase">
                        {u.name.slice(0, 1)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="p-3 text-right">{userOrders.length}</td>
                  <td className="p-3 text-right font-semibold">{brl(total)}</td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Nenhum cliente ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
