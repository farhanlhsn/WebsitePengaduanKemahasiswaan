import { createBrowserRouter } from "react-router-dom";
import HomePage from "./HomePage.jsx";
import LoginPage from "./LoginPage.jsx";
import RegisterPage from "./RegisterPage.jsx";
import Layout from "./layout.jsx";
import ImprovedStudentDashboard from "./ImprovedStudentDashboard.jsx";
import EnhancedAdminDashboard from "./EnhancedAdminDashboard.jsx";
import ReportDetailPage from "./ReportDetailPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import SettingsPage from "./SettingsPage.jsx";
import HelpPage from "./HelpPage.jsx";
import AuthProvider from "../components/AuthProvider.jsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
                <Layout />
        ),
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "/login",
                element: <LoginPage />,
            },
            {
                path: "/register",
                element: <RegisterPage />,
            },
            {
                path: "/help",
                element: <HelpPage />,
            },
        ]
    }, 
    {
        path: "/dashboard",
        element: (
            <AuthProvider>
                <ImprovedStudentDashboard />
            </AuthProvider>
        ),
    },
    {
        path: "/report/:id",
        element: (
            <AuthProvider>
                <ReportDetailPage />
            </AuthProvider>
        ),
    },
    {
        path: "/profile",
        element: (
            <AuthProvider>
                <ProfilePage />
            </AuthProvider>
        ),
    },
    {
        path: "/settings",
        element: (
            <AuthProvider>
                <SettingsPage />
            </AuthProvider>
        ),
    },
    {
        path: "/admin",
        element: (
            <AuthProvider>
                <EnhancedAdminDashboard />
            </AuthProvider>
        ),
    },
    {
        path: "/admin/users",
        element: (
            <AuthProvider>
                <EnhancedAdminDashboard />
            </AuthProvider>
        ),
    },
    {
        path: "/admin/reports",
        element: (
            <AuthProvider>
                <EnhancedAdminDashboard />
            </AuthProvider>
        ),
    },
    {
        path: "/admin/chat",
        element: (
            <AuthProvider>
                <EnhancedAdminDashboard />
            </AuthProvider>
        ),
    },
    {
        path: "/admin/users/:id",
        element: (
            <AuthProvider>
                <EnhancedAdminDashboard />
            </AuthProvider>
        ),
    },
    
]);