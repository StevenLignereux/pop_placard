
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import { Users as UsersIcon, Shield, ShieldOff, Check, X, UserPlus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

const Users = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'volunteer' as 'admin' | 'volunteer'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAudit = async (action: string, details: any) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: currentUser?.id,
        action,
        details,
        ip_address: 'client-side' // We can't easily get IP here, but that's fine
      });
    } catch (err) {
      console.error('Failed to log audit:', err);
    }
  };

  const toggleRole = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }

    const newRole = user.role === 'admin' ? 'volunteer' : 'admin';
    if (!window.confirm(`Voulez-vous vraiment changer le rôle de ${user.name} en ${newRole} ?`)) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;
      
      await logAudit('update_role', { target_user: user.email, old_role: user.role, new_role: newRole });
      
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Erreur lors de la modification du rôle');
    }
  };

  const toggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("Vous ne pouvez pas désactiver votre propre compte.");
      return;
    }

    const action = user.is_active ? 'désactiver' : 'activer';
    if (!window.confirm(`Voulez-vous vraiment ${action} le compte de ${user.name} ?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      
      await logAudit('update_status', { target_user: user.email, new_status: !user.is_active });

      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      // Create a temporary client to sign up the user without logging out the admin
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data, error } = await tempSupabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Log the creation
        await logAudit('create_user', { 
          created_email: newUser.email, 
          role: newUser.role,
          user_id: data.user.id 
        });

        // Refresh list
        await fetchUsers();
        
        // Reset and close
        setNewUser({ name: '', email: '', password: '', role: 'volunteer' });
        setShowCreateModal(false);
        alert('Utilisateur créé avec succès !');
      }

    } catch (err: any) {
      console.error('Error creating user:', err);
      setCreateError(err.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : <UsersIcon className="h-5 w-5" />}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Sans nom'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrateur' : 'Bénévole'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => toggleRole(user)}
                          className="text-gray-600 hover:text-purple-600"
                          title={user.role === 'admin' ? 'Rétrograder bénévole' : 'Promouvoir admin'}
                        >
                          {user.role === 'admin' ? <ShieldOff className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={user.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                        >
                          {user.is_active ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Ajouter un utilisateur"
        description="Créez un nouveau compte pour un bénévole ou un administrateur."
        footer={
          <>
            <button
              type="submit"
              form="create-user-form"
              disabled={createLoading}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm ${createLoading ? 'opacity-75 cursor-wait' : ''}`}
            >
              {createLoading ? 'Création...' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </>
        }
      >
        <div className="mt-2">
          {createError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{createError}</span>
            </div>
          )}
          
          <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom complet</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rôle</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'volunteer'})}
              >
                <option value="volunteer">Bénévole</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
