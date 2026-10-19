import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  verifyingToken: boolean;
  authError: string | null;
  
  // Actions
  initialize: () => () => void;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  verifyingToken: false,
  authError: null,

  initialize: () => {
    // Check for magic link tokens in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const token_hash = urlParams.get('token_hash');
    const type = (urlParams.get('type') || 'email') as 'email' | 'signup' | 'magiclink';

    if (token_hash) {
      set({ verifyingToken: true });
      supabase.auth
        .verifyOtp({ token_hash, type })
        .then(({ data, error }) => {
          if (error) {
            set({ authError: error.message });
          } else if (data.session) {
            set({ session: data.session, user: data.session.user });
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .finally(() => {
          set({ verifyingToken: false, isLoading: false });
        });
    } else {
      // Standard session restoration
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) set({ authError: error.message });
        set({ session, user: session?.user ?? null, isLoading: false });
      });
    }

    // Subscribe to Supabase auth events as the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });

    return () => subscription.unsubscribe();
  },

  signInWithMagicLink: async (email: string) => {
    set({ authError: null });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error ? new Error(error.message) : null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  clearAuthError: () => {
    set({ authError: null });
    window.history.replaceState({}, document.title, window.location.pathname);
  },
}));