import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { User } from '../lib/types';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  initialized: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  initialize: async () => {
    if (get().initialized) return;

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      set({ session });

      if (session?.user) {
        // Fetch user profile
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!error && userProfile) {
          set({ user: userProfile });
        }
      }

      // Listen for changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        // Don't trigger loading state for token refresh if we already have the user
        const currentUser = get().user;
        const isSameUser = currentUser?.id === session?.user?.id;
        
        if (event === 'TOKEN_REFRESHED' && isSameUser) {
          set({ session });
          return;
        }

        set({ session, loading: true });
        
        if (session?.user) {
          try {
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) throw error;
            set({ user: userProfile });
          } catch (error) {
            console.error('Error refreshing user profile:', error);
            // In case of error, if we had a user, we might want to keep it or handle it.
            // But we must stop loading.
          } finally {
            set({ loading: false });
          }
        } else {
          set({ user: null, loading: false });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
