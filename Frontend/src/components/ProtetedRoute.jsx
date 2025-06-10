import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROUTES, redirectToRoute } from '../utils/routes';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al home si no está autenticado
    redirectToRoute(ROUTES.HOME);
    return null;
  }

  return children;
};

export default ProtectedRoute;