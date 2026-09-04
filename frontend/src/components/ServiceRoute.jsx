import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Forbidden from './Forbidden.jsx';
import { SkeletonPage } from './Skeleton.jsx';

export default function ServiceRoute({ service, children }) {
  const { user, loading, canAccessService } = useAuth();

  if (loading) return <SkeletonPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessService(service)) {
    return <Forbidden message="403 Forbidden: You are not authorized to open this Zoho service." />;
  }

  return children;
}
