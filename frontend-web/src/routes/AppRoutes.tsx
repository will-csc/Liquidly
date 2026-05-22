import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { hasActiveSession } from '@/lib/authStorage';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const SignUpPage = lazy(() => import('../pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ControlPanelPage = lazy(() => import('../pages/ControlPanelPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const BomPage = lazy(() => import('../pages/BomPage'));
const ReportPage = lazy(() => import('../pages/ReportPage'));
const ConversionsPage = lazy(() => import('../pages/ConversionsPage'));
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'));

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  if (!hasActiveSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando pagina...</div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={hasActiveSession() ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ControlPanelPage />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="bom" element={<BomPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="conversions" element={<ConversionsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
