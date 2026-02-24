import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

// Mock supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store
    useAuthStore.setState({
      session: null,
      user: null,
      loading: true,
      initialized: false,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.initialized).toBe(false);
  });

  it('should set session', () => {
    const session = { user: { id: '123' } } as unknown as import('@supabase/supabase-js').Session;
    useAuthStore.getState().setSession(session);
    expect(useAuthStore.getState().session).toEqual(session);
  });

  it('should set user', () => {
    const user = { id: '123', name: 'Test User' } as unknown as import('../lib/types').User;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('should sign out', async () => {
    await useAuthStore.getState().signOut();
    
    expect(supabase.auth.signOut).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should initialize correctly when no session', async () => {
    // Mock getSession to return no session
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock onAuthStateChange
    (supabase.auth.onAuthStateChange as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.session).toBeNull();
  });

  it('should initialize correctly with session and user', async () => {
    const mockSession = { user: { id: 'user-123' } } as unknown as import('@supabase/supabase-js').Session;
    const mockUser = { id: 'user-123', name: 'Test User' };

    // Mock getSession
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock user fetch
    const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    // Mock onAuthStateChange
    (supabase.auth.onAuthStateChange as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.session).toEqual(mockSession);
    expect(state.user).toEqual(mockUser);
    
    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('should handle session restoration error (invalid refresh token)', async () => {
    // Mock getSession error
    (supabase.auth.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid Refresh Token' },
    });

    // Mock onAuthStateChange
    (supabase.auth.onAuthStateChange as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    await useAuthStore.getState().initialize();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
  });
});
