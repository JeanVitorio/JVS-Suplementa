import { createFileRoute } from "@tanstack/react-router";
import { ShopHeader, ShopFooter } from "@/components/shop/ShopChrome";
import { Leaf, Sparkles, ShieldCheck, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "Sobre — JVS Modelo" },
    { name: "description", content: "Curadoria premium em produtos para uma vida com mais design." },
  ], links: [{ rel: "canonical", href: "/about" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <main>
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Design que fica.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">A JVS Modelo nasceu para reunir peças bem feitas, com propósito e estética atemporal. Cada produto é selecionado por durabilidade, função real e beleza.</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-4">
          {[
            { Icon: Sparkles, title: "Curadoria", text: "Selecionamos cada item à mão." },
            { Icon: Leaf, title: "Sustentável", text: "Marcas com cadeia responsável." },
            { Icon: ShieldCheck, title: "Garantia", text: "30 dias para troca sem complicação." },
            { Icon: Heart, title: "Atendimento", text: "Suporte humano, real, rápido." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="h-6 w-6 text-foreground" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
      <ShopFooter />
    </div>
  );
}
