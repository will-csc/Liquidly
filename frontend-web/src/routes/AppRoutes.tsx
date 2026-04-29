import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ControlPanelPage from '../pages/ControlPanelPage';
import DashboardPage from '../pages/DashboardPage';
import BomPage from '../pages/BomPage';
import ReportPage from '../pages/ReportPage';
import ConversionsPage from '../pages/ConversionsPage';
import ProjectsPage from '../pages/ProjectsPage';
import { hasActiveSession } from '@/lib/authStorage';

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  if (!hasActiveSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
  return (
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
  );
};

export default AppRoutes;
