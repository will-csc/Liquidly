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

const hasValidSession = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return false;
    const maybe = parsed as { email?: unknown; id?: unknown };
    const hasEmail = typeof maybe.email === "string" && maybe.email.trim().length > 0;
    const hasId = typeof maybe.id === "number" || typeof maybe.id === "string";
    return hasEmail || hasId;
  } catch {
    return false;
  }
};

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  if (!hasValidSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={hasValidSession() ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
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
