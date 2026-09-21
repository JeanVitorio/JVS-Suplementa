import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCustomers, useOrders } from "@/store";
import { brl, formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Instagram, MapPin, Calendar, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

type FullProfile = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  address?: Record<string, any> | null;
  created_at: string;
};

function CustomersPage() {
  const users = useCustomers((s) => s.customers);
  const loadCustomers = useCustomers((s) => s.load);
  const orders = useOrders((s) => s.orders);
  const loadOrders = useOrders((s) => s.load);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<FullProfile | null>(null);

  useEffect(() => {
    loadCustomers();
    loadOrders();
  }, [loadCustomers, loadOrders]);

  const openCustomer = async (id: string) => {
    setSelectedId(id);
    const user = users.find((item) => item.id === id);
    setProfile(user ? { id: user.id, name: user.name, email: user.email, avatar_url: user.avatarUrl, whatsapp: user.phone, instagram: user.instagram, address: user.address, created_at: user.createdAt } : null);
  };

  const customerOrders = selectedId
    ? orders.filter((o) => o.userId === selectedId && o.status !== "cancelado")
    : [];

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
              const userOrders = orders.filter((o) => o.userId === u.id && o.status !== "cancelado");
              const total = userOrders.reduce((s, o) => s + o.total, 0);
              return (
                <tr
                  key={u.id}
                  className="cursor-pointer border-t transition hover:bg-muted/40"
                  onClick={() => openCustomer(u.id)}
                >
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
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  Nenhum cliente ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do cliente</DialogTitle>
            <DialogDescription>Todas as informações cadastradas pelo cliente.</DialogDescription>
          </DialogHeader>

          {profile && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-muted text-2xl font-bold uppercase">
                    {profile.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold">{profile.name}</div>
                  <div className="text-sm text-muted-foreground">{profile.email}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={profile.email} />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="WhatsApp"
                  value={profile.whatsapp || "—"}
                />
                <InfoRow
                  icon={<Instagram className="h-4 w-4" />}
                  label="Instagram"
                  value={profile.instagram || "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Cadastrado em"
                  value={formatDate(profile.created_at)}
                />
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4" /> Endereço de entrega
                </div>
                {profile.address ? (
                  <div className="text-sm text-muted-foreground">
                    {profile.address.street}, {profile.address.number}
                    {profile.address.complement ? ` - ${profile.address.complement}` : ""}
                    <br />
                    {profile.address.district} — {profile.address.city}/{profile.address.state}
                    <br />
                    CEP: {profile.address.cep}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4" /> Pedidos ({customerOrders.length})
                </div>
                {customerOrders.length === 0 ? (
                  <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Sem pedidos ainda.
                  </div>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {customerOrders.slice(0, 10).map((o) => (
                      <li key={o.id} className="flex items-center justify-between p-3 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{o.id.slice(0, 8)}
                        </span>
                        <span>{formatDate(o.createdAt)}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.status}</span>
                        <span className="font-semibold">{brl(o.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/10 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
