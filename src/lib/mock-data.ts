import type { Coupon, Product, Review, Settings } from "@/lib/types";
import wheyImage from "@/assets/whey-product.jpg";
import creatineImage from "@/assets/creatine-product.jpg";
import preworkoutImage from "@/assets/preworkout-product.jpg";
import vitaminImage from "@/assets/vitamin-product.jpg";

const now = "2026-03-01T12:00:00.000Z";

export const mockProducts: Product[] = [
  { id: "whey-isolate", name: "Whey Isolate Black 900g", description: "Proteína isolada de alta pureza para recuperação e construção muscular.", price: 229.9, promo_price: 189.9, stock: 38, images: [wheyImage], category: "Proteínas", sku: "PRO-WHEY-01", active: true, featured: true, createdAt: now },
  { id: "creatine-pure", name: "Creatina Pure 300g", description: "Creatina monohidratada para força, potência e desempenho nos treinos.", price: 139.9, promo_price: 109.9, stock: 64, images: [creatineImage], category: "Creatina", sku: "CRE-PURE-01", active: true, featured: true, createdAt: now },
  { id: "pre-charge", name: "Pré-Treino Charge 300g", description: "Fórmula de alta energia para foco e intensidade do primeiro ao último exercício.", price: 129.9, promo_price: 99.9, stock: 27, images: [preworkoutImage], category: "Pré-treino", sku: "PRE-CHARGE-01", active: true, featured: true, createdAt: now },
  { id: "multi-daily", name: "Multivitamínico Daily 90 caps", description: "Vitaminas e minerais essenciais para uma rotina ativa e equilibrada.", price: 79.9, promo_price: 64.9, stock: 51, images: [vitaminImage], category: "Vitaminas", sku: "VIT-DAILY-01", active: true, featured: true, createdAt: now },
  { id: "whey-concentrate", name: "Whey Concentrado Pro 900g", description: "Proteína concentrada com excelente sabor e dissolução rápida.", price: 169.9, promo_price: 149.9, stock: 42, images: [wheyImage], category: "Proteínas", sku: "PRO-WHEY-02", active: true, featured: false, createdAt: now },
  { id: "creatine-caps", name: "Creatina Caps 120 caps", description: "Praticidade e performance em doses fáceis de levar.", price: 94.9, stock: 31, images: [creatineImage], category: "Creatina", sku: "CRE-CAPS-01", active: true, featured: false, createdAt: now },
  { id: "pre-focus", name: "Pré-Treino Focus 200g", description: "Energia limpa e foco para treinos consistentes.", price: 109.9, stock: 18, images: [preworkoutImage], category: "Pré-treino", sku: "PRE-FOCUS-01", active: true, featured: false, createdAt: now },
  { id: "omega-3", name: "Ômega 3 Ultra 120 caps", description: "Fonte concentrada de EPA e DHA para complementar sua rotina.", price: 89.9, promo_price: 74.9, stock: 47, images: [vitaminImage], category: "Vitaminas", sku: "VIT-OMEGA-01", active: true, featured: false, createdAt: now },
  { id: "mass-gainer", name: "Mass Gainer 3kg", description: "Blend energético com proteínas para apoiar o ganho de massa.", price: 189.9, stock: 22, images: [wheyImage], category: "Hipercalóricos", sku: "MASS-3K-01", active: true, featured: false, createdAt: now },
  { id: "bcaa-recovery", name: "BCAA Recovery 200g", description: "Aminoácidos para suporte à recuperação muscular.", price: 84.9, stock: 35, images: [preworkoutImage], category: "Aminoácidos", sku: "AMI-BCAA-01", active: true, featured: false, createdAt: now },
  { id: "protein-bar", name: "Protein Bar Caixa 12 un.", description: "Snack proteico prático para qualquer momento do dia.", price: 119.9, promo_price: 99.9, stock: 25, images: [wheyImage], category: "Snacks", sku: "SNK-BAR-12", active: true, featured: false, createdAt: now },
  { id: "zma-night", name: "ZMA Night 90 caps", description: "Minerais essenciais para completar sua rotina noturna.", price: 69.9, stock: 39, images: [vitaminImage], category: "Vitaminas", sku: "VIT-ZMA-01", active: true, featured: false, createdAt: now },
];

export const mockReviews: Review[] = mockProducts.flatMap((product, index) => [
  { id: `review-${index}-1`, productId: product.id, userId: "client-1", userName: "Marina S.", rating: index % 3 === 0 ? 5 : 4, comment: "Chegou rápido e já entrou na rotina.", createdAt: now },
  { id: `review-${index}-2`, productId: product.id, userId: "client-2", userName: "Rafael M.", rating: 5, comment: "Ótimo produto e embalagem impecável.", createdAt: now },
]);

export const mockCoupons: Coupon[] = [
  { id: "coupon-1", code: "BEMVINDO10", type: "percent", value: 10, minSubtotal: 0, active: true, expiresAt: null, createdAt: now },
  { id: "coupon-2", code: "SUPLEMENTO15", type: "percent", value: 15, minSubtotal: 299, active: true, expiresAt: null, createdAt: now },
  { id: "coupon-3", code: "TREINO10", type: "fixed", value: 10, minSubtotal: 99, active: true, expiresAt: null, createdAt: now },
];

export const mockSettings: Settings = {
  storeName: "Bertolleti Performance",
  storeDescription: "Suplementação selecionada para quem leva evolução a sério.",
  logoUrl: "",
  pix_key: "demo@bertolleti.com.br",
  pix_holder: "Bertolleti Performance",
  stripe_public_key: "",
  stripe_secret_key: "",
  shippingFlat: 19.9,
  freeShippingAbove: 299,
  whatsapp: "+55 46 99110-2704",
  email: "contato@bertolleti.com.br",
};