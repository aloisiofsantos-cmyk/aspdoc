import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './store/auth';
import { Layout } from './components/layout/Layout';
import { PageLoader } from './components/ui/LoadingSpinner';

// Pages
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ProcessListPage } from './pages/ProcessList';
import { ProcessNewPage } from './pages/ProcessNew';
import { ProcessDetailPage } from './pages/ProcessDetail';
import { SignaturesPage } from './pages/Signatures';
import { ReportsPage } from './pages/Reports';
import { ProfilePage } from './pages/Profile';
import { PublicQueryPage } from './pages/PublicQuery';
import { VerifySignaturePage } from './pages/VerifySignature';

// Admin pages
import { UsersPage } from './pages/admin/Users';
import { DepartmentsPage } from './pages/admin/Departments';
import { SettingsPage } from './pages/admin/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/consulta-publica" element={<PublicQueryPage />} />
      <Route path="/verificar/:signatureId" element={<VerifySignaturePage />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="processos" element={<ProcessListPage />} />
        <Route path="processos/novo" element={<ProcessNewPage />} />
        <Route path="processos/:id" element={<ProcessDetailPage />} />
        <Route path="assinaturas" element={<SignaturesPage />} />
        <Route path="relatorios" element={
          <PrivateRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
            <ReportsPage />
          </PrivateRoute>
        } />
        <Route path="perfil" element={<ProfilePage />} />

        {/* Admin routes */}
        <Route path="admin/usuarios" element={
          <PrivateRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <UsersPage />
          </PrivateRoute>
        } />
        <Route path="admin/departamentos" element={
          <PrivateRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <DepartmentsPage />
          </PrivateRoute>
        } />
        <Route path="admin/configuracoes" element={
          <PrivateRoute roles={['SUPER_ADMIN', 'ADMIN']}>
            <SettingsPage />
          </PrivateRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
