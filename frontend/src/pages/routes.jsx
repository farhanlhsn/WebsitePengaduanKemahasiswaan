import { createBrowserRouter } from "react-router-dom";
import React, { Suspense } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { createLazyComponent, preloadComponent } from "../components/DynamicImportHelper";

// Enhanced lazy loading with preloading strategies
const HomePage = createLazyComponent(() => import("./HomePage.jsx"));
const LoginPage = createLazyComponent(() => import("./LoginPage.jsx"));
const RegisterPage = createLazyComponent(() => import("./RegisterPage.jsx"));
const Layout = createLazyComponent(() => import("./layout.jsx"));
const ImprovedStudentDashboard = createLazyComponent(() => import("./ImprovedStudentDashboard.jsx"));
const StudentChatPage = createLazyComponent(() => import("./StudentChatPage.jsx"));
const EnhancedAdminDashboard = createLazyComponent(() => import("./EnhancedAdminDashboard.jsx"));
const ReportDetailPage = createLazyComponent(() => import("./ReportDetailPage.jsx"));
const AdminReportDetailPage = createLazyComponent(() => import("./AdminReportDetailPage.jsx"));
const AuditLogPage = createLazyComponent(() => import("./AuditLogPage.jsx"));
const UnverifiedUsersPage = createLazyComponent(() => import("./UnverifiedUsersPage.jsx"));
const AdminAnalyticsPage = createLazyComponent(() => import("./AdminAnalyticsPage.jsx"));
const CategoryManagementPage = createLazyComponent(() => import("./CategoryManagementPage.jsx"));
const SystemSecurityPage = createLazyComponent(() => import("./SystemSecurityPage.jsx"));
const ProfilePage = createLazyComponent(() => import("./ProfilePage.jsx"));
const SettingsPage = createLazyComponent(() => import("./SettingsPage.jsx"));
const AdminSettingsPage = createLazyComponent(() => import("./AdminSettingsPage.jsx"));
const HelpPage = createLazyComponent(() => import("./HelpPage.jsx"));
const AuthProvider = createLazyComponent(() => import("../components/AuthProvider.jsx"));
const Footer = createLazyComponent(() => import("../components/footer.jsx"));

// Preload critical pages during idle time
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Preload authentication pages (likely to be accessed)
    preloadComponent(() => import("./LoginPage.jsx"));
    preloadComponent(() => import("./RegisterPage.jsx"));
    
    // Preload layout after auth pages
    setTimeout(() => {
      preloadComponent(() => import("./layout.jsx"));
      preloadComponent(() => import("../components/AuthProvider.jsx"));
    }, 1000);
  }, { timeout: 2000 });
}

// Enhanced wrapper with better error boundaries and loading states
const EnhancedLazyWrapper = ({ children, loadingMessage = "Memuat halaman..." }) => (
  <Suspense 
    fallback={
      <LoadingSpinner 
        fullScreen 
        message={loadingMessage}
      />
    }
  >
    {children}
  </Suspense>
);

// Optimized auth wrapper with progressive loading
const OptimizedAuthWrapper = ({ children, preloadDashboard = false }) => {
  React.useEffect(() => {
    if (preloadDashboard) {
      // Preload dashboard components when user is likely to access them
      setTimeout(() => {
        preloadComponent(() => import("./ImprovedStudentDashboard.jsx"));
      }, 2000);
    }
  }, [preloadDashboard]);

  return (
    <EnhancedLazyWrapper loadingMessage="Memverifikasi autentikasi...">
      <AuthProvider>
        <EnhancedLazyWrapper loadingMessage="Memuat konten dashboard...">
          {children}
        </EnhancedLazyWrapper>
      </AuthProvider>
    </EnhancedLazyWrapper>
  );
};

// Route configuration with optimized loading
export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <EnhancedLazyWrapper loadingMessage="Memuat aplikasi...">
                <Layout />
            </EnhancedLazyWrapper>
        ),
        children: [
            {
                index: true,
                element: (
                    <EnhancedLazyWrapper loadingMessage="Memuat beranda...">
                        <HomePage />
                    </EnhancedLazyWrapper>
                ),
            },
            {
                path: "/login",
                element: (
                    <EnhancedLazyWrapper loadingMessage="Memuat halaman login...">
                        <LoginPage />
                    </EnhancedLazyWrapper>
                ),
            },
            {
                path: "/register",
                element: (
                    <EnhancedLazyWrapper loadingMessage="Memuat halaman registrasi...">
                        <RegisterPage />
                    </EnhancedLazyWrapper>
                ),
            },
            {
                path: "/help",
                element: (
                    <EnhancedLazyWrapper loadingMessage="Memuat halaman bantuan...">
                        <HelpPage />
                    </EnhancedLazyWrapper>
                ),
            },
        ]
    }, 
    {
        path: "/dashboard",
        element: (
            <OptimizedAuthWrapper preloadDashboard={true}>
                <ImprovedStudentDashboard />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/dashboard/chat",
        element: (
            <OptimizedAuthWrapper preloadDashboard={true}>
                <StudentChatPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/dashboard/chat/:reportId",
        element: (
            <OptimizedAuthWrapper preloadDashboard={true}>
                <StudentChatPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/report/:id",
        element: (
            <OptimizedAuthWrapper>
                <ReportDetailPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/profile",
        element: (
            <OptimizedAuthWrapper>
                <ProfilePage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/settings",
        element: (
            <OptimizedAuthWrapper>
                <SettingsPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin",
        element: (
            <OptimizedAuthWrapper>
                <EnhancedAdminDashboard />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/users",
        element: (
            <OptimizedAuthWrapper>
                <EnhancedAdminDashboard />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/reports",
        element: (
            <OptimizedAuthWrapper>
                <EnhancedAdminDashboard />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/reports/:id",
        element: (
            <OptimizedAuthWrapper>
                <AdminReportDetailPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/chat",
        element: (
            <OptimizedAuthWrapper>
                <EnhancedAdminDashboard />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/users/:id",
        element: (
            <OptimizedAuthWrapper>
                <EnhancedAdminDashboard />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/audit-logs",
        element: (
            <OptimizedAuthWrapper>
                <AuditLogPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/unverified-users",
        element: (
            <OptimizedAuthWrapper>
                <UnverifiedUsersPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/analytics",
        element: (
            <OptimizedAuthWrapper>
                <AdminAnalyticsPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/categories",
        element: (
            <OptimizedAuthWrapper>
                <CategoryManagementPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/system",
        element: (
            <OptimizedAuthWrapper>
                <SystemSecurityPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/settings",
        element: (
            <OptimizedAuthWrapper>
                <AdminSettingsPage />
            </OptimizedAuthWrapper>
        ),
    },
    {
        path: "/admin/help",
        element: (
            <OptimizedAuthWrapper>
                <EnhancedAdminDashboard />
            </OptimizedAuthWrapper>
        ),
    },
]);