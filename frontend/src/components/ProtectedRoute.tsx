import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/store/auth';

export default function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin()) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}
