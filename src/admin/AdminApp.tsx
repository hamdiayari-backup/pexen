import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Lock } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminShell } from './layout/AdminShell';
import { ALL_NAV } from './layout/nav';
import { ConfirmProvider } from './ui/overlays';
import { EmptyState, PageSkeleton, Spinner } from './ui/primitives';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AccountSetupPage = lazy(() => import('./pages/AccountSetupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const PagesListPage = lazy(() => import('./pages/PagesListPage'));
const PageEditorPage = lazy(() => import('./pages/PageEditorPage'));
const PostsListPage = lazy(() => import('./pages/PostsListPage'));
const PostEditorPage = lazy(() => import('./pages/PostEditorPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const MenusPage = lazy(() => import('./pages/MenusPage'));
const FormsPage = lazy(() => import('./pages/FormsPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const EngagementPage = lazy(() => import('./pages/EngagementPage'));
const AiPage = lazy(() => import('./pages/AiPage'));
const SeoPage = lazy(() => import('./pages/SeoPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const BrandingPage = lazy(() => import('./pages/BrandingPage'));
const ThemesPage = lazy(() => import('./pages/ThemesPage'));
const GeneralPage = lazy(() => import('./pages/GeneralPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword || user.mustSetup2fa) {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <AccountSetupPage />
      </Suspense>
    );
  }
  return <AdminShell />;
}

/** Applique les permissions définies dans la navigation. */
function Guard({ path, children }: { path: string; children: React.ReactNode }) {
  const { can } = useAuth();
  const item = ALL_NAV.find((n) => n.to === path);
  if (item?.perms && !can(...item.perms)) {
    return <EmptyState icon={Lock} title="Accès restreint" description="Votre rôle ne donne pas accès à cette section. Contactez un administrateur si vous en avez besoin." />;
  }
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

const g = (path: string, el: React.ReactNode) => <Guard path={path}>{el}</Guard>;

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: (
        <Suspense fallback={<FullScreenSpinner />}>
          <LoginPage />
        </Suspense>
      ),
    },
    {
      path: '/reset-password',
      element: (
        <Suspense fallback={<FullScreenSpinner />}>
          <ResetPasswordPage />
        </Suspense>
      ),
    },
    {
      element: <RequireAuth />,
      children: [
        { index: true, element: g('/', <DashboardPage />) },
        { path: 'analytics', element: g('/analytics', <AnalyticsPage />) },
        { path: 'pages', element: g('/pages', <PagesListPage />) },
        { path: 'pages/:id', element: g('/pages', <PageEditorPage />) },
        { path: 'posts', element: g('/posts', <PostsListPage />) },
        { path: 'posts/:id', element: g('/posts', <PostEditorPage />) },
        { path: 'media', element: g('/media', <MediaPage />) },
        { path: 'menus', element: g('/menus', <MenusPage />) },
        { path: 'forms', element: g('/forms', <FormsPage />) },
        { path: 'newsletter', element: g('/newsletter', <NewsletterPage />) },
        { path: 'engagement', element: g('/engagement', <EngagementPage />) },
        { path: 'ai', element: g('/ai', <AiPage />) },
        { path: 'seo', element: g('/seo', <SeoPage />) },
        { path: 'performance', element: g('/performance', <PerformancePage />) },
        { path: 'themes', element: g('/themes', <ThemesPage />) },
        { path: 'branding', element: g('/branding', <BrandingPage />) },
        { path: 'general', element: g('/general', <GeneralPage />) },
        { path: 'maintenance', element: g('/maintenance', <MaintenancePage />) },
        { path: 'settings', element: g('/settings', <SettingsPage />) },
        { path: 'users', element: g('/users', <UsersPage />) },
        { path: 'profile', element: g('/profile', <ProfilePage />) },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: '/administrator' }
);

function Root() {
  return (
    <ConfirmProvider>
      <RouterProvider router={router} />
    </ConfirmProvider>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Root />
      <Toaster richColors position="top-right" closeButton toastOptions={{ className: 'font-sans' }} />
    </AuthProvider>
  );
}
