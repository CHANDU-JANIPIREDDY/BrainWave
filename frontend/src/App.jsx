import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import AppShell from './components/AppShell.jsx';
import BrandMark from './components/BrandMark.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ServiceRoute from './components/ServiceRoute.jsx';
import Forbidden from './components/Forbidden.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminPanelPage from './pages/AdminPanelPage.jsx';
import PeoplePage from './pages/PeoplePage.jsx';
import CRMPage from './pages/CRMPage.jsx';
import DeskPage from './pages/DeskPage.jsx';
import BooksPage from './pages/BooksPage.jsx';

function Splash() {
  return (
    <div className="splash">
      <BrandMark size={48} />
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function AdminRoute() {
  const { user, loading, canAccessAdmin } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessAdmin()) {
    return <Forbidden message="403 Forbidden: Admin access only." />;
  }
  return <AdminPanelPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/services/people"
            element={
              <ServiceRoute service="people">
                <PeoplePage />
              </ServiceRoute>
            }
          />
          <Route
            path="/services/crm"
            element={
              <ServiceRoute service="crm">
                <CRMPage />
              </ServiceRoute>
            }
          />
          <Route
            path="/services/desk"
            element={
              <ServiceRoute service="desk">
                <DeskPage />
              </ServiceRoute>
            }
          />
          <Route
            path="/services/books"
            element={
              <ServiceRoute service="books">
                <BooksPage />
              </ServiceRoute>
            }
          />
          <Route path="/admin" element={<AdminRoute />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
