import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PINLogin } from './PINLogin';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PINLogin />;
  }

  return <>{children}</>;
}
