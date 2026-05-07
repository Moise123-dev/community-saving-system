import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, managerOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in → back to role selection
  if (!user) return <Navigate to="/" replace />;

  // Wrong role → back to their own dashboard
  if (managerOnly && user.role !== 'manager') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
