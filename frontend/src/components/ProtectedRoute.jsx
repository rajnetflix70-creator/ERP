import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ roles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const userRole = user?.role || user?.role_name;
    const universalAdmin = ['super_admin', 'company_admin'];
    
    if (!universalAdmin.includes(userRole) && !roles.includes(userRole)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

