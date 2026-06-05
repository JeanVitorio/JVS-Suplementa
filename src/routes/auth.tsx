/* ---------------- Auth (COM SUPABASE) ---------------- */
import { supabase } from "@/lib/supabase";

interface AuthState {
  currentUser: User | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      loading: false,

      fetchUser: async () => {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          set({ currentUser: null });
          return;
        }

        set({
          currentUser: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name ?? "",
            role: "client",
            createdAt: data.user.created_at,
          },
        });
      },

      login: async (email, password) => {
        set({ loading: true });

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ loading: false });
          return { ok: false, error: error.message };
        }

        await useAuth.getState().fetchUser();

        set({ loading: false });
        return { ok: true };
      },

      register: async ({ name, email, password }) => {
        set({ loading: true });

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) {
          set({ loading: false });
          return { ok: false, error: error.message };
        }

        await useAuth.getState().fetchUser();

        set({ loading: false });
        return { ok: true };
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null });
      },
    }),
    {
      name: "bsh-auth",
    }
  )
);