import { create } from 'zustand';
import { Session, Subscription } from '@supabase/supabase-js';
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
  _initPromise?: Promise<void>;
  _subscription?: Subscription;
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
    // Prevent concurrent initialization
    if (get().initialized) return;
    
    // Check if initialization is already in progress
    const state = get();
    if (state._initPromise) {
      return state._initPromise;
    }

    const initPromise = (async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Error restoring session:', sessionError.message);
          // If the refresh token is invalid, clear the session to prevent infinite loops
          if (sessionError.message.includes('Refresh Token') || sessionError.message.includes('Invalid')) {
             await supabase.auth.signOut();
          }
          set({ session: null });
        } else {
          set({ session });
        }

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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          // Don't trigger loading state for token refresh if we already have the user
          const currentUser = get().user;
          const isSameUser = currentUser?.id === session?.user?.id;
          
          // Optimization: Don't show loader for token refresh or if session matches
          if (event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && isSameUser)) {
            if (session) set({ session });
            return;
          }

          set({ session, loading: true });
          
          // Set a safety timeout to clear loading state in case of stuck requests
          const safetyTimeout = setTimeout(() => {
            if (get().loading) {
              console.warn('Auth loading state stuck, forcing clear');
              set({ loading: false });
            }
          }, 5000);
          
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
            } finally {
              clearTimeout(safetyTimeout);
              set({ loading: false });
            }
          } else {
            clearTimeout(safetyTimeout);
            set({ user: null, loading: false });
          }
        });

        // Store subscription for cleanup if needed (though this store is global)
        set({ _subscription: subscription });

      } catch (error: any) {
        console.error('Auth initialization error:', error);
        // Robust error handling: if any critical auth error occurs, ensure we clean up
        if (error?.message?.includes('Refresh Token') || error?.message?.includes('Invalid')) {
          await supabase.auth.signOut();
        }
      } finally {
        set({ loading: false, initialized: true });
        // Clean up the promise tracker
        // We can't delete from state in Zustand easily without set, but we can set it to undefined
        set({ _initPromise: undefined });
      }
    })();

    // Store the promise
    set({ _initPromise: initPromise });
    return initPromise;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
