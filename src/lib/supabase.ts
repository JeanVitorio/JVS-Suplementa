import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve as variáveis do Supabase com a seguinte precedência:
 *  1) import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (build local + Netlify build envs)
 *  2) VITE_SUPABASE_PROJECT_ID -> deriva URL automaticamente
 *  3) window.__SUPABASE_CONFIG__ (caso queira injetar via script no HTML)
 *
 * No Netlify basta cadastrar essas variáveis em Site settings → Environment variables;
 * o Vite as embute no bundle durante o build. Localmente, basta um arquivo .env na raiz.
 */
function resolveConfig(): { url?: string; key?: string } {
  const env = (typeof import.meta !== "undefined" ? import.meta.env : {}) as Record<string, string | undefined>;
  let url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const projectId = env.VITE_SUPABASE_PROJECT_ID;

  if (!url && projectId) url = `https://${projectId}.supabase.co`;

  if ((!url || !key) && typeof window !== "undefined") {
    const injected = (window as unknown as { __SUPABASE_CONFIG__?: { url?: string; key?: string } }).__SUPABASE_CONFIG__;
    if (injected) {
      url = url ?? injected.url;
      return { url, key: key ?? injected.key };
    }
  }
  return { url, key };
}

const { url, key } = resolveConfig();

export const supabaseEnabled = Boolean(url && key);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

if (!supabaseEnabled && typeof window !== "undefined") {
  // Apenas um aviso — o app funciona em modo mock sem Supabase.
  console.info("[Bertolleti Shop] Supabase não configurado — rodando em modo mock (localStorage).");
}
