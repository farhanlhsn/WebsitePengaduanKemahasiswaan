/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import React, { Suspense } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import { createLazyComponent, preloadComponent } from "../components/DynamicImportHelper";

// ── Lazy-loaded route components ────────────────────────────────────────────
const HomePage = createLazyComponent(() => import("./HomePage.jsx"));
const LoginPage = createLazyComponent(() => import("./LoginPage.jsx"));
const RegisterPage = createLazyComponent(() => import("./RegisterPage.jsx"));
const ForgotPasswordPage = createLazyComponent(() => import("./ForgotPasswordPage.jsx"));
const ResetPasswordPage = createLazyComponent(() => import("./ResetPasswordPage.jsx"));
const WaitingVerificationPage = createLazyComponent(() => import("./WaitingVerificationPage.jsx"));
const Layout = createLazyComponent(() => import("./layout.jsx"));
const ImprovedStudentDashboard = createLazyComponent(() => import("./ImprovedStudentDashboard.jsx"));
const StudentChatPage = createLazyComponent(() => import("./StudentChatPage.jsx"));
const AuditLogPage = createLazyComponent(() => import("./AuditLogPage.jsx"));
const UnverifiedUsersPage = createLazyComponent(() => import("./UnverifiedUsersPage.jsx"));
const AdminAnalyticsPage = createLazyComponent(() => import("./AdminAnalyticsPage.jsx"));
const CategoryManagementPage = createLazyComponent(() => import("./CategoryManagementPage.jsx"));
const SystemSecurityPage = createLazyComponent(() => import("./SystemSecurityPage.jsx"));
const ProfilePage = createLazyComponent(() => import("./ProfilePage.jsx"));
const SettingsPage = createLazyComponent(() => import("./SettingsPage.jsx"));
const AdminSettingsPage = createLazyComponent(() => import("./AdminSettingsPage.jsx"));
const HelpPage = createLazyComponent(() => import("./HelpPage.jsx"));
const NotFoundPage = createLazyComponent(() => import("./NotFoundPage.jsx"));
const AuthProvider = createLazyComponent(() => import("../components/AuthProvider.jsx"));

// ── HF-8: Admin shell + per-section pages ───────────────────────────────────
const AdminLayout = createLazyComponent(() => import("./admin/AdminLayout.jsx"));
const AdminDashboardPage = createLazyComponent(() => import("./admin/AdminDashboardPage.jsx"));
const AdminUsersPage = createLazyComponent(() => import("./admin/AdminUsersPage.jsx"));
const AdminReportsPage = createLazyComponent(() => import("./admin/AdminReportsPage.jsx"));
const AdminChatPage = createLazyComponent(() => import("./admin/AdminChatPage.jsx"));
const AdminHelpPageWrapped = createLazyComponent(() => import("./admin/AdminHelpPage.jsx"));
const AdminManagementPage = createLazyComponent(() => import("./admin/AdminManagementPage.jsx"));

// Preload critical pages during idle time
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    preloadComponent(() => import("./LoginPage.jsx"));
    preloadComponent(() => import("./RegisterPage.jsx"));
    setTimeout(() => {
      preloadComponent(() => import("./layout.jsx"));
      preloadComponent(() => import("../components/AuthProvider.jsx"));
    }, 1000);
  }, { timeout: 2000 });
}

// Enhanced wrapper with better error boundaries and loading states
const EnhancedLazyWrapper = ({ children, loadingMessage = "Memuat halaman...", boundaryName }) => (
  <ErrorBoundary name={boundaryName}>
    <Suspense fallback={<LoadingSpinner fullScreen message={loadingMessage} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const OptimizedAuthWrapper = ({ children, preloadDashboard = false }) => {
  React.useEffect(() => {
    if (preloadDashboard) {
      setTimeout(() => {
        preloadComponent(() => import("./ImprovedStudentDashboard.jsx"));
      }, 2000);
    }
  }, [preloadDashboard]);

  return (
    <EnhancedLazyWrapper loadingMessage="Memverifikasi autentikasi...">
      <AuthProvider>
        <EnhancedLazyWrapper loadingMessage="Memuat konten...">
          {children}
        </EnhancedLazyWrapper>
      </AuthProvider>
    </EnhancedLazyWrapper>
  );
};

const wrapAdmin = (PageComponent, loadingMessage = "Memuat halaman admin...") => (
  <EnhancedLazyWrapper loadingMessage={loadingMessage}>
    <PageComponent />
  </EnhancedLazyWrapper>
);

const StudentReportRedirect = () => {
  const { id } = useParams();
  return <Navigate replace to={`/dashboard?report=${encodeURIComponent(id || '')}`} />;
};

const AdminReportRedirect = () => {
  const { id } = useParams();
  return <Navigate replace to={`/admin/reports?report=${encodeURIComponent(id || '')}`} />;
};

// ── Router configuration ────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <EnhancedLazyWrapper loadingMessage="Memuat aplikasi...">
        <Layout />
      </EnhancedLazyWrapper>
    ),
    children: [
      { index: true, element: wrapAdmin(HomePage, "Memuat beranda...") },
      { path: "/login", element: wrapAdmin(LoginPage, "Memuat halaman login...") },
      { path: "/register", element: wrapAdmin(RegisterPage, "Memuat halaman registrasi...") },
      { path: "/forgot-password", element: wrapAdmin(ForgotPasswordPage, "Memuat halaman lupa password...") },
      { path: "/reset-password", element: wrapAdmin(ResetPasswordPage, "Memuat halaman reset password...") },
      { path: "/help", element: wrapAdmin(HelpPage, "Memuat halaman bantuan...") },
    ],
  },
  {
    path: "/waiting-verification",
    element: wrapAdmin(WaitingVerificationPage, "Memuat..."),
  },
  {
    path: "/dashboard",
    element: <OptimizedAuthWrapper preloadDashboard><ImprovedStudentDashboard /></OptimizedAuthWrapper>,
  },
  {
    path: "/dashboard/chat",
    element: <OptimizedAuthWrapper preloadDashboard><StudentChatPage /></OptimizedAuthWrapper>,
  },
  {
    path: "/dashboard/chat/:reportId",
    element: <OptimizedAuthWrapper preloadDashboard><StudentChatPage /></OptimizedAuthWrapper>,
  },
  {
    path: "/report/:id",
    element: <OptimizedAuthWrapper><StudentReportRedirect /></OptimizedAuthWrapper>,
  },
  {
    path: "/profile",
    element: <OptimizedAuthWrapper><ProfilePage /></OptimizedAuthWrapper>,
  },
  {
    path: "/settings",
    element: <OptimizedAuthWrapper><SettingsPage /></OptimizedAuthWrapper>,
  },

  // ── HF-8: Admin shell with nested children ────────────────────────────────
  {
    path: "/admin",
    element: <OptimizedAuthWrapper><AdminLayout /></OptimizedAuthWrapper>,
    children: [
      { index: true, element: wrapAdmin(AdminDashboardPage) },
      { path: "users", element: wrapAdmin(AdminUsersPage) },
      // /admin/users/:id used to render the dashboard; keep behavior by reusing
      // AdminUsersPage which has the user-detail modal.
      { path: "users/:id", element: wrapAdmin(AdminUsersPage) },
      { path: "unverified-users", element: wrapAdmin(UnverifiedUsersPage) },
      { path: "reports", element: wrapAdmin(AdminReportsPage) },
      { path: "chat", element: wrapAdmin(AdminChatPage) },
      { path: "audit-logs", element: wrapAdmin(AuditLogPage) },
      { path: "analytics", element: wrapAdmin(AdminAnalyticsPage) },
      { path: "categories", element: wrapAdmin(CategoryManagementPage) },
      { path: "admins", element: wrapAdmin(AdminManagementPage) },
      { path: "system", element: wrapAdmin(SystemSecurityPage) },
      { path: "settings", element: wrapAdmin(AdminSettingsPage) },
      { path: "help", element: wrapAdmin(AdminHelpPageWrapped) },
    ],
  },
  {
    path: "/admin/reports/:id",
    element: <OptimizedAuthWrapper><AdminReportRedirect /></OptimizedAuthWrapper>,
  },

  {
    path: "*",
    element: <EnhancedLazyWrapper loadingMessage="Memuat..."><NotFoundPage /></EnhancedLazyWrapper>,
  },
]);
