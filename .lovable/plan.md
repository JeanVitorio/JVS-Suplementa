## Objetivo

Remover 100% dos dados mockados (produtos, usuários, cupons, reviews, settings) e ligar todo o sistema (loja + admin) ao Supabase já configurado, usando o schema que você enviou.

## O que vai mudar

### 1. Auth — só Supabase Auth
- `useAuth` (zustand persistido com `defaultUsers`) é substituído por um hook baseado em `supabase.auth` + tabela `profiles` + `user_roles`.
- `login` → `supabase.auth.signInWithPassword`
- `register` → `supabase.auth.signUp` (trigger no banco cria o `profiles`; se não existir, criamos no client após signup)
- `logout` → `supabase.auth.signOut`
- Papel admin lido de `user_roles` via função `has_role` (ou select direto).
- Rotas `/admin/*` passam a checar role real, não `role: "admin"` mockado.

### 2. Store — Zustand vira cache leve sobre Supabase
Removo `defaultProducts`, `defaultUsers`, `defaultReviews`, `defaultCoupons`, `defaultSettings` do uso. O arquivo `src/lib/mock-data.ts` é deletado.

Cada slice vira fetcher Supabase:
- `useProducts` → SELECT/INSERT/UPDATE/DELETE em `products`
- `useCoupons` → tabela `coupons` (campos snake_case: `min_subtotal`, `expires_at`)
- `useReviews` → tabela `reviews`
- `useSettings` → linha única em `settings`
- `useOrders` → `orders` + `order_items` (split em duas inserts)
- Carrinho e favoritos: carrinho continua local (faz sentido pré-login); favoritos passam a usar tabela `wishlist` quando logado.

### 3. Tipos
`src/lib/types.ts` ajustado para refletir o schema (sem `password` em `User`, campos snake_case onde o banco usa, ou mapeamento explícito no fetch). Mantenho camelCase no app e mapeio na borda (`mapProductRow`, etc.) para minimizar mudanças nas telas.

### 4. Checkout
`checkout()` deixa de gravar em zustand e passa a:
1. `insert` em `orders` (com `address` jsonb, `user_id`, totais, cupom)
2. `insert` em `order_items` (um por item)
3. Decrementa `stock` via update
4. Retorna o pedido criado para a tela de sucesso.

### 5. Telas admin
`admin.products`, `admin.orders`, `admin.coupons`, `admin.customers`, `admin.reviews`, `admin.settings`, `admin.stock`, `admin.index` (dashboard) passam a ler/gravar direto do Supabase. Customers lê de `profiles` + agrega de `orders`.

### 6. Loading / erro
Cada slice ganha `loading` e `error`. As telas mostram skeleton/empty state quando não há dados (em vez de cair no mock).

## Pré-requisitos no banco (você precisa confirmar)

Para isso funcionar 100% sem que eu altere seu schema, preciso que **já existam**:
- RLS policies em `products` (SELECT público; INSERT/UPDATE/DELETE só admin)
- RLS em `orders`/`order_items` (usuário vê os seus; admin vê todos)
- RLS em `profiles`, `wishlist`, `reviews`, `coupons`, `settings`, `addresses`
- Função `public.has_role(uuid, app_role)` (security definer)
- Trigger que cria `profiles` no signup (ou eu crio no client após `signUp`)
- GRANTs para `authenticated`/`anon` conforme o caso

Se algo estiver faltando, eu te aviso após a primeira leitura e gero a migration correspondente.

## O que NÃO vou fazer

- Não vou redesenhar UI nenhuma — só troco a fonte de dados.
- Não vou mexer no dashboard "Pulse Motors / Camaro" que construímos antes (ele não usa mocks).
- Não vou apagar `mock-data.ts` até trocar todas as importações (último passo).

## Entrega

Vou aplicar em uma sequência grande de edits (auth → store → checkout → admin → loja → deletar mock). Ao final, `rg "mock-data|defaultProducts|defaultUsers"` deve retornar zero ocorrências.

## Perguntas rápidas antes de começar

1. **Senha do admin atual** (`admin@jvsmodelo.com.br / admin123`) — esse usuário não existe no Supabase. Quer que eu crie uma tela/instrução pra você cadastrar o primeiro admin, ou você já tem um user no Supabase que devo marcar como admin?
2. Posso assumir que **as RLS policies e o trigger de `profiles` já estão criados** no seu projeto Supabase? (Se não, eu gero a migration no caminho.)

Confirma o plano (ou ajusta) que eu sigo.