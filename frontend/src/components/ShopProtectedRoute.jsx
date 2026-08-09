import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ShopProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Staff/Manager/Admin accounts don't belong here — send them to the admin dashboard instead.
  if (user?.role !== 'customer') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}