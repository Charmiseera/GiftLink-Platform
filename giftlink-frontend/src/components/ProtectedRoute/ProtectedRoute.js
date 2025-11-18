import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAppContext();

  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    return <Navigate to="/app/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
