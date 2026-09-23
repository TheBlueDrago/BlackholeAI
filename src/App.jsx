import { Suspense } from 'react';
import { lazyRetry as lazy } from '@/lib/lazyRetry';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Splash from '@/components/Splash';
import OfflineBanner from '@/components/OfflineBanner';
import Home from '@/pages/Home';
const Chat = lazy(() => import('@/pages/Chat'));
const Billing = lazy(() => import('@/pages/Billing'));
const ThankYou = lazy(() => import('@/pages/ThankYou'));
const Plans = lazy(() => import('@/pages/Plans'));
const PromoSuccess = lazy(() => import('@/pages/PromoSuccess'));
import SiteView from '@/pages/SiteView';
const Buy = lazy(() => import('@/pages/Buy'));
const Report = lazy(() => import('@/pages/Report'));
const Terms = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.Terms })));
const Privacy = lazy(() => import('@/pages/Legal').then((m) => ({ default: m.Privacy })));
const Showcase = lazy(() => import('@/pages/Showcase'));
const Contact = lazy(() => import('@/pages/Contact'));
const Play = lazy(() => import('@/pages/Play'));
const Arcade = lazy(() => import('@/pages/Arcade'));
const Templates = lazy(() => import('@/pages/Templates'));
const Business = lazy(() => import('@/pages/Business'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const About = lazy(() => import('@/pages/About'));
import { captureReferral } from '@/lib/referral';

// Remember an invite code (?ref=) from whatever page the link opened.
captureReferral();
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
const WorkspaceShell = lazy(() => import('@/components/WorkspaceShell').then((m) => ({ default: m.WorkspaceShell })));
const ChatWorkspace = lazy(() => import('@/components/WorkspaceShell').then((m) => ({ default: m.ChatWorkspace })));
const CodeWorkspace = lazy(() => import('@/components/WorkspaceShell').then((m) => ({ default: m.CodeWorkspace })));
const DesignerWorkspace = lazy(() => import('@/components/DesignerWorkspace'));
const DesignerDashboard = lazy(() => import('@/pages/chat/DesignerDashboard'));
const PlansView = lazy(() => import('@/pages/chat/Views').then((m) => ({ default: m.PlansView })));
const MonitorView = lazy(() => import('@/pages/chat/Views').then((m) => ({ default: m.MonitorView })));
const PromosView = lazy(() => import('@/pages/chat/Views').then((m) => ({ default: m.PromosView })));
const SettingsView = lazy(() => import('@/pages/chat/Views').then((m) => ({ default: m.SettingsView })));
const GamesFront = lazy(() => import('@/pages/chat/GamesFront'));
const GamesDesignerWorkspace = lazy(() => import('@/components/GamesDesignerWorkspace'));
const GameView = lazy(() => import('@/pages/chat/GameView'));
const BlackholeBrowser = lazy(() => import('@/pages/chat/BlackholeBrowser'));

// Signed out: a shared game link (/chat/game/<name>) opens the public player instead of the login page.
function SignedOutRedirect() {
  const game = /^\/chat\/game\/([^/]+)/.exec(useLocation().pathname);
  return <Navigate to={game ? `/play/${game[1]}` : "/login"} replace />;
}

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
    <div className="w-8 h-8 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app. Pages load on demand (see the lazy imports above) so the
  // first visit doesn't download every page at once.
  return (
    <Suspense fallback={<PageSpinner />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/site/:name" element={<SiteView />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/report" element={<Report />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/showcase" element={<Showcase />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/play/:name" element={<Play />} />
      <Route path="/arcade" element={<Arcade />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/business" element={<Business />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<SignedOutRedirect />} />}>
        <Route path="/chat" element={<Chat />}>
          <Route element={<WorkspaceShell />}>
            <Route index element={<ChatWorkspace />} />
            <Route path="code" element={<CodeWorkspace />} />
          </Route>
          <Route path="designer" element={<DesignerDashboard />} />
          <Route path="designer/build" element={<DesignerWorkspace />} />
          <Route path="browser" element={<BlackholeBrowser />} />
          <Route path="games" element={<GamesFront />} />
          <Route path="game-designer" element={<GamesDesignerWorkspace />} />
          <Route path="game/:name" element={<GameView />} />
          <Route path="plans" element={<PlansView />} />
          <Route path="monitor" element={<MonitorView />} />
          <Route path="promos" element={<PromosView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="/billing" element={<Billing />} />
        <Route path="/promo-success" element={<PromoSuccess />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Splash />
          <OfflineBanner />
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App