import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePremium?: boolean;
}

export function ProtectedRoute({ children, requirePremium = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute:', { user, profile, loading, requirePremium });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute: loading...', { user, profile, loading });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    console.log('ProtectedRoute: usuário não autenticado, redirecionando para login', { user, profile, loading });
    return <Navigate to="/login" replace />;
  }

  // Wait for profile to load
  if (!profile) {
    console.log('ProtectedRoute: perfil não carregado, exibindo spinner', { user, profile, loading });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute: acesso liberado', { user, profile, loading });
  return <>{children}</>;
}