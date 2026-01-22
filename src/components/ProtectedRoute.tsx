
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = () => {
  const { session, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check if user profile is loaded and active
  // We allow a brief moment where user might be null while fetching, but 'loading' should cover it.
  // If loading is false and user is null (but session exists), it might be a sync issue or first login before profile creation? 
  // But profile creation is atomic with trigger.
  if (user && !user.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Compte désactivé</h2>
          <p className="text-gray-600 mb-6">
            Votre compte a été désactivé par un administrateur. 
            Veuillez contacter le responsable pour plus d'informations.
          </p>
          <button
            onClick={() => useAuthStore.getState().signOut()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
