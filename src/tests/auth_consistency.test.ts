
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Auth Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ session: null, user: null, loading: false, initialized: false });
    // Reset the promise
    useAuthStore.setState({ _initPromise: undefined });
  });

  it('should sign out if user is authenticated but has no profile in public.users', async () => {
    // Setup: Session exists
    const mockSession = { user: { id: 'ghost-user' } };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession }, error: null });

    // Setup: Profile does NOT exist (maybeSingle returns null)
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    // Action: Initialize store
    await useAuthStore.getState().initialize();

    // Assert: signOut should be called
    expect(supabase.auth.signOut).toHaveBeenCalled();
    
    // Assert: Session should be null in store
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('should stay logged in if user has a valid profile', async () => {
    // Setup: Session exists
    const mockSession = { user: { id: 'valid-user' } };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession }, error: null });

    // Setup: Profile exists
    const mockProfile = { id: 'valid-user', role: 'volunteer', is_active: true };
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    // Action: Initialize store
    await useAuthStore.getState().initialize();

    // Assert: signOut should NOT be called
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    
    // Assert: Session and User should be set
    expect(useAuthStore.getState().session).toEqual(mockSession);
    expect(useAuthStore.getState().user).toEqual(mockProfile);
  });
});
