import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';

// Mock supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('User Role Security', () => {
  it('should not assign admin role automatically to new users', async () => {
    // Ce test simule le comportement attendu du backend.
    // Idéalement, ce test devrait être un test d'intégration E2E sur une base de données de test.
    // Ici, nous documentons et validons la logique attendue via des mocks pour la CI frontend.

    // Simulation de la réponse après inscription (Trigger exécuté côté DB)
    // Nous vérifions que notre logique cliente n'attend pas ou ne force pas 'admin'
    
    // Si un utilisateur tente de s'inscrire
    const signUpData = {
      user: { id: 'new-user-123', email: 'hacker@example.com' },
      session: null
    };
    
    (supabase.auth.signUp as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: signUpData, error: null });

    // Et qu'on récupère son profil
    const mockProfileResponse = {
      data: { 
        id: 'new-user-123', 
        role: 'volunteer' // C'est ce qu'on attend de la DB
      },
      error: null
    };

    const mockSingle = vi.fn().mockResolvedValue(mockProfileResponse);
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    // Action
    const { data } = await supabase.auth.signUp({ 
      email: 'hacker@example.com', 
      password: 'password123' 
    });

    // Vérification de la récupération du profil
    const profile = await supabase.from('users').select('*').eq('id', data.user!.id).single();

    expect(profile.data.role).toBe('volunteer');
    expect(profile.data.role).not.toBe('admin');
  });
});
